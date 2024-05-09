import { MESSAGE_VERSION, MessageId } from "@/message";
import { mac } from "address";

/* --------------------- 定义无符号整数的最大值常量，用于序列号和时间戳的处理。 --------------------- */
const MAX_UINT32 = 0xffffffff;
const MAX_UINT16 = 0xffff;

/**
 * 用于消息ID生成和解析的工厂类。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/29 下午1:27
 */
export class MessageIdFactory {
  /**
   * 序列号，用于每个消息ID的唯一性
   * @private
   */
  private static sequence = 0;

  /**
   * 缓冲区，用于构建和解析消息ID
   * @private
   */
  private static buf = Buffer.alloc(1 + 6 + 2 + 4 + 4);

  /**
   * 基准时间戳（2021-01-01T00:00:00Z），用于计算相对时间戳
   * @private
   */
  private static sinceTimestamp =
    new Date("2021-01-01T00:00:00Z").getTime() / 1000;

  /**
   * 当前进程ID的后两字节，用于消息ID的一部分
   * @private
   */
  private static processId = process.pid % MAX_UINT16;

  /**
   * 默认的MAC地址，可能由实际MAC地址更新
   */
  static MAC = "000000000000";

  /**
   * 创建一个新的消息ID实例。
   *
   * @return {MessageId} 新创建的消息ID对象。
   */
  static create(): MessageId {
    const messageId = new MessageId();
    messageId.version = MESSAGE_VERSION.V1;
    messageId.macAddress = this.MAC;
    messageId.processId = this.processId;
    messageId.timestamp = this.getCurrentTimestamp();
    messageId.sequence = this.sequence++;

    if (this.sequence > MAX_UINT32) {
      this.sequence = 0; // 如果序列号超过最大值，重置为0
    }

    this.buf.writeUInt8(messageId.version, 0);
    this.buf.write(messageId.macAddress, 1, "hex");
    this.buf.writeUInt16BE(messageId.processId, 7);
    this.buf.writeUInt32BE(messageId.timestamp, 9);
    this.buf.writeUInt32BE(messageId.sequence, 13);
    messageId.id = this.buf.toString("hex").toUpperCase();
    return messageId;
  }

  /**
   * 根据给定的ID字符串解码生成消息ID对象。
   *
   * @param {string} id 要解码的消息ID字符串。
   * @return {MessageId} 解码后的消息ID对象。
   */
  static decode(id: string): MessageId {
    const messageId = new MessageId();
    messageId.id = id;
    this.buf.write(id, 0, "hex");
    messageId.version = this.buf.readUInt8(0);
    messageId.macAddress = this.buf.subarray(1, 7).toString("hex");
    messageId.processId = this.buf.readUInt16BE(7);
    messageId.timestamp = this.buf.readUInt32BE(9);
    messageId.sequence = this.buf.readUInt32BE(13);
    return messageId;
  }

  /**
   * 获取当前的时间戳（秒），相对于基准日期。
   *
   * @return {number} 当前相对时间戳。
   */
  private static getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000 - this.sinceTimestamp) % MAX_UINT32;
  }
}

/**
 * 当前系统的MAC地址。
 *
 * @param {string} macAddress - MAC地址字符串。
 * @private
 */
mac((err, mac) => {
  if (err) {
    console.warn(
      "[rocketmq-client-nodejs] can't get mac address, %s",
      err.message,
    );
    return;
  }

  if (!mac) {
    console.warn("[rocketmq-client-nodejs] can't get mac address");
    return;
  }

  MessageIdFactory.MAC = mac.replaceAll(":", "");
});
