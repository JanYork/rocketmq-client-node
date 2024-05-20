import {
  ClientType,
  Publishing,
  Settings as SettingsPB
} from '../rpc/apache/rocketmq/v2/definition_pb';
import { Setting, UserAgent } from '../client';
import { ExponentialBackoffRetryPolicy } from '../retry';
import { createDuration } from '../util';
import { Endpoints } from '../model';

/**
 * PublishingSettings 类扩展了 Settings 类，专门用于配置消息发布相关的设置。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/29 下午4:09
 */
export class PublishingSetting extends Setting {
  /**
   * 存储消息主题的集合
   * @private
   */
  readonly #topics: Set<string>;

  /**
   * 默认最大消息体大小为4 MB，超过则进行压缩
   * @private
   */
  #maxBodySizeBytes = 4 * 1024 * 1024;

  /**
   * 是否验证消息类型
   * @private
   */
  #validateMessageType = true;

  /**
   * 构造一个新的 PublishingSettings 实例。
   *
   * @param clientId 客户端ID。
   * @param accessPoint 网络访问点。
   * @param namespace 命名空间。
   * @param retryPolicy 重试策略。
   * @param requestTimeout 请求超时时间，单位为毫秒。
   * @param topics 订阅的主题集合。
   */
  constructor(
    clientId: string,
    accessPoint: Endpoints,
    namespace: string,
    retryPolicy: ExponentialBackoffRetryPolicy,
    requestTimeout: number,
    topics: Set<string>
  ) {
    super(
      clientId,
      ClientType.PRODUCER,
      accessPoint,
      namespace,
      requestTimeout,
      retryPolicy
    );
    this.#topics = topics;
  }

  /**
   * 获取最大消息体大小的值。
   *
   * @returns 最大消息体大小（字节）。
   */
  get maxBodySizeBytes() {
    return this.#maxBodySizeBytes;
  }

  /**
   * 判断是否开启消息类型验证。
   *
   * @returns 是否验证消息类型。
   */
  isValidateMessageType() {
    return this.#validateMessageType;
  }

  /**
   * 将当前设置转换为 Protobuf 消息格式。
   *
   * @returns 转换后的 Protobuf 消息设置。
   */
  toProtobuf(): SettingsPB {
    const publishing = new Publishing().setValidateMessageType(
      this.#validateMessageType
    );

    for (const topic of this.#topics) {
      publishing.addTopics().setName(topic);
      publishing.addTopics().setResourceNamespace(this.namespace);
    }

    return new SettingsPB()
      .setClientType(this.clientType)
      .setAccessPoint(this.accessPoint.toProtobuf())
      .setRequestTimeout(createDuration(this.requestTimeout))
      .setPublishing(publishing)
      .setUserAgent(UserAgent.INSTANCE.toProtobuf());
  }

  /**
   * 根据 Protobuf 消息同步更新设置。
   *
   * @param settings 从服务器接收的设置 Protobuf 消息。
   */
  sync(settings: SettingsPB): void {
    if (settings.getPubSubCase() !== SettingsPB.PubSubCase.PUBLISHING) {
      // 如果接收到的设置类型不匹配，记录错误并返回
      return;
    }

    const backoffPolicy = settings.getBackoffPolicy()!;
    const publishing = settings.getPublishing()!.toObject();

    // 更新重试策略和消息设置
    const exist = this.retryPolicy!;
    this.retryPolicy = exist.inheritBackoff(backoffPolicy);
    this.#validateMessageType = publishing.validateMessageType;
    this.#maxBodySizeBytes = publishing.maxBodySize;
  }
}
