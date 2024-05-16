import { MESSAGE_VERSION } from './enum/message.enum';

/**
 * 消息ID的结构体，包含了消息ID的所有信息。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/29 下午1:23
 */
export class MessageId {
  /**
   * 完整的消息ID字符串
   */
  id: string;

  /**
   * 消息版本号
   */
  version: MESSAGE_VERSION;

  /**
   * MAC地址
   */
  macAddress: string;

  /**
   * 进程ID
   */
  processId: number;

  /**
   * 时间戳
   */
  timestamp: number;

  /**
   * 序列号
   */
  sequence: number;

  /**
   * 将消息ID对象转换成字符串。
   *
   * @return {string} 消息ID的字符串表示形式。
   */
  toString(): string {
    return this.id;
  }
}
