import {
  ClientType,
  Settings as SettingsPB,
} from "@/rpc/apache/rocketmq/v2/definition_pb";
import { Endpoints } from "@/model";
import { RetryPolicy } from "@/retry";

/**
 * 抽象类 Settings 定义了客户端设置的基本结构和方法。
 * <br/>
 * 这包括客户端的类型、网络访问点、重试策略和请求超时设置。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/29 下午4:04
 */
export abstract class Setting {
  /**
   * 客户端 ID，用于标识具体的客户端实例
   * @protected
   */
  protected readonly clientId: string;

  /**
   * 客户端类型，如生产者或消费者
   * @protected
   */
  protected readonly clientType: ClientType;

  /**
   * 网络访问点信息
   * @protected
   */
  protected readonly accessPoint: Endpoints;

  /**
   * 重试策略，可选，用于操作失败时的重试逻辑
   * @protected
   */
  protected retryPolicy?: RetryPolicy;

  /**
   * 请求超时时间，以毫秒为单位
   * @protected
   */
  protected readonly requestTimeout: number;

  /**
   * 构造函数初始化 Settings 实例。
   *
   * @param clientId 客户端的唯一标识符。
   * @param clientType 客户端的类型（例如：生产者、消费者）。
   * @param accessPoint 定义如何连接到消息系统的网络访问点。
   * @param requestTimeout 定义请求的超时时间，以毫秒计。
   * @param retryPolicy 定义操作失败时的重试策略，可选。
   */
  protected constructor(
    clientId: string,
    clientType: ClientType,
    accessPoint: Endpoints,
    requestTimeout: number,
    retryPolicy?: RetryPolicy,
  ) {
    this.clientId = clientId;
    this.clientType = clientType;
    this.accessPoint = accessPoint;
    this.retryPolicy = retryPolicy;
    this.requestTimeout = requestTimeout;
  }

  /**
   * 抽象方法：转换设置为 Protobuf 格式，以便进行网络传输。
   *
   * @return SettingsPB Protobuf 格式的设置。
   */
  abstract toProtobuf(): SettingsPB;

  /**
   * 抽象方法：根据 Protobuf 消息同步更新本地设置。
   *
   * @param settings 从服务器接收到的设置 Protobuf 消息。
   */
  abstract sync(settings: SettingsPB): void;

  /**
   * 获取当前的重试策略。
   *
   * @return 当前设置的 RetryPolicy 对象，如果未设置，则返回 undefined。
   */
  getRetryPolicy() {
    return this.retryPolicy;
  }
}
