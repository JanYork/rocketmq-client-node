import {IGrpcConfig} from "@/interface/grpc-config.interface";

/**
 * Environment based gRPC configuration
 *
 * @export
 * @class Environment
 * @implements {IGrpcConfig}
 * @property {string} host - Host of the gRPC server
 * @property {number} port - Port of the gRPC server
 */
class EnvironmentConfig implements IGrpcConfig {
    host = process.env.GRPC_HOST || 'localhost';
    port = parseInt(process.env.GRPC_PORT || '50051');
}

/**
 * gRPC configuration
 *
 * @export
 * @class GrpcConfig
 * @implements {IGrpcConfig}
 * @property {string} host - Host of the gRPC server
 * @property {number} port - Port of the gRPC server
 * @method loadConfig - Load configuration
 */
export default class GrpcConfig implements IGrpcConfig {
    /**
     * gRPC configuration
     * @private
     */
    private config: IGrpcConfig;

    constructor() {
        this.loadConfig();
    }

    private loadConfig(): void {
        // 这里可以增加从文件或其他源加载配置
        this.config = new EnvironmentConfig();
    }

    get host(): string {
        return this.config.host;
    }

    get port(): number {
        return this.config.port;
    }

    get address(): string {
        return `${this.host}:${this.port}`;
    }
}
