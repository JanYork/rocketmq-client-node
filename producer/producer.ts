import assert from 'node:assert';
import { setTimeout } from 'node:timers/promises';
import {
  ClientType,
  MessageType,
  TransactionResolution
} from '../rpc/apache/rocketmq/v2/definition_pb';
import {
  EndTransactionRequest,
  HeartbeatRequest,
  NotifyClientTerminationRequest,
  RecoverOrphanedTransactionCommand,
  SendMessageRequest
} from '../rpc/apache/rocketmq/v2/service_pb';
import { ProducerOptions } from './interface/producer-options';
import { ExponentialBackoffRetryPolicy } from '../retry';
import { PublishingSetting } from './publish-setting';
import { Transaction } from './transaction';
import { createResource } from '../util';
import { StatusChecker, TooManyRequestsException } from '../exception';
import {
  Message,
  MessageOptions,
  MessageView,
  PublishMessage
} from '../message';
import { RpcBaseClient, Setting } from '../client';
import { SendReceipt } from './send-receipt';
import { Endpoints, MessageQueue, TopicRoute } from '../model';
import { PublishingLoadBalancer } from './publish-load-balancer';
import { ITransactionChecker } from './interface/transaction-checker';

/**
 * RocketMQ 生产者
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午3:37
 */
export class Producer extends RpcBaseClient {
  /**
   * 发布设置
   * @private
   */
  readonly #publishingSetting: PublishingSetting;

  /**
   * 事务检查器
   * @private
   */
  readonly #checker?: ITransactionChecker;

  /**
   * 发布路由数据缓存
   * @private
   */
  #publishingRouteCache = new Map<string, PublishingLoadBalancer>();

  constructor(options: ProducerOptions) {
    if (!options.topics && options.topic) {
      options.topics = Array.isArray(options.topic)
        ? options.topic
        : [options.topic];
    }
    super(options);

    // 详细可查阅：https://rocketmq.apache.org/docs/introduction/03limits/
    // 默认消息发送重试次数上限为 3 次
    const retryPolicy = ExponentialBackoffRetryPolicy.immediatelyRetryPolicy(
      options.maxAttempts ?? 3
    );

    this.#publishingSetting = new PublishingSetting(
      this.id,
      this.endpoints,
      retryPolicy,
      this.requestTimeout,
      this.topics
    );

    this.logger?.debug({
      message: 'Producer created',
      context: {
        clientId: this.id,
        topics: this.topics,
        setting: this.#publishingSetting
      }
    });

