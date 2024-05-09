import { TransactionResolution } from '@/rpc/apache/rocketmq/v2/definition_pb';
import { MessageOptions, PublishMessage } from '@/message';
import { SendReceipt, Producer } from '@/producer';

/**
 * Transaction 类用于管理消息的事务性发送。
 * <br/>
 * 它允许在一个事务中添加多条消息，并在事务结束时提交或回滚所有消息。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:10
 */
export class Transaction {
  /**
   * 最大消息数量限制，示例为5，实际使用时可根据需要调整
   */
  static readonly MAX_MESSAGE_NUM = 5;

  /**
   * 与此事务关联的生产者实例。
   * @private
   */
  private producer: Producer;

  /**
   * 事务中的消息映射。
   * @private
   */
  private messageMap = new Map<string, PublishMessage>();

  /**
   * 事务中的消息发送回执映射。
   * @private
   */
  private messageSendReceiptMap = new Map<string, SendReceipt>();

  /**
   * 构造函数，初始化 Transaction 对象。
   *
   * @param producer 与此事务关联的生产者实例。
   */
  constructor(producer: Producer) {
    this.producer = producer;
  }

  /**
   * 尝试向事务中添加一条消息。
   *
   * @param message 消息配置选项。
   * @returns 发布消息对象。
   * @throws {TypeError} 如果事务中的消息数超过了最大限制。
   */
  tryAddMessage(message: MessageOptions): PublishMessage {
    if (this.messageMap.size >= Transaction.MAX_MESSAGE_NUM) {
      throw new TypeError(
        `The number of messages in the transaction has exceeded the limit of ${Transaction.MAX_MESSAGE_NUM}`
      );
    }
    const publishingMessage = new PublishMessage(
      message,
      this.producer.publishingSetting,
      true
    );
    this.messageMap.set(publishingMessage.messageId, publishingMessage);
    return publishingMessage;
  }

  /**
   * 尝试向事务中添加一条消息的发送回执。
   *
   * @param publishingMessage 事务中的发布消息对象。
   * @param sendReceipt 发送回执。
   * @throws {Error} 如果尝试添加不属于此事务的消息回执。
   */
  tryAddReceipt(
    publishingMessage: PublishMessage,
    sendReceipt: SendReceipt
  ): void {
    if (!this.messageMap.has(publishingMessage.messageId)) {
      throw new Error(
        'Attempting to add a receipt for a message that is not part of the transaction.'
      );
    }
    this.messageSendReceiptMap.set(publishingMessage.messageId, sendReceipt);
  }

  /**
   * 提交事务，确保所有消息被发送。
   */
  async commit(): Promise<void> {
    if (this.messageSendReceiptMap.size === 0) {
      throw new Error('No messages have been sent in this transaction.');
    }
    for (const [
      messageId,
      sendReceipt
    ] of this.messageSendReceiptMap.entries()) {
      const publishingMessage = this.messageMap.get(messageId)!;
      await this.producer.endTransaction(
        sendReceipt.endpoints,
        publishingMessage,
        messageId,
        sendReceipt.transactionId,
        TransactionResolution.COMMIT
      );
    }
  }

  /**
   * 回滚事务，取消所有已发送的消息。
   */
  async rollback(): Promise<void> {
    if (this.messageSendReceiptMap.size === 0) {
      throw new Error('No messages have been sent in this transaction.');
    }
    for (const [
      messageId,
      sendReceipt
    ] of this.messageSendReceiptMap.entries()) {
      const publishingMessage = this.messageMap.get(messageId)!;
      await this.producer.endTransaction(
        sendReceipt.endpoints,
        publishingMessage,
        messageId,
        sendReceipt.transactionId,
        TransactionResolution.ROLLBACK
      );
    }
  }
}
