import { ClientType } from '../rpc/apache/rocketmq/v2/definition_pb';
import {
  HeartbeatRequest,
  NotifyClientTerminationRequest
} from '../rpc/apache/rocketmq/v2/service_pb';
import { Consumer } from './consumer';
import { PushSubscriptionSetting } from './setting/push-subscription.setting';
import { SubscriptionLoadBalancer } from './subscription-load-balancer';
import { MessageListener } from './listener/message.listener';
import { Logger } from '../logger';
import { PushConsumerOptions } from './interface/push-consumer-options';
import { MessageResult } from '../enum';
import { createResource } from '../util';
import { TopicRoute } from '../model';
import { MessageView } from '../message';
import { FilterExpression } from './filter-expression';

/**
 * push消费者。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/9 下午8:04
 */
export class PushConsumer extends Consumer {
  /**
   * PUSH订阅设置
   * @private
   */
  readonly #pushSubscriptionSetting: PushSubscriptionSetting;

  /**
   * 订阅表达式映射
   * @private
   */
  readonly #subscriptionExpressionMap = new Map<string, FilterExpression>();

  /**
   * 订阅路由数据缓存
   * @private
   */
  readonly #subscriptionRouteCache = new Map<
    string,
    SubscriptionLoadBalancer
  >();

  /**
   * 长轮询超时时间
   * @private
   */
  readonly #awaitDuration: number;

  /**
   * 当前订阅主题索引
   * @private
   */
  #topicIndex = 0;

  /**
   * 长轮询间隔等待时间
   * @private
   */
  readonly #longPollingInterval: number;

  /**
   * 是否已关闭
   * @private
   */
  isShutdown = false;

  /**
   * 单次receive拉取消息最大数量
   */
  readonly maxMessageNum: number;

  /**
   * 是否顺序消费
   */
  readonly isFifo: boolean;

  /**
   * 异步拉取消息的数量(小于等于maxMessageNum)
   */
  #asyncPullBatchSize: number;

  /**
   * 锁对象，预留该机制，以后可能要用到，消息顺序无需锁
   */
  // readonly #locker: ILock<unknown>;

  /**
   * 消息监听器
   * @private
   */
  readonly #listener: MessageListener;

  /**
   * 日志记录器
   */
  readonly #logger: Logger;

  /**
   * 消息不可见时间
   */
  readonly #invisibleDuration: number;

  /**
   * 一个错误钩子，用于处理消费者内部错误
   */
  errorHook?: (error: Error) => void;

  constructor(options: PushConsumerOptions) {
    options.topics = Array.from(options.subscriptions.keys());
    super(options);

    this.#logger = options.logger;
    this.errorHook = options.errorHook;

    for (const [topic, filter] of options.subscriptions.entries()) {
      if (typeof filter === 'string') {
        // filter is tag string
        this.#subscriptionExpressionMap.set(
          topic,
          new FilterExpression(filter)
        );
      } else {
        this.#subscriptionExpressionMap.set(topic, filter);
      }
    }

    this.#awaitDuration = options.awaitDuration ?? 30000;
    this.#listener = options.listener;
    this.isFifo = options.isFifo ?? false;
    this.#invisibleDuration = options.invisibleDuration ?? 15000;

    if (options.isFifo) {
      this.maxMessageNum = 1;
    } else {
      this.maxMessageNum = options.maxMessageNum ?? 10;
    }

    this.#asyncPullBatchSize = this.maxMessageNum;
    this.#longPollingInterval = options.longPollingInterval ?? 1000;
    // this.#locker = options.locker;

