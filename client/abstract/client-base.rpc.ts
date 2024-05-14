import * as grpc from '@grpc/grpc-js';
import { ChannelCredentials } from '@grpc/grpc-js';
import { MessagingServiceClient } from '../../rpc/apache/rocketmq/v2/service_grpc_pb';
import { IGrpcClient } from '../interface';
import { Endpoints } from '../../model';

/**
 * gRPC 客户端的抽象基类，实现基本的客户端功能。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午3:18
 */
export default abstract class BaseGrpcClient implements IGrpcClient {
  /**
   * gRPC 客户端实例
   * @protected
   */
  protected readonly client: MessagingServiceClient;

  /**
   * 构造函数，初始化 gRPC 客户端。
   *
   * @param endpoints 端点信息
   * @param sslEnabled 是否启用 SSL
   */
  protected constructor(endpoints: Endpoints, sslEnabled: boolean) {
    const address = endpoints.getGrpcTarget();
    const grpcCredentials = sslEnabled
      ? ChannelCredentials.createSsl()
      : ChannelCredentials.createInsecure();
    this.client = new MessagingServiceClient(address, grpcCredentials);
  }

  /**
   * 发起一元调用。
   *
   * @param method
   * @param requestData
   */
  abstract unaryCall<TRequest, TResponse>(
    method: string,
    requestData: TRequest
  ): Promise<TResponse>;

  /**
   * 发起服务器流式调用。
   *
   * @param method
   * @param requestData
   */
  abstract serverStreamingCall<TRequest, TResponse>(
    method: string,
    requestData: TRequest
  ): grpc.ClientReadableStream<TResponse>;

  /**
   * 发起客户端流式调用。
   *
   * @param method
   */
  abstract clientStreamingCall<TRequest>(
    method: string
  ): grpc.ClientWritableStream<TRequest>;

  /**
   * 发起双向流式调用。
   *
   * @param method
   */
  abstract duplexStreamingCall<TRequest, TResponse>(
    method: string
  ): grpc.ClientDuplexStream<TRequest, TResponse>;

  /**
   * 关闭 gRPC 客户端连接。
   */
  close(): void {
    this.client.close();
  }
}
