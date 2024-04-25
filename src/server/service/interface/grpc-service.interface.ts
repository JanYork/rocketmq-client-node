import {Server} from "@grpc/grpc-js";

/**
 * Interface for gRPC service，预留上层扩展接口
 *
 * @export
 */
interface IGrpcService {
    /**
     * Register service
     * @param server
     */
    register(server: Server): void;
}

export { IGrpcService };