    this.#pushSubscriptionSetting = new PushSubscriptionSetting(
      this.id,
      this.endpoints,
      this.consumerGroup,
      this.namespace ?? '',
      this.requestTimeout,
      this.#awaitDuration,
      this.#subscriptionExpressionMap,
      this.maxMessageNum,
      this.isFifo,
      this.#invisibleDuration
      // this.#locker
    );

    this.#logger?.debug({
      message: 'Push consumer created',
      context: {
        id: this.id,
        setting: this.#pushSubscriptionSetting
      }
    });
  }

  /**
   * 开始注册监听
   */
  async startup() {
    // 启动消费者
    await super.startup();

    this.#logger?.debug({
      message: 'Push consumer started',
      context: {
        id: this.id,
        group: this.consumerGroup,
        topics: this.topics,
        isFifo: this.isFifo
      }
    });

    this.#listener?.onStart();

    // 开始持续长轮询拉取消息
    this.consumeMessages().catch(error => {
      this.#logger?.error({
        message: 'An error occurred during message consumption',
        error
      });
      this.#listener?.onError?.(error);
      this.errorHook?.(error);
    });
  }

  /**
   * 关闭监听消费
   */
  async shutdown() {
    this.isShutdown = true;
    await super.shutdown();
    this.#listener?.onStop();
    this.#logger?.debug({
      message: 'Push consumer stopped',
      context: {
        id: this.id,
        group: this.consumerGroup,
        topics: this.topics,
        isFifo: this.isFifo
      }
    });
  }

  /**
   * 消费消息。
   */
  async consumeMessages() {
    this.#logger?.debug({
      message: 'Start polling to consume messages'
    });

    try {
      const batchSize = this.isFifo
        ? this.maxMessageNum
        : this.#asyncPullBatchSize;

      if (batchSize >= 0) {
        const messages = await this.#receive(
          batchSize,
          this.#invisibleDuration
        );

        if (messages.length > 0) {
          if (!this.isFifo) {
            // 更新 #asyncPullBatchSize，以保持正在处理的消息数小于 maxMessageNum
            this.#asyncPullBatchSize -= messages.length;
          }

          for (const message of messages) {
            try {
              // 如果是顺序消费，则同步执行ack
              if (this.isFifo) {
                const result = await this.#listener.onMessage(message);

                if (result === MessageResult.SUCCESS) {
                  await this.#ack(message);
                }
              } else {
                this.#listener
                  .onMessage(message)
                  .then(async result => {
                    if (result === MessageResult.SUCCESS) {
                      await this.#ack(message);
                      this.#asyncPullBatchSize++; // 异步 ack 成功后，增加一个空闲位置
                    }
                  })
                  .catch(error => {
                    this.#logger?.error({
                      message: 'An error occurred during message processing',
                      error
                    });
                    this.#listener?.onError?.(error);
                    this.errorHook?.(error);
                  });
              }
            } catch (error) {
              this.#logger?.error({
                message: 'An error occurred during FIFO message processing',
                error
              });
              this.#listener?.onError?.(error);
              this.errorHook?.(error);
            }
          }
        }
      }
    } catch (error) {
      this.#logger?.error({
        message: 'An error occurred',
        error
      });

      this.#listener?.onError?.(error);
      this.errorHook?.(error);
    } finally {
      // 为了缓解服务器压力，等待一段时间后再次拉取消息
      await new Promise(resolve =>
        setTimeout(resolve, this.#longPollingInterval)
      );

      if (!this.isShutdown) {
        this.#logger?.debug({
          message: 'Continue polling to consume messages'
        });
        await this.consumeMessages();
      }
    }
  }

  /**
   * 获取设置。
   *
   * @protected
   */
  protected getSetting() {
    return this.#pushSubscriptionSetting;
  }

  /**
   * 包装心跳请求。
   *
   * @protected
   */
  protected wrapHeartbeatRequest() {
    this.#logger?.debug({
      message: 'Wrap heartbeat request'
    });
    return new HeartbeatRequest()
      .setClientType(ClientType.SIMPLE_CONSUMER)
      .setGroup(createResource(this.consumerGroup));
  }

  /**
   * 包装通知客户端终止请求。
   *
   * @protected
   */
  protected wrapNotifyClientTerminationRequest() {
    return new NotifyClientTerminationRequest().setGroup(
      createResource(this.consumerGroup)
    );
  }

  /**
   * 订阅路由数据更新。
   *
   * @param topic 主题
   * @param topicRoute 路由数据
   * @protected
   */
  protected onTopicRouteUpdate(topic: string, topicRoute: TopicRoute) {
    this.#updateSubscriptionLoadBalancer(topic, topicRoute);
  }

  /**
   * 更新订阅负载均衡器。
   *
   * @param topic 主题
   * @param topicRoute 路由数据
   * @private
   */
  #updateSubscriptionLoadBalancer(topic: string, topicRoute: TopicRoute) {
    let subscriptionLoadBalancer = this.#subscriptionRouteCache.get(topic);
    if (!subscriptionLoadBalancer) {
      subscriptionLoadBalancer = new SubscriptionLoadBalancer(topicRoute);
    } else {
      subscriptionLoadBalancer = subscriptionLoadBalancer.update(topicRoute);
    }
    this.#subscriptionRouteCache.set(topic, subscriptionLoadBalancer);
    return subscriptionLoadBalancer;
  }

  /**
   * 获取订阅负载均衡器。
   *
   * @param topic 主题
   * @private
   */
  async #getSubscriptionLoadBalancer(topic: string) {
    let loadBalancer = this.#subscriptionRouteCache.get(topic);
    if (!loadBalancer) {
      const topicRouteData = await this.getRoute(topic);
      loadBalancer = this.#updateSubscriptionLoadBalancer(
        topic,
        topicRouteData
      );
    }
    return loadBalancer;
  }

  /**
   * 订阅主题。
   *
   * @param topic 主题
   * @param filterExpression 订阅表达式
   */
  async subscribe(topic: string, filterExpression: FilterExpression) {
    await this.getRoute(topic);
    this.#subscriptionExpressionMap.set(topic, filterExpression);
    this.#logger?.debug({
      message: 'Subscribe topic',
      context: {
        topic,
        filterExpression
      }
    });
  }

  /**
   * 取消订阅主题。
   *
   * @param topic 主题
   */
  unsubscribe(topic: string) {
    this.#subscriptionExpressionMap.delete(topic);
    this.#logger?.debug({
      message: 'Unsubscribe topic',
      context: {
        topic
      }
    });
  }

  /**
   * 接收消息。
   *
   * @param maxMessageNum 最大消息数，默认 10 条
   * @param invisibleDuration 消息不可见时间，默认 15 秒
   */
  async #receive(maxMessageNum = 10, invisibleDuration = 15000) {
    const topic = this.#nextTopic();
    const filterExpression = this.#subscriptionExpressionMap.get(topic)!;
    const loadBalancer = await this.#getSubscriptionLoadBalancer(topic);
    const mq = loadBalancer.takeMessageQueue();
    const request = this.wrapReceiveMessageRequest(
      maxMessageNum,
      mq,
      filterExpression,
      invisibleDuration,
      this.#awaitDuration
    );
    this.#logger?.debug({
      message: 'Receive message',
      context: {
        topic,
        filterExpression,
        maxMessageNum,
        invisibleDuration,
        request
      }
    });

    return await this.receiveMessage(request, mq, this.#awaitDuration);
  }

  async #ack(message: MessageView) {
    await this.ackMessage(message);
  }

  /**
   * 下一个主题。
   *
   * @private
   */
  #nextTopic() {
    const topics = Array.from(this.#subscriptionExpressionMap.keys());
    if (this.#topicIndex >= topics.length) {
      this.#topicIndex = 0;
    }
    return topics[this.#topicIndex++];
  }
}
