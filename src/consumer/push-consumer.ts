import { ClientType } from '@/rpc/apache/rocketmq/v2/definition_pb';
import {
  HeartbeatRequest,
  NotifyClientTerminationRequest
} from '@/rpc/apache/rocketmq/v2/service_pb';
import {
  Consumer,
  FilterExpression,
  PushSubscriptionSetting,
  SimpleConsumerOptions,
  SimpleSubscriptionSetting,
  SubscriptionLoadBalancer
} from '@/consumer';
import { MessageView } from '@/message';
import { TopicRoute } from '@/model';
import { createResource } from '@/util';
import { MessageListener } from '@/consumer/listener/message.listener';

export class PushConsumer extends Consumer {
  /**
   * 简单订阅设置
   * @private
   */
  readonly #pushSubscriptionSetting: PushSubscriptionSetting;

  /**
   * 订阅表达式映射
   * @private
   */
  readonly #subscriptionExpressionMap = new Map<string, FilterExpression>();

  /**
   * 订阅路由数据缓存
   * @private
   */
  readonly #subscriptionRouteCache = new Map<
    string,
    SubscriptionLoadBalancer
  >();

  /**
   * 长轮询超时时间
   * @private
   */
  readonly #awaitDuration: number;

  /**
   * 当前订阅主题索引
   * @private
   */
  #topicIndex = 0;

  /**
   * 消息监听器
   * @private
   */
  readonly #listener: MessageListener;

  constructor(options: SimpleConsumerOptions) {
    options.topics = Array.from(options.subscriptions.keys());
    super(options);

    for (const [topic, filter] of options.subscriptions.entries()) {
      if (typeof filter === 'string') {
        // filter is tag string
        this.#subscriptionExpressionMap.set(
          topic,
          new FilterExpression(filter)
        );
      } else {
        this.#subscriptionExpressionMap.set(topic, filter);
      }
    }

    this.#awaitDuration = options.awaitDuration ?? 30000;

    this.#pushSubscriptionSetting = new SimpleSubscriptionSetting(
      this.id,
      this.endpoints,
      this.consumerGroup,
      this.requestTimeout,
      this.#awaitDuration,
      this.#subscriptionExpressionMap
    );
  }

  /**
   * 获取设置。
   *
   * @protected
   */
  protected getSetting() {
    return this.#pushSubscriptionSetting;
  }

  /**
   * 包装心跳请求。
   *
   * @protected
   */
  protected wrapHeartbeatRequest() {
    return new HeartbeatRequest()
      .setClientType(ClientType.SIMPLE_CONSUMER)
      .setGroup(createResource(this.consumerGroup));
  }

  /**
   * 包装通知客户端终止请求。
   *
   * @protected
   */
  protected wrapNotifyClientTerminationRequest() {
    return new NotifyClientTerminationRequest().setGroup(
      createResource(this.consumerGroup)
    );
  }

  /**
   * 订阅路由数据更新。
   *
   * @param topic 主题
   * @param topicRoute 路由数据
   * @protected
   */
  protected onTopicRouteUpdate(topic: string, topicRoute: TopicRoute) {
    this.#updateSubscriptionLoadBalancer(topic, topicRoute);
  }

  /**
   * 更新订阅负载均衡器。
   *
   * @param topic 主题
   * @param topicRoute 路由数据
   * @private
   */
  #updateSubscriptionLoadBalancer(topic: string, topicRoute: TopicRoute) {
    let subscriptionLoadBalancer = this.#subscriptionRouteCache.get(topic);
    if (!subscriptionLoadBalancer) {
      subscriptionLoadBalancer = new SubscriptionLoadBalancer(topicRoute);
    } else {
      subscriptionLoadBalancer = subscriptionLoadBalancer.update(topicRoute);
    }
    this.#subscriptionRouteCache.set(topic, subscriptionLoadBalancer);
    return subscriptionLoadBalancer;
  }

  /**
   * 获取订阅负载均衡器。
   *
   * @param topic 主题
   * @private
   */
  async #getSubscriptionLoadBalancer(topic: string) {
    let loadBalancer = this.#subscriptionRouteCache.get(topic);
    if (!loadBalancer) {
      const topicRouteData = await this.getRoute(topic);
      loadBalancer = this.#updateSubscriptionLoadBalancer(
        topic,
        topicRouteData
      );
    }
    return loadBalancer;
  }

  /**
   * 订阅主题。
   *
   * @param topic 主题
   * @param filterExpression 订阅表达式
   */
  async subscribe(topic: string, filterExpression: FilterExpression) {
    await this.getRoute(topic);
    this.#subscriptionExpressionMap.set(topic, filterExpression);
  }

  /**
   * 取消订阅主题。
   *
   * @param topic 主题
   */
  unsubscribe(topic: string) {
    this.#subscriptionExpressionMap.delete(topic);
  }

  /**
   * 接收消息。
   *
   * @param maxMessageNum 最大消息数，默认 10 条
   * @param invisibleDuration 消息不可见时间，默认 15 秒
   */
  async #receive(maxMessageNum = 10, invisibleDuration = 15000) {
    const topic = this.#nextTopic();
    const filterExpression = this.#subscriptionExpressionMap.get(topic)!;
    const loadBalancer = await this.#getSubscriptionLoadBalancer(topic);
    const mq = loadBalancer.takeMessageQueue();
    const request = this.wrapReceiveMessageRequest(
      maxMessageNum,
      mq,
      filterExpression,
      invisibleDuration,
      this.#awaitDuration
    );
    return await this.receiveMessage(request, mq, this.#awaitDuration);
  }

  async #ack(message: MessageView) {
    await this.ackMessage(message);
  }

  /**
   * 下一个主题。
   *
   * @private
   */
  #nextTopic() {
    const topics = Array.from(this.#subscriptionExpressionMap.keys());
    if (this.#topicIndex >= topics.length) {
      this.#topicIndex = 0;
    }
    return topics[this.#topicIndex++];
  }
}
