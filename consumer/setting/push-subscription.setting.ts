import {
  ClientType,
  Settings as SettingsPB,
  Subscription
} from '../../rpc/apache/rocketmq/v2/definition_pb';
import { Setting, UserAgent } from '../../client';
import { ILock } from '../lock/consumer-lock';
import { createDuration, createResource } from '../../util';
import { FilterExpression } from '../filter-expression';
import { Endpoints } from '../../model';

/**
 * 简单消费订阅设置。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:40
 */
export class PushSubscriptionSetting extends Setting {
  /**
   * 长轮询超时时间
   */
  readonly longPollingTimeout: number;

  /**
   * 消费组
   */
  readonly group: string;

  /**
   * 订阅表达式
   */
  readonly subscriptionExpressions: Map<string, FilterExpression>;

  /**
   * 单次订阅获取最大消息数量
   */
  maxMessageNum: number;

  /**
   * 是否为 FIFO 模式
   */
  isFifo: boolean;

  /**
   * 消息不可见时间
   */
  invisibleDuration: number;

  /**
   * 同步锁
   */
  locker?: ILock<unknown>;

  constructor(
    clientId: string,
    accessPoint: Endpoints,
    group: string,
    requestTimeout: number,
    longPollingTimeout: number,
    subscriptionExpressions: Map<string, FilterExpression>,
    maxMessageNum: number,
    isFifo: boolean,
    invisibleDuration: number,
    locker?: ILock<unknown>
  ) {
    super(clientId, ClientType.SIMPLE_CONSUMER, accessPoint, requestTimeout);
    this.longPollingTimeout = longPollingTimeout;
    this.group = group;
    this.subscriptionExpressions = subscriptionExpressions;
    this.maxMessageNum = maxMessageNum;
    this.isFifo = isFifo;
    this.invisibleDuration = invisibleDuration;
    this.locker = locker;
  }

  /**
   * 转换为 Protobuf 对象。
   */
  toProtobuf(): SettingsPB {
    const subscription = new Subscription()
      .setGroup(createResource(this.group))
      .setLongPollingTimeout(createDuration(this.longPollingTimeout));

    for (const [
      topic,
      filterExpression
    ] of this.subscriptionExpressions.entries()) {
      subscription
        .addSubscriptions()
        .setTopic(createResource(topic))
        .setExpression(filterExpression.toProtobuf());
    }
    return new SettingsPB()
      .setClientType(this.clientType)
      .setAccessPoint(this.accessPoint.toProtobuf())
      .setRequestTimeout(createDuration(this.requestTimeout))
      .setSubscription(subscription)
      .setUserAgent(UserAgent.INSTANCE.toProtobuf());
  }

  /**
   * 同步设置。
   *
   * @param settings 设置
   */
  sync(settings: SettingsPB): void {
    if (settings.getPubSubCase() !== SettingsPB.PubSubCase.SUBSCRIPTION) {
      console.error(
        '[Bug] Issued settings not match with the client type, clientId={}, pubSubCase={}, clientType={}',
        this.clientId,
        settings.getPubSubCase(),
        this.clientType
      );
    }
  }
}
