import { gunzipSync } from "node:zlib";
import {
  DigestType,
  Encoding,
  Message as MessagePB,
} from "@/rpc/apache/rocketmq/v2/definition_pb";
import { crc32CheckSum, md5CheckSum, sha1CheckSum } from "@/util";
import { Endpoints, MessageQueue } from "@/model";

/**
 * 封装从原始消息协议缓冲区解析的消息视图。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/29 下午1:36
 */
export class MessageView {
  /**
   * 消息ID，用于标识消息的唯一性
   */
  readonly messageId: string;

  /**
   * 消息的主题，用于标识消息的类型
   */
  readonly topic: string;

  /**
   * 消息的内容，即消息的主体
   */
  readonly body: Buffer;

  /**
   * 消息是否损坏
   */
  readonly corrupted: boolean;

  /**
   * 消息的传输时间戳
   */
  readonly transportDeliveryTimestamp?: Date;

  /**
   * 消息的标签，用于标识消息的子类型
   */
  readonly tag?: string;

  /**
   * 消息的分组，用于标识消息的分组
   */
  readonly messageGroup?: string;

  /**
   * 消息的发送时间，用于标识消息的发送时间
   */
  readonly deliveryTimestamp?: Date;

  /**
   * 消息的关键字，用于标识消息的关键信息
   */
  readonly keys: string[];

  /**
   * 消息的出生主机
   */
  readonly bornHost: string;

  /**
   * 消息的出生时间
   */
  readonly bornTimestamp?: Date;

  /**
   * 消息的投递次数
   */
  readonly deliveryAttempt?: number;

  /**
   * 消息的端点信息
   */
  readonly endpoints: Endpoints;

  /**
   * 接收处理器
   */
  readonly receiptHandle: string;

  /**
   * 消息的偏移量
   */
  readonly offset?: number;

  /**
   * 消息的解码时间戳
   */
  readonly decodeTimestamp: Date;

  /**
   * 消息的属性，用于标识消息的元数据
   */
  readonly properties = new Map<string, string>();

  /**
   * 构造函数，初始化消息视图。
   *
   * @param {MessagePB} message - 从服务端接收的原始消息。
   * @param {MessageQueue} messageQueue - 消息所属的队列信息，可选。
   * @param {Date} transportDeliveryTimestamp - 消息传输的时间戳，可选。
   */
  constructor(
    message: MessagePB,
    messageQueue?: MessageQueue,
    transportDeliveryTimestamp?: Date,
  ) {
    const systemProperties = message.getSystemProperties()!;
    const bodyDigest = systemProperties.getBodyDigest()!.toObject();
    const digestType = bodyDigest.type;
    const checksum = bodyDigest.checksum;
    let expectedChecksum = "";
    let bodyBytes = Buffer.from(message.getBody_asU8());

    // 根据消息体的摘要类型计算预期的摘要值
    switch (digestType) {
      case DigestType.CRC32:
        expectedChecksum = crc32CheckSum(bodyBytes);
        break;
      case DigestType.MD5:
        expectedChecksum = md5CheckSum(bodyBytes);
        break;
      case DigestType.SHA1:
        expectedChecksum = sha1CheckSum(bodyBytes);
        break;
    }

    // 检查实际摘要值与计算摘要值是否一致，不一致则标记为损坏
    this.corrupted = expectedChecksum && expectedChecksum !== checksum;

    // 如果消息体采用GZIP压缩，则解压
    if (systemProperties.getBodyEncoding() === Encoding.GZIP) {
      bodyBytes = gunzipSync(bodyBytes);
    }

    // 设置消息属性
    for (const [key, value] of message.getUserPropertiesMap().entries()) {
      this.properties.set(key, value);
    }

    // 设置其他消息属性
    this.messageId = systemProperties.getMessageId();
    this.topic = message.getTopic()!.getName();
    this.tag = systemProperties.getTag();
    this.messageGroup = systemProperties.getMessageGroup();
    this.deliveryTimestamp = systemProperties.getDeliveryTimestamp()?.toDate();
    this.keys = systemProperties.getKeysList();
    this.bornHost = systemProperties.getBornHost();
    this.bornTimestamp = systemProperties.getBornTimestamp()?.toDate();
    this.deliveryAttempt = systemProperties.getDeliveryAttempt();
    this.offset = systemProperties.getQueueOffset();
    this.receiptHandle = systemProperties.getReceiptHandle()!;
    this.transportDeliveryTimestamp = transportDeliveryTimestamp;
    if (messageQueue) {
      this.endpoints = messageQueue.broker.endpoints;
    }
    this.body = bodyBytes;
    // 设置解码时间戳
    this.decodeTimestamp = new Date();
  }
}
