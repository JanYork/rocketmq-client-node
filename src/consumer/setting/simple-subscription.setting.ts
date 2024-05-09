import {
  Settings as SettingsPB,
  ClientType,
  Subscription
} from '@/rpc/apache/rocketmq/v2/definition_pb';
import { Endpoints } from '@/model';
import { Setting, UserAgent } from '@/server/client';
import { createDuration, createResource } from '@/util';
import { FilterExpression } from '@/consumer';

/**
 * 简单消费订阅设置。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:40
 */
export class SimpleSubscriptionSetting extends Setting {
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

  constructor(
    clientId: string,
    accessPoint: Endpoints,
    group: string,
    requestTimeout: number,
    longPollingTimeout: number,
    subscriptionExpressions: Map<string, FilterExpression>
  ) {
    super(clientId, ClientType.SIMPLE_CONSUMER, accessPoint, requestTimeout);
    this.longPollingTimeout = longPollingTimeout;
    this.group = group;
    this.subscriptionExpressions = subscriptionExpressions;
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
      // log.error("[Bug] Issued settings not match with the client type, clientId={}, pubSubCase={}, "
      //       + "clientType={}", clientId, pubSubCase, clientType);
      // TODO：日志模块
      console.error(
        '[Bug] Issued settings not match with the client type, clientId={}, pubSubCase={}, clientType={}',
        this.clientId,
        settings.getPubSubCase(),
        this.clientType
      );
    }
  }
}
