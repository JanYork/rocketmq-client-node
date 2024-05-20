import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import {
  Encoding,
  Message as MessagePB,
  MessageType,
  SystemProperties
} from '../rpc/apache/rocketmq/v2/definition_pb';
import { createResource } from '../util';
import { PublishingSetting } from '../producer';
import { MessageIdFactory } from './factory/message.factory';
import { UserAgent } from '../client';
import { MessageOptions } from './interface/message.interface';
import { MessageQueue } from '../model';
import { Message } from './message';

/**
 * 专门用于发布的消息类，支持消息类型和事务处理。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/29 下午2:31
 */
export class PublishMessage extends Message {
  readonly messageId: string;
  readonly messageType: MessageType;

  /**
   * 构造函数，初始化发布消息。
   *
   * @param {MessageOptions} options - 消息配置选项。
   * @param {PublishingSetting} publishingSetting - 发布设置。
   * @param {boolean} txEnabled - 是否启用事务。
   */
  constructor(
    options: MessageOptions,
    publishingSetting: PublishingSetting,
    txEnabled: boolean
  ) {
    super(options);
    const length = this.body.length;
    const maxBodySizeBytes = publishingSetting.maxBodySizeBytes;

    // 检查消息体长度是否超过最大限制
    if (length > maxBodySizeBytes) {
      throw new TypeError(
        `Message body size exceeds the threshold, max size=${maxBodySizeBytes} bytes`
      );
    }

    // 生成消息ID
    this.messageId = MessageIdFactory.create().toString();

    // 根据消息组、传递时间戳和事务启用状态确定消息类型
    if (!this.messageGroup && !this.deliveryTimestamp && !txEnabled) {
      this.messageType = MessageType.NORMAL;
    } else if (this.messageGroup && !txEnabled) {
      this.messageType = MessageType.FIFO;
    } else if (this.deliveryTimestamp && !txEnabled) {
      this.messageType = MessageType.DELAY;
    } else if (!this.messageGroup && !this.deliveryTimestamp && txEnabled) {
      this.messageType = MessageType.TRANSACTION;
    } else {
      throw new TypeError(
        'Transactional message should not set messageGroup or deliveryTimestamp'
      );
    }
  }

  /**
   * 将消息转换为Protobuf格式，准备发送。
   *
   * @param {MessageQueue} mq - 消息队列。
   * @return {MessagePB} Protobuf消息格式。
   */
  toProtobuf(namespace: string, mq: MessageQueue): MessagePB {
    const systemProperties = new SystemProperties()
      .setKeysList(this.keys)
      .setMessageId(this.messageId)
      .setBornTimestamp(Timestamp.fromDate(new Date()))
      .setBornHost(UserAgent.INSTANCE.hostname)
      .setBodyEncoding(Encoding.IDENTITY)
      .setQueueId(mq.id)
      .setMessageType(this.messageType);

    // 设置消息标签和分组
    if (this.tag) {
      systemProperties.setTag(this.tag);
    }
    if (this.deliveryTimestamp) {
      systemProperties.setDeliveryTimestamp(
        Timestamp.fromDate(this.deliveryTimestamp)
      );
    }
    if (this.messageGroup) {
      systemProperties.setMessageGroup(this.messageGroup);
    }

    const resource = createResource(this.topic);
    resource.setResourceNamespace(namespace);

    // 构建Protobuf消息
    const message = new MessagePB()
      .setTopic(resource)
      .setBody(this.body)
      .setSystemProperties(systemProperties);

    // 添加自定义属性
    if (this.properties) {
      const userProperties = message.getUserPropertiesMap();
      for (const [key, value] of this.properties.entries()) {
        userProperties.set(key, value);
      }
    }

    return message;
  }
}
