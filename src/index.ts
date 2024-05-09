import * as dotenv from "dotenv";
import Logger from "@/logger";
import ConsoleLogger from "@/logger/console.logger";
import LogLevel from "@/enum/logger.enum";
import { Server, ServerCredentials } from "@grpc/grpc-js";
import { GrpcServiceFactory } from "@/factory/grpc-service.factory";
import { AdminRPC } from "@/server/service";
import GrpcConfig from "@/config/env.config";

/**
 * 用于管理 gRPC 服务器生命周期的应用程序类。
 * 此类初始化服务器，管理启动和关闭序列，并暴露钩子以便在生命周期关键事件中插入自定义逻辑。
 *
 * @export
 * @class Application
 * @example
 * const app = new Application();
 * app.setBeforeStartCallback(() => console.log('Before start'));
 * app.setAfterStartCallback(() => console.log('After start'));
 * app.setBeforeShutdownCallback(() => console.log('Before shutdown'));
 * app.setAfterShutdownCallback(() => console.log('After shutdown'));
 * app.start();
 */
class Application {
  private readonly logger: Logger;
  private readonly server: Server;
  private readonly factory: GrpcServiceFactory;
  private readonly config: GrpcConfig;

  constructor() {
    dotenv.config();
    this.logger = Logger.create(new ConsoleLogger(), LogLevel.DEBUG);
    this.config = new GrpcConfig();
    this.server = new Server();
    this.factory = new GrpcServiceFactory(this.server);
  }

  /**
   * 启动应用程序，注册服务并监听端口。
   *
   * @returns {Promise<void>}
   */
  async start(): Promise<void> {
    this.onBeforeStart?.();

    const adminRPC = new AdminRPC();

    this.factory.put(adminRPC);

    try {
      this.factory.startServer(
        this.config.address,
        ServerCredentials.createInsecure(),
      );
      this.logger.info({ message: `服务器正在运行于 ${this.config.address}` });

      process.on("SIGINT", this.shutdown.bind(this));

      this.onAfterStart?.();
    } catch (error) {
      this.logger.error({ message: "服务器启动失败", error });
    }
  }

  /**
   * 在应用程序即将关闭时执行的操作。
   */
  private shutdown(): void {
    this.onBeforeShutdown?.();
    this.factory.stopServer();
    this.onAfterShutdown?.();
  }

  setBeforeStartCallback(callback: () => void): void {
    this.onBeforeStart = callback;
  }

  setAfterStartCallback(callback: () => void): void {
    this.onAfterStart = callback;
  }

  setBeforeShutdownCallback(callback: () => void): void {
    this.onBeforeShutdown = callback;
  }

  setAfterShutdownCallback(callback: () => void): void {
    this.onAfterShutdown = callback;
  }

  private onBeforeStart?: () => void;

  private onAfterStart?: () => void;

  private onBeforeShutdown?: () => void;

  private onAfterShutdown?: () => void;
}

export default Application;
