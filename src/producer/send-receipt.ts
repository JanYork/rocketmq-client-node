import { Code } from "@/rpc/apache/rocketmq/v2/definition_pb";
import { SendMessageResponse } from "@/rpc/apache/rocketmq/v2/service_pb";
import { MessageQueue } from "@/model";
import { StatusChecker } from "@/exception";

/**
 * SendReceipt 类表示发送消息操作的结果。
 * <br/>
 * 它包含消息的ID、事务ID、偏移量以及发送消息使用的消息队列。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/29 下午5:18
 */
export class SendReceipt {
  /**
   * 消息的唯一标识符
   */
  readonly messageId: string;

  /**
   * 关联的事务ID（如果有）
   */
  readonly transactionId: string;

  /**
   * 消息在消息队列中的偏移量
   */
  readonly offset: number;

  /**
   * 发送消息所使用的消息队列
   * @private
   */
  private readonly messageQueue: MessageQueue;

  /**
   * 构造函数初始化发送回执。
   * @param messageId 消息的唯一标识符。
   * @param transactionId 关联的事务ID（如果有）。
   * @param messageQueue 发送消息所使用的消息队列。
   * @param offset 消息在消息队列中的偏移量。
   */
  constructor(
    messageId: string,
    transactionId: string,
    messageQueue: MessageQueue,
    offset: number,
  ) {
    this.messageId = messageId;
    this.transactionId = transactionId;
    this.offset = offset;
    this.messageQueue = messageQueue;
  }

  /**
   * 获取发送消息使用的消息队列。
   */
  get queue() {
    return this.messageQueue;
  }

  /**
   * 获取与消息队列关联的终端地址。
   */
  get endpoints() {
    return this.messageQueue.broker.endpoints;
  }

  /**
   * 根据发送响应处理并生成发送回执对象数组。
   *
   * @param mq 发送消息使用的消息队列。
   * @param response 发送消息的响应对象。
   */
  static processResponseInvocation(
    mq: MessageQueue,
    response: SendMessageResponse,
  ) {
    const responseObj = response.toObject();
    const abnormalStatus = responseObj.entriesList
      .map((e) => e.status)
      .find((s) => s?.code !== Code.OK);
    const status = abnormalStatus ?? responseObj.status;

    StatusChecker.check(status);

    const sendReceipts: SendReceipt[] = [];
    for (const entry of responseObj.entriesList) {
      const messageId = entry.messageId;
      const transactionId = entry.transactionId;
      const offset = entry.offset;
      sendReceipts.push(new SendReceipt(messageId, transactionId, mq, offset));
    }
    return sendReceipts;
  }
}
