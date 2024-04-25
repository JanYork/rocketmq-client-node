import { Server, ServerCredentials } from '@grpc/grpc-js';
import { IGrpcService } from "@/server/service/interface/grpc-service.interface";

/**
 * gRPC 服务工厂，支持动态管理服务的生命周期
 *
 * @export
 * @class GrpcServiceFactory
 */
export class GrpcServiceFactory {
    /**
     * gRPC 服务器实例
     * @private
     */
    private readonly server: Server;

    /**
     * 服务列表
     * @private
     */
    private readonly service: IGrpcService[] = [];

    /**
     * 服务器是否正在运行
     * @private
     */
    private isServerRunning: boolean = false;

    constructor(server: Server) {
        this.server = server;
    }

    /**
     * 添加服务到工厂
     *
     * @param service 要添加的服务
     */
    public put(service: IGrpcService): void {
        this.service.push(service);
        if (this.isServerRunning) {
            service.register(this.server);
        }
    }

    /**
     * 注册所有已添加的服务到 gRPC 服务器
     */
    public registerAll(): void {
        this.service.forEach(service => {
            service.register(this.server);
        });
    }

    /**
     * 启动 gRPC 服务器
     *
     * @param address 服务器地址
     * @param credentials 服务器凭据
     */
    public startServer(address: string, credentials: ServerCredentials = ServerCredentials.createInsecure()): void {
        this.registerAll();
        this.server.bindAsync(address, credentials, (err, port) => {
            if (err) {
                console.error(`Server failed to bind: ${err.message}`);
                return;
            }
            this.isServerRunning = true;
            console.log(`Server is running at ${address}:${port}`);
        });
    }

    /**
     * 停止 gRPC 服务器
     */
    public stopServer(): void {
        if (this.isServerRunning) {
            this.server.tryShutdown((err) => {
                if (err) {
                    console.error(`Failed to shut down server: ${err.message}`);
                } else {
                    console.log('Server has been successfully shutdown.');
                    this.isServerRunning = false;
                }
            });
        }
    }
}
