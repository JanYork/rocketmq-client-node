import { randomInt } from 'node:crypto';
import { Permission } from '../rpc/apache/rocketmq/v2/definition_pb';
import { Endpoints, MessageQueue, TopicRoute } from '../model';
import { calculateStringSipHash24, MASTER_BROKER_ID } from '../util';

/**
 * 发布消息负载均衡器
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:03
 */
export class PublishingLoadBalancer {
  /**
   * 当前索引
   * @private
   */
  #index: number;

  /**
   * 消息队列
   * @private
   */
  readonly #messageQueues: MessageQueue[];

  constructor(topicRouteData: TopicRoute, index?: number) {
    this.#messageQueues = topicRouteData.messageQueues.filter(mq => {
      return (
        mq.id === MASTER_BROKER_ID &&
        (mq.permission === Permission.WRITE ||
          mq.permission === Permission.READ_WRITE)
      );
    });
    this.#index =
      index === undefined ? randomInt(this.#messageQueues.length) : index;
    if (this.#messageQueues.length === 0) {
      throw new Error(
        `No writable message queue found, topicRouteData=${JSON.stringify(topicRouteData)}`
      );
    }
  }

  /**
   * 更新
   *
   * @param topicRoute 主题路由
   */
  update(topicRoute: TopicRoute) {
    return new PublishingLoadBalancer(topicRoute, this.#index);
  }

  /**
   * 获取消息队列
   *
   * @param excluded 排除的端点
   * @param count 数量
   */
  takeMessageQueues(excluded: Map<string, Endpoints>, count: number) {
    if (this.#index >= this.#messageQueues.length) {
      this.#index = 0;
    }
    let next = this.#index++;
    const candidates: MessageQueue[] = [];
    const candidateBrokerNames = new Set<string>();

    const size = this.#messageQueues.length;
    for (let i = 0; i < size; i++) {
      const messageQueue = this.#messageQueues[next++ % size];
      const broker = messageQueue.broker;
      const brokerName = broker.name;
      if (
        !excluded.has(broker.endpoints.facade) &&
        !candidateBrokerNames.has(brokerName)
      ) {
        candidateBrokerNames.add(brokerName);
        candidates.push(messageQueue);
      }
      if (candidates.length >= count) {
        return candidates;
      }
    }

    // 如果所有端点都是隔离的
    if (candidates.length === 0) {
      for (let i = 0; i < size; i++) {
        const messageQueue = this.#messageQueues[next++ % size];
        const broker = messageQueue.broker;
        const brokerName = broker.name;
        if (!candidateBrokerNames.has(brokerName)) {
          candidateBrokerNames.add(brokerName);
          candidates.push(messageQueue);
        }
        if (candidates.length >= count) {
          return candidates;
        }
      }
    }
    return candidates;
  }

  /**
   * 通过消息组获取消息队列
   *
   * @param messageGroup 消息组
   */
  takeMessageQueueByMessageGroup(messageGroup: string) {
    const hashCode = calculateStringSipHash24(messageGroup);
    const index = parseInt(`${hashCode % BigInt(this.#messageQueues.length)}`);
    return this.#messageQueues[index];
  }
}
