import { MessageQueue as MessageQueuePB } from '../rpc/apache/rocketmq/v2/definition_pb';
import { MessageQueue } from './message-queue.model';
import { Endpoints } from './endpoint.model';

/**
 * RocketMQ 中的主题路由(topic route)。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/26 下午8:23
 */
export class TopicRoute {
  /**
   * 消息队列的数组
   */
  readonly messageQueues: MessageQueue[] = [];

  /**
   * 创建主题路由(topic route)实例。
   *
   * @param messageQueues 消息队列实例数组
   */
  constructor(messageQueues: MessageQueuePB[]) {
    for (const mq of messageQueues) {
      this.messageQueues.push(new MessageQueue(mq));
    }
  }

  /**
   * 从所有消息队列中获取唯一的终端地址。
   */
  findTotalEndpoints() {
    const endpointsMap = new Map<string, Endpoints>();

    for (const mq of this.messageQueues) {
      endpointsMap.set(mq.broker.endpoints.facade, mq.broker.endpoints);
    }

    return Array.from(endpointsMap.values());
  }
}