    this.#checker = options.checker;
  }

  /**
   * 获取发布设置。
   */
  get publishingSetting() {
    return this.#publishingSetting;
  }

  /**
   * 开始一个事务。
   */
  beginTransaction() {
    assert(this.#checker, 'Transaction checker should not be null');

    this.logger?.debug({
      message: 'Begin a transaction',
      context: {
        clientId: this.id
      }
    });

    return new Transaction(this);
  }

  /**
   * 结束一个事务。
   *
   * @param endpoints 端点
   * @param message 消息
   * @param messageId 消息 ID
   * @param transactionId 事务 ID
   * @param resolution 事务解析
   */
  async endTransaction(
    endpoints: Endpoints,
    message: Message,
    messageId: string,
    transactionId: string,
    resolution: TransactionResolution
  ) {
    const request = new EndTransactionRequest()
      .setMessageId(messageId)
      .setTransactionId(transactionId)
      .setTopic(createResource(message.topic))
      .setResolution(resolution);

    const response = await this.manager.endTransaction(
      endpoints,
      request,
      this.requestTimeout
    );

    this.logger?.debug({
      message: 'End a transaction',
      context: {
        clientId: this.id,
        endpoints,
        messageId,
        transactionId,
        resolution
      }
    });

    StatusChecker.check(response.getStatus()?.toObject());
  }

  /**
   * 恢复隔离事务消息。
   *
   * @param endpoints
   * @param command
   */
  async onRecoverOrphanedTransactionCommand(
    endpoints: Endpoints,
    command: RecoverOrphanedTransactionCommand
  ) {
    const transactionId = command.getTransactionId();
    const messagePB = command.getMessage()!;
    const messageId = messagePB.getSystemProperties()!.getMessageId();

    if (!this.#checker) {
      this.logger.error({
        message: 'No transaction checker registered, ignore it',
        context: {
          messageId,
          transactionId,
          endpoints,
          clientId: this.id
        }
      });
      return;
    }

    let messageView: MessageView;

    try {
      messageView = new MessageView(messagePB);
    } catch (err) {
      this.logger.error({
        message:
          'Failed to decode message during orphaned transaction message recovery',
        context: {
          messageId,
          transactionId,
          endpoints,
          clientId: this.id,
          error: err
        }
      });
      return;
    }

    try {
      const resolution = await this.#checker.check(messageView);
      if (
        resolution === null ||
        resolution === TransactionResolution.TRANSACTION_RESOLUTION_UNSPECIFIED
      ) {
        return;
      }

      await this.endTransaction(
        endpoints,
        messageView,
        messageId,
        transactionId,
        resolution
      );

      this.logger.info({
        message: 'Recover orphaned transaction message success',
        context: {
          transactionId,
          resolution,
          messageId,
          clientId: this.id
        }
      });
    } catch (err) {
      this.logger.error({
        message: 'Exception raised while checking the transaction',
        context: {
          messageId,
          transactionId,
          endpoints,
          clientId: this.id,
          error: err
        }
      });

      return;
    }
  }

  /**
   * 获取RocketMQ发布设置。
   *
   * @protected
   */
  protected getSetting(): Setting {
    return this.#publishingSetting;
  }

  /**
   * 包装心跳请求。
   *
   * @protected
   */
  protected wrapHeartbeatRequest(): HeartbeatRequest {
    this.logger?.debug({
      message: 'Wrap heartbeat request',
      context: {
        clientId: this.id
      }
    });

    return new HeartbeatRequest().setClientType(ClientType.PRODUCER);
  }

  /**
   * 包装通知客户端终止请求。
   *
   * @protected
   */
  protected wrapNotifyClientTerminationRequest(): NotifyClientTerminationRequest {
    return new NotifyClientTerminationRequest();
  }

  /**
   * 发送消息。
   *
   * @param message 消息
   * @param transaction 事务
   */
  async send(message: MessageOptions, transaction?: Transaction) {
    this.logger?.debug({
      message: 'Send message',
      context: {
        clientId: this.id,
        message,
        transaction
      }
    });

    if (!transaction) {
      const sendReceipts = await this.#send([message], false);
      return sendReceipts[0];
    }

    const publishingMessage = transaction.tryAddMessage(message);
    const sendReceipts = await this.#send([message], true);
    const sendReceipt = sendReceipts[0];

    transaction.tryAddReceipt(publishingMessage, sendReceipt);

    this.logger?.debug({
      message: 'Send message successfully',
      context: {
        clientId: this.id,
        message,
        transaction
      }
    });

    return sendReceipt;
  }

  /**
   * 发送消息（私有）。
   *
   * @param messages 消息列表
   * @param txEnabled 是否启用事务
   * @private
   */
  async #send(messages: MessageOptions[], txEnabled: boolean) {
    const pubMessages: PublishMessage[] = [];
    const topics = new Set<string>();

    for (const message of messages) {
      pubMessages.push(
        new PublishMessage(message, this.#publishingSetting, txEnabled)
      );
      topics.add(message.topic);
    }

    if (topics.size > 1) {
      throw new TypeError(
        `Messages to send have different topics=${JSON.stringify(topics)}`
      );
    }

    const topic = pubMessages[0].topic;
    const messageType = pubMessages[0].messageType;
    const messageGroup = pubMessages[0].messageGroup;
    const messageTypes = new Set(pubMessages.map(m => m.messageType));

    if (messageTypes.size > 1) {
      throw new TypeError(
        `Messages to send have different types=${JSON.stringify(messageTypes)}`
      );
    }

    // 如果消息类型为 FIFO，则消息组必须相同，否则无需继续。
    if (messageType === MessageType.FIFO) {
      const messageGroups = new Set(pubMessages.map(m => m.messageGroup!));
      if (messageGroups.size > 1) {
        throw new TypeError(
          `FIFO messages to send have message groups, messageGroups=${JSON.stringify(messageGroups)}`
        );
      }
    }

    // 获取发布主题路由
    const loadBalancer = await this.#getPublishingLoadBalancer(topic);

    // 提前准备候选消息队列以进行重试发送
    const candidates = messageGroup
      ? [loadBalancer.takeMessageQueueByMessageGroup(messageGroup)]
      : this.#takeMessageQueues(loadBalancer);

    return await this.#send0(topic, messageType, candidates, pubMessages, 1);
  }

  /**
   * 包装发送消息请求。
   *
   * @param pubMessages 发布消息列表
   * @param mq 消息队列
   * @private
   */
  #wrapSendMessageRequest(pubMessages: PublishMessage[], mq: MessageQueue) {
    const request = new SendMessageRequest();

    for (const pubMessage of pubMessages) {
      request.addMessages(pubMessage.toProtobuf(mq));
    }

    return request;
  }

  /**
   * 隔离指定的端点。
   *
   * @param endpoints 端点
   * @private
   */
  #isolate(endpoints: Endpoints) {
    this.isolated.set(endpoints.facade, endpoints);
  }

  /**
   * 发送消息（私有）。
   *
   * @param topic 主题
   * @param messageType 消息类型
   * @param candidates 消息队列候选者
   * @param messages 消息列表
   * @param attempt 尝试次数
   * @private
   */
  async #send0(
    topic: string,
    messageType: MessageType,
    candidates: MessageQueue[],
    messages: PublishMessage[],
    attempt: number
  ): Promise<SendReceipt[]> {
    // 计算当前消息队列
    const index = (attempt - 1) % candidates.length;
    const mq = candidates[index];
    const acceptMessageTypes = mq.acceptMessageTypesList;

    if (
      this.#publishingSetting.isValidateMessageType() &&
      !acceptMessageTypes.includes(messageType)
    ) {
      throw new TypeError(
        'Current message type not match with ' +
          'topic accept message types, topic=' +
          topic +
          ', actualMessageType=' +
          messageType +
          ', ' +
          'acceptMessageTypes=' +
          JSON.stringify(acceptMessageTypes)
      );
    }

    const endpoints = mq.broker.endpoints;
    const maxAttempts = this.#getRetryPolicy().getMaxAttempts();
    const request = this.#wrapSendMessageRequest(messages, mq);
    let sendReceipts: SendReceipt[] = [];

    try {
      const response = await this.manager.sendMessage(
        endpoints,
        request,
        this.requestTimeout
      );
      sendReceipts = SendReceipt.processResponseInvocation(mq, response);
    } catch (err) {
      const messageIds = messages.map(m => m.messageId);
      // 由于发送失败而隔离端点。
      this.#isolate(endpoints);

      if (attempt >= maxAttempts) {
        // 不需要更多的尝试了
        this.logger.error({
          message: 'Failed to send message finally',
          context: {
            maxAttempts,
            attempt,
            topic,
            messageIds,
            endpoints,
            clientId: this.id
          },
          error: err
        });

        throw err;
      }

      // 无需再尝试事务性消息
      if (messageType === MessageType.TRANSACTION) {
        this.logger.error({
          message: 'Failed to send transactional message finally',
          context: {
            maxAttempts,
            attempt,
            topic,
            messageIds,
            endpoints,
            clientId: this.id
          },
          error: err
        });
        throw err;
      }

      // 尝试做更多的尝试
      const nextAttempt = 1 + attempt;
      // 如果请求未受到限制，请立即重试
      if (!(err instanceof TooManyRequestsException)) {
        this.logger.error({
          message: 'Failed to send message, would attempt to resend right now',
          context: {
            maxAttempts,
            attempt,
            topic,
            messageIds,
            endpoints,
            clientId: this.id
          },
          error: err
        });

        return this.#send0(
          topic,
          messageType,
          candidates,
          messages,
          nextAttempt
        );
      }

      const delay = this.#getRetryPolicy().getNextAttemptDelay(nextAttempt);
      this.logger.warn({
        message: 'Failed to send message due to too many requests',
        context: {
          delay,
          maxAttempts,
          attempt,
          topic,
          messageIds,
          endpoints,
          clientId: this.id
        },
        error: err
      });

      await setTimeout(delay);
      return this.#send0(topic, messageType, candidates, messages, nextAttempt);
    }

    // 成功重新发送消息
    if (attempt > 1) {
      const messageIds = sendReceipts.map(r => r.messageId);

      this.logger.info({
        message: 'Resend message successfully',
        context: {
          topic,
          messageIds,
          maxAttempts,
          attempt,
          endpoints,
          clientId: this.id
        }
      });
    }
    // 首次尝试成功发送消息，直接返回。
    return sendReceipts;
  }

  /**
   * 获取发布负载均衡器。
   *
   * @param topic 主题
   * @private
   */
  async #getPublishingLoadBalancer(topic: string) {
    let loadBalancer = this.#publishingRouteCache.get(topic);

    if (!loadBalancer) {
      const topicRoute = await this.getRoute(topic);
      loadBalancer = this.#updatePublishingLoadBalancer(topic, topicRoute);
    }

    return loadBalancer;
  }

  /**
   * 更新发布负载均衡器。
   *
   * @param topic 主题
   * @param topicRoute 主题路由
   * @private
   */
  #updatePublishingLoadBalancer(topic: string, topicRoute: TopicRoute) {
    let loadBalancer = this.#publishingRouteCache.get(topic);

    if (loadBalancer) {
      loadBalancer = loadBalancer.update(topicRoute);
    } else {
      loadBalancer = new PublishingLoadBalancer(topicRoute);
    }

    this.#publishingRouteCache.set(topic, loadBalancer);
    return loadBalancer;
  }

  /**
   * 从路由中获取消息队列以进行消息发布。
   *
   * @param loadBalancer 发布负载均衡器
   * @private
   */
  #takeMessageQueues(loadBalancer: PublishingLoadBalancer) {
    return loadBalancer.takeMessageQueues(
      this.isolated,
      this.#getRetryPolicy().getMaxAttempts()
    );
  }

  /**
   * 获取重试策略。
   *
   * @private
   */
  #getRetryPolicy() {
    return this.#publishingSetting.getRetryPolicy()!;
  }
}
