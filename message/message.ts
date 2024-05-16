import { MessageOptions } from './interface/message.interface';

/**
 * 定义和封装一个消息的基本结构，包括其内容和元数据。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/29 下午1:11
 */
export class Message {
  /**
   * 消息的主题，用于标识消息的类型
   */
  topic: string;

  /**
   * 消息的内容，即消息的主体
   */
  body: Buffer;

  /**
   * 消息的标签，用于标识消息的子类型
   */
  tag?: string;

  /**
   * 消息的分组，用于标识消息的分组
   */
  messageGroup?: string;

  /**
   * 消息的关键字，用于标识消息的关键信息
   */
  keys: string[];

  /**
   * 消息的属性，用于标识消息的元数据
   */
  properties?: Map<string, string>;

  /**
   * 消息的发送时间，用于标识消息的发送时间
   */
  deliveryTimestamp?: Date;

  /**
   * 构造函数用于创建一个消息实例。
   *
   * @param {MessageOptions} options 提供消息的所有必要信息。
   */
  constructor(options: MessageOptions) {
    this.topic = options.topic;
    this.body = options.body;
    this.tag = options.tag;
    this.messageGroup = options.messageGroup;
    this.keys = options.keys ?? [];
    this.properties = options.properties;

    // 计算消息的发送时间
    this.deliveryTimestamp = options.delay
      ? new Date(Date.now() + options.delay)
      : options.deliveryTimestamp;
  }
}
