import { randomUUID } from 'node:crypto';
import { Metadata } from '@grpc/grpc-js';
import {
  Settings as SettingsPB,
  Status,
  ClientType,
  Code
} from '@/rpc/apache/rocketmq/v2/definition_pb';
import {
  QueryRouteRequest,
  RecoverOrphanedTransactionCommand,
  VerifyMessageCommand,
  PrintThreadStackTraceCommand,
  TelemetryCommand,
  ThreadStackTrace,
  HeartbeatRequest,
  NotifyClientTerminationRequest
} from '@/rpc/apache/rocketmq/v2/service_pb';
import Logger from '@/logger';
import { createResource, getRequestDateTime, sign } from '@/util';
import { TopicRoute, Endpoints } from '@/model';
import { ClientException, StatusChecker } from '@/exception';
import {
  SessionCredential,
  ClientFlagHelper,
  Setting,
  UserAgent,
  BaseClientOption,
  RpcClientManger,
  TelemetrySession
} from '@/server/client';
import ConsoleLogger from '@/logger/console.logger';
import LogLevel from '@/enum/logger.enum';

/**
 * RocketMQ Base Client，MQ Consumer 和 MQ Producer 继承自此类。
 *
 * 主要处理：
 *  - Client 生命周期，例如：清理空闲客户端。
 *  - 启动流程。
 *  - 定期任务。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/2 20:15
 */
export abstract class RpcBaseClient {
  /**
   * 客户端标识
   */
  readonly id = ClientFlagHelper.create();

  /**
   * 客户端类型
   */
  readonly type = ClientType.CLIENT_TYPE_UNSPECIFIED;

  /**
   * 是否启用 SSL
   */
  readonly sslEnabled: boolean;

  /**
   * 会话凭证
   * @private
   */
  readonly #sessionCredential?: SessionCredential;

  /**
   * 端点信息
   * @protected
   */
  protected readonly endpoints: Endpoints;

  /**
   * 隔离的端点信息
   * @protected
   */
  protected readonly isolated = new Map<string, Endpoints>();

  /**
   * 请求超时时间
   * @protected
   */
  protected readonly requestTimeout: number;

  /**
   * 主题集合
   * @protected
   */
  protected readonly topics = new Set<string>();

  /**
   * 主题路由缓存
   * @protected
   */
  protected readonly topicRouteCache = new Map<string, TopicRoute>();

  /**
   * 日志记录器
   * @protected
   */
  protected readonly logger: Logger;

  /**
   * RPC 客户端管理器
   * @protected
   */
  protected readonly manager: RpcClientManger;

  /**
   * 遥测会话（遥测：用于监控、追踪、诊断）
   * @private
   */
  readonly #telemetrySessionMap = new Map<string, TelemetrySession>();

  /**
   * 启动成功函数
   * @private
   */
  #startupResolve?: () => void;

  /**
   * 启动失败函数
   * @private
   */
  #startupReject?: (err: Error) => void;

  /**
   * 定时器集合
   * @private
   */
  #timers: NodeJS.Timeout[] = [];

  protected constructor(options: BaseClientOption) {
    this.logger =
      options.logger ?? new Logger(new ConsoleLogger(), LogLevel.INFO);
    this.sslEnabled = options.sslEnabled === true;
    this.endpoints = new Endpoints(options.endpoints);
    this.#sessionCredential = options.sessionCredential;
    // 关于规约，请阅读：https://rocketmq.apache.org/docs/introduction/03limits/
    this.requestTimeout = options.requestTimeout ?? 3000;

    // 初始化 topics
    if (options.topics) {
      for (const topic of options.topics) {
        this.topics.add(topic);
      }
    }

    this.manager = new RpcClientManger(this, this.logger);
  }

  /**
   * 启动 RocketMQ 客户端。
   * <br/>
   * 关于启动流程请参阅：https://github.com/apache/rocketmq-clients/blob/master/docs/workflow.md#startup
   */
  async startup() {
    this.logger.info({
      message: 'Begin to startup the rocketmq client',
      context: { clientId: this.id }
    });

    try {
      await this.#startup();
    } catch (e) {
      const err = new Error(
        `Startup the rocketmq client failed, clientId=${this.id}, error=${e}`
      );
      this.logger.error({ message: err.message, error: err });
      err.cause = e;
      throw err;
    }

    this.logger.info({
      message: 'Startup the rocketmq client successfully',
      context: { clientId: this.id }
    });
  }

