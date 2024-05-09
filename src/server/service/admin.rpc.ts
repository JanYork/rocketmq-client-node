import { IGrpcService } from "@/server/service/interface/grpc-service.interface";
import * as grpc from "@grpc/grpc-js";
import * as service from "@/rpc/apache/rocketmq/v2/admin_grpc_pb";
import * as message from "@/rpc/apache/rocketmq/v2/admin_pb";
import { Server } from "@grpc/grpc-js";

export class AdminRPC implements IGrpcService {
  /**
   * Register the service with the server
   *
   * @param server
   */
  public register(server: Server): void {
    server.addService(service.AdminService, {
      changeLogLevel: this.changeLogLevel.bind(this),
    });
  }

  /**
   * Implements the GetBrokerConfig RPC method.
   *
   * @param call gRPC call object
   * @param callback gRPC callback
   * @private
   */
  private changeLogLevel(
    call: grpc.ServerUnaryCall<
      message.ChangeLogLevelRequest,
      message.ChangeLogLevelResponse
    >,
    callback: grpc.sendUnaryData<message.ChangeLogLevelResponse>,
  ): void {
    const request = call.request;
    const response = new message.ChangeLogLevelResponse();

    // 这里添加修改日志级别的逻辑
    console.log(
      `Received request to change log level to: ${request.getLevel()}`,
    );

    // 响应消息
    response.setRemark(`Log level changed to: ${request.getLevel()}`);
    callback(null, response);
  }
}
