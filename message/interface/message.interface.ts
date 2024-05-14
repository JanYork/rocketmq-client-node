/**
 * 提供初始化 Message 实例所需的配置选项。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/29 下午1:03
 */
export interface MessageOptions {
  // 消息主题，用于定义消息所属的类别或服务。
  topic: string;

  // 消息内容的二进制数据，主要载荷部分。
  body: Buffer;

  // 可选，用于标记消息，便于特定消费逻辑的过滤。
  tag?: string;

  // 可选，用于分组消息，常用于确保消息的顺序消费。
  messageGroup?: string;

  // 可选，消息关键词，用于消息检索或分类。
  keys?: string[];

  // 可选，自定义的消息属性键值对，用于携带额外的元数据。
  properties?: Map<string, string>;

  // 可选，指定消息从现在起延迟多少毫秒发送。
  delay?: number;

  // 可选，指定消息的准确发送时间点。
  deliveryTimestamp?: Date;
}
