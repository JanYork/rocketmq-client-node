import { Message, Status } from '../rpc/apache/rocketmq/v2/definition_pb';
import {
  AckMessageRequest,
  ChangeInvisibleDurationRequest,
  ReceiveMessageRequest,
  ReceiveMessageResponse
} from '../rpc/apache/rocketmq/v2/service_pb';
import { RpcBaseClient } from '../client';
import { ConsumerOptions } from './interface/consumer-options';
import { createDuration, createResource } from '../util';
import { StatusChecker } from '../exception';
import { MessageView } from '../message';
import { FilterExpression } from './filter-expression';
import { MessageQueue } from '../model';

/**
 * 消费者抽象类。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:48
 */
export abstract class Consumer extends RpcBaseClient {
  /**
   * 消费组
   * @protected
   */
  protected readonly consumerGroup: string;

  protected constructor(options: ConsumerOptions) {
    super(options);
    this.consumerGroup = options.consumerGroup;
  }

  /**
   * 包装接收消息请求。
   *
   * @param batchSize 批量大小
   * @param mq 消息队列
   * @param filterExpression 过滤表达式
   * @param invisibleDuration 消息不可见时长
   * @param longPollingTimeout 长轮询超时时间
   * @protected
   */
  protected wrapReceiveMessageRequest(
    batchSize: number,
    mq: MessageQueue,
    filterExpression: FilterExpression,
    invisibleDuration: number,
    longPollingTimeout: number
  ) {
    return new ReceiveMessageRequest()
      .setGroup(createResource(this.consumerGroup))
      .setMessageQueue(mq.toProtobuf())
      .setFilterExpression(filterExpression.toProtobuf())
      .setLongPollingTimeout(createDuration(longPollingTimeout))
      .setBatchSize(batchSize)
      .setAutoRenew(false)
      .setInvisibleDuration(createDuration(invisibleDuration));
  }

  /**
   * 接收消息。
   *
   * @param request 接收消息请求
   * @param mq 消息队列
   * @param awaitDuration 等待时长
   * @protected
   */
  protected async receiveMessage(
    request: ReceiveMessageRequest,
    mq: MessageQueue,
    awaitDuration: number
  ) {
    const endpoints = mq.broker.endpoints;
    const timeout = this.requestTimeout + awaitDuration;
    let status: Status.AsObject | undefined;
    const responses = await this.manager.receiveMessage(
      endpoints,
      request,
      timeout
    );
    const messageList: Message[] = [];
    let transportDeliveryTimestamp: Date | undefined;
    for (const response of responses) {
      switch (response.getContentCase()) {
        case ReceiveMessageResponse.ContentCase.STATUS:
          status = response.getStatus()?.toObject();
          break;
        case ReceiveMessageResponse.ContentCase.MESSAGE:
          messageList.push(response.getMessage()!);
          break;
        case ReceiveMessageResponse.ContentCase.DELIVERY_TIMESTAMP:
          transportDeliveryTimestamp = response
            .getDeliveryTimestamp()
            ?.toDate();
          break;
        default:
          this.logger.warn({
            message: 'Not recognized content for receive message response',
            context: {
              mq,
              clientId: this.id,
              response
            }
          });
      }
    }

    StatusChecker.check(status);

    return messageList.map(
      message => new MessageView(message, mq, transportDeliveryTimestamp)
    );
  }

  /**
   * 确认消息。
   *
   * @author JanYork
   * @email <747945307@qq.com>
   * @date 2024/5/6 下午4:50
   */
  protected async ackMessage(messageView: MessageView) {
    const endpoints = messageView.endpoints;
    const request = new AckMessageRequest()
      .setGroup(createResource(this.consumerGroup))
      .setTopic(createResource(messageView.topic));
    request
      .addEntries()
      .setMessageId(messageView.messageId)
      .setReceiptHandle(messageView.receiptHandle);
    const response = await this.manager.ackMessage(
      endpoints,
      request,
      this.requestTimeout
    );

    // FIXME: handle fail ack
    const responseBO = response.toObject();

    StatusChecker.check(responseBO.status);

    return responseBO.entriesList;
  }

  /**
   * 修改消息不可见时长。
   *
   * @param messageView 消息视图
   * @param invisibleDuration 不可见时长
   * @protected
   */
  protected async invisibleDuration(
    messageView: MessageView,
    invisibleDuration: number
  ) {
    const request = new ChangeInvisibleDurationRequest()
      .setGroup(createResource(this.consumerGroup))
      .setTopic(createResource(messageView.topic))
      .setReceiptHandle(messageView.receiptHandle)
      .setInvisibleDuration(createDuration(invisibleDuration))
      .setMessageId(messageView.messageId);

    const response = await this.manager.changeInvisibleDuration(
      messageView.endpoints,
      request,
      this.requestTimeout
    );

    const responseBO = response.toObject();
    StatusChecker.check(responseBO.status);
    return responseBO.receiptHandle;
  }
}
