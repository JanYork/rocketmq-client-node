import {ClientDuplexStream, ClientReadableStream, ClientWritableStream} from "@grpc/grpc-js";

/**
 * Interface for gRPC client，预留上层扩展接口
 *
 * @export
 */
interface IGrpcClient {
    /**
     * 发起一元调用
     *
     * @param method - 方法名
     * @param requestData - 请求数据
     */
    unaryCall<TRequest, TResponse>(method: string, requestData: TRequest): Promise<TResponse>;

    /**
     * 发起服务端流式调用
     *
     * @param method
     * @param requestData
     */
    serverStreamingCall<TRequest, TResponse>(method: string, requestData: TRequest): ClientReadableStream<TResponse>;

    /**
     * 发起客户端流式调用
     *
     * @param method
     */
    clientStreamingCall<TRequest, TResponse>(method: string): ClientWritableStream<TRequest>;

    /**
     * 发起双向流式调用
     *
     * @param method
     */
    duplexStreamingCall<TRequest, TResponse>(method: string): ClientDuplexStream<TRequest, TResponse>;

    /**
     * 关闭连接
     */
    close(): void;
}

export {IGrpcClient};
