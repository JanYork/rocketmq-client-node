import { randomInt } from 'node:crypto';
import { Permission } from '../rpc/apache/rocketmq/v2/definition_pb';
import { MessageQueue, TopicRoute } from '../model';
import { MASTER_BROKER_ID } from '../util';

/**
 * 订阅消息的负载均衡器。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/30 19:25
 */
export class SubscriptionLoadBalancer {
  /**
   * 当前消息队列的索引
   * @private
   */
  private index: number;

  /**
   * 可读消息队列列表
   * @private
   */
  private readonly messageQueues: MessageQueue[];

  constructor(topicRouteData: TopicRoute, index?: number) {
    this.messageQueues = topicRouteData.messageQueues.filter(mq => {
      return (
        mq.id === MASTER_BROKER_ID &&
        (mq.permission === Permission.READ ||
          mq.permission === Permission.READ_WRITE)
      );
    });

    this.index =
      index === undefined ? randomInt(this.messageQueues.length) : index;

    if (this.messageQueues.length === 0) {
      throw new Error(
        `No readable message queue found, topicRouteData=${JSON.stringify(topicRouteData)}`
      );
    }
  }

  /**
   * 更新负载均衡器
   *
   * @param topicRoute 主题路由
   */
  update(topicRoute: TopicRoute) {
    return new SubscriptionLoadBalancer(topicRoute, this.index);
  }

  /**
   * 获取消息队列
   */
  takeMessageQueue() {
    if (this.index >= this.messageQueues.length) {
      this.index = 0;
    }
    return this.messageQueues[this.index++];
  }
}
