import {
  MessageQueue as MessageQueuePB,
  MessageType,
  Permission,
  Resource
} from '../rpc/apache/rocketmq/v2/definition_pb';
import { createResource } from '../util';
import { Broker } from './broker.model';

/**
 * RocketMQ 中的消息队列。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/26 下午8:16
 */
export class MessageQueue {
  /**
   * 主题
   */
  topic: Resource.AsObject;

  /**
   * 队列ID
   */
  id: number;

  /**
   * broker信息
   */
  broker: Broker;

  /**
   * 权限(枚举)
   */
  permission: Permission;

  /**
   * 接受的消息类型列表
   */
  acceptMessageTypesList: MessageType[];

  /**
   * 创建 MessageQueue 的实例。
   *
   * @param messageQueue RocketMQ 消息队列对象
   */
  constructor(messageQueue: MessageQueuePB) {
    this.topic = messageQueue.getTopic()!.toObject();
    this.id = messageQueue.getId();
    this.permission = messageQueue.getPermission();
    this.acceptMessageTypesList = messageQueue.getAcceptMessageTypesList();
    this.broker = new Broker(messageQueue.getBroker()!.toObject());
  }

  /**
   * 将本对象转换为对应的 protobuf 对象。
   */
  toProtobuf() {
    const messageQueue = new MessageQueuePB();
    messageQueue.setId(this.id);
    messageQueue.setTopic(createResource(this.topic.name));
    messageQueue.setBroker(this.broker.toProtobuf());
    messageQueue.setPermission(this.permission);
    messageQueue.setAcceptMessageTypesList(this.acceptMessageTypesList);
    return messageQueue;
  }
}
