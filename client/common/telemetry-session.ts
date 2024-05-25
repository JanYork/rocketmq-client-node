import { ClientDuplexStream } from '@grpc/grpc-js';
import { TelemetryCommand } from '../../rpc/apache/rocketmq/v2/service_pb';
import { RpcBaseClient } from '../rpc-base-client';
import { Logger } from '../../logger';
import { Endpoints } from '../../model';

/**
 * 遥测会话
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午3:07
 */
export class TelemetrySession {
  /**
   * RocketMQ 端点地址
   * @private
   */
  readonly #endpoints: Endpoints;

  /**
   * RocketMQ 客户端基础客户端
   * @private
   */
  #client: RpcBaseClient;

  /**
   * 日志记录器
   * @private
   */
  #logger: Logger;

  /**
   * 遥测数据传输流
   * @private
   */
  #stream: ClientDuplexStream<TelemetryCommand, TelemetryCommand>;

  constructor(baseClient: RpcBaseClient, endpoints: Endpoints, logger: Logger) {
    this.#endpoints = endpoints;
    this.#client = baseClient;
    this.#logger = logger;
    this.#renewStream(true);
  }

  /**
   * 释放遥测会话。
   */
  release() {
    this.#logger.info({
      message: 'Begin to release telemetry session',
      context: {
        endpoints: this.#endpoints,
        clientId: this.#client.id
      }
    });

    this.#stream.end();
    this.#stream.removeAllListeners();
  }

  /**
   * 写入遥测命令。
   *
   * @param command 遥测命令
   */
  write(command: TelemetryCommand) {
    this.#stream.write(command);
  }

  /**
   * 同步设置。
   */
  syncSetting() {
    const command = this.#client.settingsCommand();
    this.write(command);
  }

  /**
   * 重置遥测数据传输流。
   *
   * @param inited 是否初始化
   * @private
   */
  #renewStream(inited: boolean) {
    this.#stream = this.#client.createTelemetryStream(this.#endpoints);
    this.#stream.on('data', this.#onData.bind(this));
    this.#stream.once('error', this.#onError.bind(this));
    this.#stream.once('end', this.#onEnd.bind(this));

    if (!inited) {
      this.syncSetting();
    }
  }

  /**
   * 处理遥测数据。
   *
   * @param command 遥测命令
   * @private
   */
  #onData(command: TelemetryCommand) {
    const endpoints = this.#endpoints;
    const clientId = this.#client.id;
    const commandCase = command.getCommandCase();
    switch (commandCase) {
      case TelemetryCommand.CommandCase.SETTINGS:
        this.#logger.info({
          message: 'Receive settings from remote',
          context: {
            endpoints,
            clientId
          }
        });

        this.#client.onSettingsCommand(endpoints, command.getSettings()!);
        break;
      case TelemetryCommand.CommandCase.RECOVER_ORPHANED_TRANSACTION_COMMAND: {
        this.#logger.info({
          message: 'Receive orphaned transaction recovery command from remote',
          context: {
            endpoints,
            clientId
          }
        });

        this.#client.onRecoverOrphanedTransactionCommand(
          endpoints,
          command.getRecoverOrphanedTransactionCommand()!
        );
        break;
      }
      case TelemetryCommand.CommandCase.VERIFY_MESSAGE_COMMAND: {
        this.#logger.info({
          message: 'Receive message verification command from remote',
          context: {
            endpoints,
            clientId
          }
        });

        this.#client.onVerifyMessageCommand(
          endpoints,
          command.getVerifyMessageCommand()!
        );
        break;
      }
      case TelemetryCommand.CommandCase.PRINT_THREAD_STACK_TRACE_COMMAND: {
        this.#logger.info({
          message: 'Receive thread stack print command from remote',
          context: {
            endpoints,
            clientId
          }
        });

        this.#client.onPrintThreadStackTraceCommand(
          endpoints,
          command.getPrintThreadStackTraceCommand()!
        );
        break;
      }
      default: {
        const commandBO = command.toObject();

        this.#logger.warn({
          message: 'Receive unrecognized command from remote',
          context: {
            endpoints,
            commandCase,
            command: commandBO,
            clientId
          }
        });

        // 如果遥测会话启动失败，需要通知客户端
        this.#client.onUnknownCommand(endpoints, commandBO.status!);
      }
    }
  }

  /**
   * 处理遥测数据传输流异常。
   *
   * @param err 异常
   * @private
   */
  #onError(err: Error) {
    this.#logger.error({
      message: 'Exception raised from stream response observer',
      context: {
        endpoints: this.#endpoints,
        clientId: this.#client.id,
        error: err
      }
    });

    this.release();

    setTimeout(() => {
      this.#renewStream(false);
    }, 1000);
  }

  /**
   * 处理遥测数据传输流结束。
   *
   * @private
   */
  #onEnd() {
    this.#logger.info({
      message: 'Receive completion for stream response observer',
      context: {
        endpoints: this.#endpoints,
        clientId: this.#client.id
      }
    });

    this.release();

    setTimeout(() => {
      this.#renewStream(false);
    }, 1000);
  }
}
