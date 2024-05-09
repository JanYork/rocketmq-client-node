import {
  Endpoints as EndpointsPB,
  AddressScheme,
  Address,
} from "@/rpc/apache/rocketmq/v2/definition_pb";
import { isIPv4, isIPv6 } from "node:net";

const DEFAULT_PORT = 9876;

/**
 * 表示消息队列的端点。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/26 下午8:19
 */
export class Endpoints {
  /**
   * 端点信息(数组)
   * @private
   */
  readonly addressesList: Address.AsObject[];

  /**
   * 端点的协议
   */
  readonly scheme: AddressScheme;

  /**
   * 端点信息(字符串)
   * @private
   */
  readonly facade: string;

  /**
   * 创建端点的实例。
   *
   * @param endpoints 端点(string 或 protobuf)信息。
   */
  constructor(endpoints: string | EndpointsPB.AsObject) {
    if (typeof endpoints === "string") {
      const splits = endpoints.split(";");

      this.addressesList = [];

      for (const endpoint of splits) {
        const [host, port] = endpoint.split(":");
        if (isIPv4(host)) {
          this.scheme = AddressScheme.IPV4;
        } else if (isIPv6(host)) {
          this.scheme = AddressScheme.IPV6;
        } else {
          this.scheme = AddressScheme.DOMAIN_NAME;
        }

        this.addressesList.push({ host, port: parseInt(port) || DEFAULT_PORT });
      }
    } else {
      this.scheme = endpoints.scheme;
      this.addressesList = endpoints.addressesList;
    }

    this.facade = this.addressesList
      .map((addr) => `${addr.host}:${addr.port}`)
      .join(",");
  }

  /**
   * 获取端点的 gRPC 目标字符串。
   */
  getGrpcTarget() {
    return this.facade;
  }

  /**
   * 将 Endpoints 对象转换为 protobuf 对象。
   */
  toProtobuf() {
    const endpoints = new EndpointsPB();

    endpoints.setScheme(this.scheme);

    for (const address of this.addressesList) {
      endpoints.addAddresses().setHost(address.host).setPort(address.port);
    }

    return endpoints;
  }
}
