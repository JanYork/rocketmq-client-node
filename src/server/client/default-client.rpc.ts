import BaseGrpcClient from "@/server/client/abstract/client-base.rpc";
import {ClientDuplexStream, ClientReadableStream, ClientWritableStream, ServiceError} from "@grpc/grpc-js";

/**
 * 具体的 gRPC 客户端实现。
 *
 * @export
 * @class DefaultClientRPC
 * @extends {BaseGrpcClient}
 * @implements {IGrpcClient}
 * @template TRequest 请求数据类型
 * @template TResponse 响应数据类型
 */
export default class DefaultClientRPC extends BaseGrpcClient {
    /**
     * 单向调用
     *
     * @param method
     * @param requestData
     */
    unaryCall<TRequest, TResponse>(method: string, requestData: TRequest): Promise<TResponse> {
        return new Promise((resolve, reject) => {
            this.client[method](requestData, (err: ServiceError | null, response: TResponse) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
        });
    }

    /**
     * 服务器流式调用
     *
     * @param method
     * @param requestData
     */
    serverStreamingCall<TRequest, TResponse>(method: string, requestData: TRequest): ClientReadableStream<TResponse> {
        return this.client[method](requestData);
    }

    /**
     * 客户端流式调用
     *
     * @param method
     */
    clientStreamingCall<TRequest, TResponse>(method: string): ClientWritableStream<TRequest> {
        return this.client[method]();
    }

    /**
     * 双向流式调用
     *
     * @param method
     */
    duplexStreamingCall<TRequest, TResponse>(method: string): ClientDuplexStream<TRequest, TResponse> {
        return this.client[method]();
    }
}
