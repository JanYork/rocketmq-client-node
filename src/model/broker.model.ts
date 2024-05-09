import { Broker as BrokerPB } from "@/rpc/apache/rocketmq/v2/definition_pb";
import { Endpoints } from "@/model/endpoint.model";

/**
 * RocketMQ Broker 信息。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/26 下午8:16
 */
export class Broker {
  /**
   * Broker 名称
   */
  name: string;

  /**
   * Broker ID
   */
  id: number;

  /**
   * Broker 的网络访问端点
   */
  endpoints: Endpoints;

  constructor(broker: BrokerPB.AsObject) {
    this.name = broker.name;
    this.id = broker.id;
    this.endpoints = new Endpoints(broker.endpoints!);
  }

  /**
   * 将本对象转换为 protobuf 对象。
   */
  toProtobuf() {
    const broker = new BrokerPB();
    broker.setName(this.name);
    broker.setId(this.id);
    broker.setEndpoints(this.endpoints.toProtobuf());
    return broker;
  }
}