  /**
   * 启动流程（内部）。
   * @private
   */
  async #startup() {
    // 获取主题路由
    await this.updateRoutes();

    // 每 30 秒更新一次主题路由
    this.#timers.push(
      setInterval(async () => {
        this.updateRoutes().catch(e => {
          this.logger.error({
            message: 'Update routes failed',
            error: e
          });
        });
      }, 30000)
    );

    // 每 5 分钟同步一次设置
    this.#timers.push(
      setInterval(async () => {
        this.#syncSettings();
      }, 5 * 60000)
    );

    // 每 10 秒心跳一次
    this.#timers.push(
      setInterval(async () => {
        this.#doHeartbeat().catch(e => {
          this.logger.error({
            message: 'Do heartbeat failed',
            error: e
          });
        });
      }, 10000)
    );

    // 每 60 秒进行一次统计
    // doStats()

    if (this.topics.size > 0) {
      // 等待第一次 onSettingsCommand 调用

      await new Promise<void>((resolve, reject) => {
        this.#startupReject = reject;
        this.#startupResolve = resolve;
      });

      this.#startupReject = undefined;
      this.#startupResolve = undefined;
    }
  }

  /**
   * 关闭 RocketMQ 客户端。
   */
  async shutdown() {
    this.logger.info({
      message: 'Begin to shutdown the rocketmq client',
      context: { clientId: this.id }
    });

    while (this.#timers.length > 0) {
      const timer = this.#timers.pop();
      clearInterval(timer);
    }

    await this.#notifyClientTermination();

    this.logger.info({
      message: 'Release all telemetry sessions successfully',
      context: { clientId: this.id }
    });

    this.#releaseTelemetrySessions();

    this.logger.info({
      message: 'Shutdown the rocketmq client successfully',
      context: { clientId: this.id }
    });

    this.manager.close();

    this.logger.info({
      message: 'Shutdown the rocketmq client successfully',
      context: { clientId: this.id }
    });
  }

  /**
   * RPC-心跳。
   *
   * @private
   */
  async #doHeartbeat() {
    const request = this.wrapHeartbeatRequest();
    for (const endpoints of this.getTotalRouteEndpoints()) {
      await this.manager.heartbeat(endpoints, request, this.requestTimeout);
    }
  }

  /**
   * 获取所有路由端点信息（Map）。
   *
   * @private
   */
  #getTotalRouteEndpointsMap() {
    const endpointsMap = new Map<string, Endpoints>();
    for (const topicRoute of this.topicRouteCache.values()) {
      for (const endpoints of topicRoute.findTotalEndpoints()) {
        endpointsMap.set(endpoints.facade, endpoints);
      }
    }
    return endpointsMap;
  }

  /**
   * 获取所有路由端点信息（List）。
   *
   * @protected
   */
  protected getTotalRouteEndpoints() {
    const endpointsMap = this.#getTotalRouteEndpointsMap();
    return Array.from(endpointsMap.values());
  }

  /**
   * 查找新的路由端点信息。
   *
   * @param endpointsList
   * @protected
   */
  protected findNewRouteEndpoints(endpointsList: Endpoints[]) {
    const endpointsMap = this.#getTotalRouteEndpointsMap();
    const newEndpoints: Endpoints[] = [];
    for (const endpoints of endpointsList) {
      if (!endpointsMap.has(endpoints.facade)) {
        newEndpoints.push(endpoints);
      }
    }
    return newEndpoints;
  }

  /**
   * 更新路由。
   *
   * @protected
   */
  protected async updateRoutes() {
    for (const topic of this.topics) {
      await this.#fetchTopicRoute(topic);
    }
  }

  /**
   * 获取路由数据。
   *
   * @param topic 主题
   * @protected
   */
  protected async getRoute(topic: string) {
    let topicRoute = this.topicRouteCache.get(topic);
    if (!topicRoute) {
      this.topics.add(topic);
      topicRoute = await this.#fetchTopicRoute(topic);
    }
    return topicRoute;
  }

  /**
   * 请求主题路由。
   *
   * @param topic 主题
   * @private
   */
  async #fetchTopicRoute(topic: string) {
    const request = new QueryRouteRequest();

    request.setTopic(createResource(topic));
    request.setEndpoints(this.endpoints.toProtobuf());

    const response = await this.manager.queryRoute(
      this.endpoints,
      request,
      this.requestTimeout
    );

    StatusChecker.check(response.getStatus()?.toObject());

    const topicRoute = new TopicRoute(response.getMessageQueuesList());
    const newEndpoints = this.findNewRouteEndpoints(
      topicRoute.findTotalEndpoints()
    );

    for (const endpoints of newEndpoints) {
      // 将当前设置同步到新终结点
      this.getTelemetrySession(endpoints).syncSetting();
    }

    this.topicRouteCache.set(topic, topicRoute);
    this.onTopicRouteUpdate(topic, topicRoute);

    this.logger.debug({
      message: 'Fetch topic route successfully',
      context: { topic, topicRoute }
    });

    return topicRoute;
  }

  /**
   * 同步RocketMQ Telemetry设置。
   *
   * @private
   */
  #syncSettings() {
    const command = this.settingsCommand();
    for (const endpoints of this.getTotalRouteEndpoints()) {
      this.telemetry(endpoints, command);
    }
  }

  /**
   * RocketMQ Telemetry设置。
   */
  settingsCommand() {
    const command = new TelemetryCommand();
    command.setSettings(this.getSetting().toProtobuf());
    return command;
  }

  /**
   * 获取遥测会话。
   *
   * @param endpoints
   */
  getTelemetrySession(endpoints: Endpoints) {
    let session = this.#telemetrySessionMap.get(endpoints.facade);
    if (!session) {
      session = new TelemetrySession(this, endpoints, this.logger);
      this.#telemetrySessionMap.set(endpoints.facade, session);
    }
    return session;
  }

  /**
   * 创建遥测数据流。
   *
   * @param endpoints
   */
  createTelemetryStream(endpoints: Endpoints) {
    const metadata = this.getRequestMetadata();
    return this.manager.telemetry(endpoints, metadata);
  }

  /**
   * 发送遥测数据。
   *
   * @param endpoints 遥测端点
   * @param command 遥测命令
   */
  telemetry(endpoints: Endpoints, command: TelemetryCommand) {
    this.getTelemetrySession(endpoints).write(command);
  }

  /**
   * 获取请求元数据。
   * <br/>
   * 详细阅读：https://github.com/apache/rocketmq-clients/blob/master/docs/transport.md
   */
  getRequestMetadata() {
    // 构建请求元数据
    const metadata = new Metadata();
    // 获取当前时间
    const dateTime = getRequestDateTime();

    // 协议版本
    metadata.set('x-mq-protocol', 'v2');
    // 唯一客户标识符：mbp@78774@2@3549a8wsr
    metadata.set('x-mq-client-id', this.id);
    // 当前时间戳：20210309T195445Z，DATE_TIME_FORMAT = “yyyyMMdd'T'HHmmss'Z'”
    metadata.set('x-mq-date-time', dateTime);
    // 每个 gRPC 标头的请求 ID：f122a1e0-dbcf-4ca4-9db7-221903354be7
    metadata.set('x-mq-request-id', randomUUID());

    // 客户端编程语言（暂时没有NodeJS的类型枚举）
    // FIXME: java.lang.IllegalArgumentException: No enum constant org.apache.rocketmq.remoting.protocol.LanguageCode.nodejs
    // https://github.com/apache/rocketmq/blob/master/remoting/src/main/java/org/apache/rocketmq/remoting/protocol/LanguageCode.java
    metadata.set('x-mq-language', 'HTTP');
    // 客户端版本
    metadata.set('x-mq-client-version', UserAgent.INSTANCE.version);

    if (this.#sessionCredential) {
      if (this.#sessionCredential.securityToken) {
        metadata.set(
          'x-mq-session-token',
          this.#sessionCredential.securityToken
        );
      }
      const signature = sign(this.#sessionCredential.accessSecret, dateTime);
      const authorization = `MQv2-HMAC-SHA1 Credential=${this.#sessionCredential.accessKey}, SignedHeaders=x-mq-date-time, Signature=${signature}`;
      metadata.set('authorization', authorization);
    }
    return metadata;
  }

  protected abstract getSetting(): Setting;

  /**
   * 包装心跳请求
   *
   * @protected
   */
  protected abstract wrapHeartbeatRequest(): HeartbeatRequest;

  /**
   * 包装通知客户端终止请求。
   *
   * @protected
   */
  protected abstract wrapNotifyClientTerminationRequest(): NotifyClientTerminationRequest;

  /**
   * 释放遥测会话。
   *
   * @private
   */
  #releaseTelemetrySessions() {
    for (const session of this.#telemetrySessionMap.values()) {
      session.release();
    }
    this.#telemetrySessionMap.clear();
  }

  /**
   * 通知远程当前客户端已准备好终止。
   */
  async #notifyClientTermination() {
    this.logger.info({
      message: 'Notify remote that client is terminated',
      context: { clientId: this.id }
    });

    const request = this.wrapNotifyClientTerminationRequest();

    for (const endpoints of this.getTotalRouteEndpoints()) {
      await this.manager.notifyClientTermination(
        endpoints,
        request,
        this.requestTimeout
      );
    }
  }

  /**
   * 主题路由更新。
   *
   * @param _topic 主题
   * @param _topicRoute 主题路由
   * @protected
   */
  protected onTopicRouteUpdate(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _topic: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _topicRoute: TopicRoute
  ) {
    // 子类可以在此处监控主题路由数据更改
  }

  /**
   *（触发）未知命令。
   *
   * @param endpoints 端点
   * @param status 状态
   */
  onUnknownCommand(endpoints: Endpoints, status: Status.AsObject) {
    try {
      StatusChecker.check(status);
    } catch (err) {
      this.logger.error({
        message: 'Get error status from telemetry session',
        error: err,
        context: { status, endpoints }
      });

      this.#startupReject && this.#startupReject(err as ClientException);
    }
  }

  /**
   *（触发）设置命令。
   *
   * @param _endpoints 端点
   * @param setting 设置
   */
  onSettingsCommand(_endpoints: Endpoints, setting: SettingsPB) {
    // final metric = new Metric(settings.getMetric());
    // clientMeterManager.reset(metric);
    this.getSetting().sync(setting);

    this.logger.info({
      message: 'Sync settings',
      context: { settings: this.getSetting() }
    });

    this.#startupResolve && this.#startupResolve();
  }

  /**
   *（触发）心跳命令。
   *
   * @param _endpoints 端点
   * @param command 心跳命令
   */
  onRecoverOrphanedTransactionCommand(
    _endpoints: Endpoints,
    command: RecoverOrphanedTransactionCommand
  ) {
    this.logger.warn({
      message: 'Ignore orphaned transaction recovery command from remote',
      context: { command: command.toObject() }
    });

    // const telemetryCommand = new TelemetryCommand();
    // telemetryCommand.setStatus(new Status().setCode(Code.NOT_IMPLEMENTED));
    // telemetryCommand.setRecoverOrphanedTransactionCommand(new RecoverOrphanedTransactionCommand());
    // this.telemetry(endpoints, telemetryCommand);
  }

  /**
   *（触发）验证消息命令。
   *
   * @param endpoints 端点
   * @param command 验证消息命令
   */
  onVerifyMessageCommand(endpoints: Endpoints, command: VerifyMessageCommand) {
    const commandBO = command.toObject();

    this.logger.warn({
      message:
        'Ignore verify message command from remote，which is not expected',
      context: { clientId: this.id, command: commandBO }
    });

    const telemetryCommand = new TelemetryCommand();
    telemetryCommand.setStatus(new Status().setCode(Code.NOT_IMPLEMENTED));
    telemetryCommand.setVerifyMessageCommand(
      new VerifyMessageCommand().setNonce(commandBO.nonce)
    );
    this.telemetry(endpoints, telemetryCommand);
  }

  /**
   * 打印线程堆栈跟踪命令。
   *
   * @param endpoints
   * @param command
   */
  onPrintThreadStackTraceCommand(
    endpoints: Endpoints,
    command: PrintThreadStackTraceCommand
  ) {
    const commandBO = command.toObject();

    this.logger.warn({
      message:
        'Ignore print thread stack trace command from remote, which is not expected',
      context: { clientId: this.id, command: commandBO }
    });

    const nonce = commandBO.nonce;
    const telemetryCommand = new TelemetryCommand();
    telemetryCommand.setThreadStackTrace(
      new ThreadStackTrace().setThreadStackTrace('mock stack').setNonce(nonce)
    );
    telemetryCommand.setStatus(new Status().setCode(Code.OK));
    this.telemetry(endpoints, telemetryCommand);
  }
}
