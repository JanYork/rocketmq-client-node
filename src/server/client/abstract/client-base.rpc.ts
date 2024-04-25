import {IGrpcClient} from "@/server/client/interface/grpc-client.interface";
import * as grpc from "@grpc/grpc-js";

/**
 * gRPC 客户端的抽象基类，实现基本的客户端功能。
 */
export default abstract class BaseGrpcClient implements IGrpcClient {
    /**
     * gRPC 客户端实例。
     * @protected
     */
    protected client: grpc.Client;

    /**
     * 构造函数，初始化 gRPC 客户端。
     *
     * @param serviceProto gRPC 服务的原型。
     * @param address 服务的地址。
     * @param credentials 认证凭据，默认为不安全连接。
     */
    constructor(serviceProto: any, address: string, credentials: grpc.ChannelCredentials = grpc.credentials.createInsecure()) {
        this.client = new serviceProto(address, credentials);
    }

    abstract unaryCall<TRequest, TResponse>(method: string, requestData: TRequest): Promise<TResponse>;

    abstract serverStreamingCall<TRequest, TResponse>(method: string, requestData: TRequest): grpc.ClientReadableStream<TResponse>;

    abstract clientStreamingCall<TRequest, TResponse>(method: string): grpc.ClientWritableStream<TRequest>;

    abstract duplexStreamingCall<TRequest, TResponse>(method: string): grpc.ClientDuplexStream<TRequest, TResponse>;

    /**
     * 关闭 gRPC 客户端连接。
     */
    close(): void {
        this.client.close();
    }
}
