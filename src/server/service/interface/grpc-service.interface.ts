import { Server } from "@grpc/grpc-js";

/**
 * gRPC 服务接口
 *
 * @export
 */
export interface IGrpcService {
  /**
   * 注册 gRPC 服务
   *
   * @param server
   */
  register(server: Server): void;
}
