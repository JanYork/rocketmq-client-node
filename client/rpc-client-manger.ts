import { Metadata } from '@grpc/grpc-js';
import {
  AckMessageRequest,
  ChangeInvisibleDurationRequest,
  EndTransactionRequest,
  ForwardMessageToDeadLetterQueueRequest,
  GetOffsetRequest,
  HeartbeatRequest,
  NotifyClientTerminationRequest,
  PullMessageRequest,
  QueryAssignmentRequest,
  QueryOffsetRequest,
  QueryRouteRequest,
  ReceiveMessageRequest,
  SendMessageRequest,
  UpdateOffsetRequest
} from '../rpc/apache/rocketmq/v2/service_pb';
import { RpcBaseClient } from './rpc-base-client';
import { Logger } from '../logger';
import { RpcClient } from './rpc-client';
import { Endpoints } from '../model';

/**
 * RPC客户端最大空闲时间，30 minutes
 */
const RPC_CLIENT_MAX_IDLE_DURATION = 30 * 60000;

/**
 * RPC客户端空闲检查周期，60 seconds
 */
const RPC_CLIENT_IDLE_CHECK_PERIOD = 60000;

/**
 * RPC客户端管理器
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午2:46
 */
export class RpcClientManger {
  /**
   * RPC客户端集合
   * @private
   */
  #clientMap = new Map<Endpoints, RpcClient>();

  /**
   * 基础客户端
   * @private
   */
  #client: RpcBaseClient;

  /**
   * 日志记录器
   * @private
   */
  #logger: Logger;

  /**
   * 清理空闲RPC客户端定时器
   * @private
   */
  #cleanUpIdleClientTimer: NodeJS.Timeout;

  constructor(baseClient: RpcBaseClient, logger: Logger) {
    this.#client = baseClient;
    this.#logger = logger;
    this.#startUp();
  }

  /**
   * 启动客户端管理器。
   *
   * @private
   */
  #startUp() {
    this.#cleanUpIdleClientTimer = setInterval(() => {
      this.#clearIdleClient();
    }, RPC_CLIENT_IDLE_CHECK_PERIOD);
  }

  /**
   * 清理空闲RPC客户端。
   *
   * @private
   */
  #clearIdleClient() {
    for (const [endpoints, client] of this.#clientMap.entries()) {
      const idleDuration = client.idleDuration();

      if (idleDuration > RPC_CLIENT_MAX_IDLE_DURATION) {
        client.close();
        this.#clientMap.delete(endpoints);

        this.#logger.info({
          message:
            '[RpcClientManger] RpcClientManger client has been idle for a long time',
          context: {
            endpoints,
            idleDuration,
            RPC_CLIENT_MAX_IDLE_DURATION,
            clientId: this.#client.id
          }
        });
      }
    }
  }

  /**
   * 获取RPC客户端。
   *
   * @param endpoints 服务端点
   * @private
   */
  #getClient(endpoints: Endpoints) {
    let rpcClient = this.#clientMap.get(endpoints);

    if (!rpcClient) {
      rpcClient = new RpcClient(endpoints, this.#client.sslEnabled);
      this.#clientMap.set(endpoints, rpcClient);
    }

    return rpcClient;
  }

  /**
   * 关闭客户端管理器。
   */
  close() {
    for (const [endpoints, rpcClient] of this.#clientMap.entries()) {
      rpcClient.close();
      this.#clientMap.delete(endpoints);
    }

    clearInterval(this.#cleanUpIdleClientTimer);
  }

  /**
   * 查询路由。
   *
   * @param endpoints 服务端点
   * @param duration 超时时间
   * @param request 查询路由请求
   */
  async queryRoute(
    endpoints: Endpoints,
    request: QueryRouteRequest,
    duration: number
  ) {
    const client = this.#getClient(endpoints);
    const metadata = this.#client.getRequestMetadata();
    return await client.queryRoute(request, metadata, duration);
  }

  /**
   * 心跳。
   *
   * @param endpoints 服务端点
   * @param request 心跳请求
   * @param duration 超时时间
   */
  async heartbeat(
    endpoints: Endpoints,
    request: HeartbeatRequest,
    duration: number
  ) {
    const client = this.#getClient(endpoints);
    const metadata = this.#client.getRequestMetadata();
    return await client.heartbeat(request, metadata, duration);
  }

  /**
   * 发送消息。
   *
   * @param endpoints 服务端点
   * @param request 发送消息请求
   * @param duration 超时时间
   */
  async sendMessage(
    endpoints: Endpoints,
    request: SendMessageRequest,
    duration: number
  ) {
    const client = this.#getClient(endpoints);
    const metadata = this.#client.getRequestMetadata();
    return await client.sendMessage(request, metadata, duration);
  }

  /**
   * 查询分配。
   *
   * @param endpoints 服务端点
   * @param request 查询分配请求
   * @param duration 超时时间
   */
  async queryAssignment(
    endpoints: Endpoints,
    request: QueryAssignmentRequest,
    duration: number
  ) {
    const client = this.#getClient(endpoints);
    const metadata = this.#client.getRequestMetadata();
    return await client.queryAssignment(request, metadata, duration);
  }

  /**
   * 接收消息。
   *
   * @param endpoints 服务端点
   * @param request 接收消息请求
   * @param duration 超时时间
   */
  async receiveMessage(
    endpoints: Endpoints,
    request: ReceiveMessageRequest,
    duration: number
  ) {
    const client = this.#getClient(endpoints);
    const metadata = this.#client.getRequestMetadata();
    return await client.receiveMessage(request, metadata, duration);
  }

  /**
   * 确认消息。
   *
   * @param endpoints 服务端点
   * @param request 确认消息请求
   * @param duration 超时时间
   */
  async ackMessage(
    endpoints: Endpoints,
    request: AckMessageRequest,
    duration: number
  ) {
    const client = this.#getClient(endpoints);
    const metadata = this.#client.getRequestMetadata();
    return await client.ackMessage(request, metadata, duration);
  }

  /**
   * 转发消息到死信队列。
   *
   * @param endpoints 服务端点
   * @param request 转发消息到死信队列请求
   * @param duration 超时时间
   */
  async forwardMessageToDeadLetterQueue(
    endpoints: Endpoints,
    request: ForwardMessageToDeadLetterQueueRequest,
    duration: number
  ) {
    const client = this.#getClient(endpoints);
    const metadata = this.#client.getRequestMetadata();
    return await client.forwardMessageToDeadLetterQueue(
      request,
      metadata,
      duration
    );
  }

  /**
   * 拉取消息。
   *
   * @param endpoints 服务端点
   * @param request 拉取消息请求
   * @param duration  超时时间
   */
  async pullMessage(
    endpoints: Endpoints,
    request: PullMessageRequest,
    duration: number
  ) {
    const client = this.#getClient(endpoints);
    const metadata = this.#client.getRequestMetadata();
    return await client.pullMessage(request, metadata, duration);
  }

  /**
   * 更新偏移量。
   *
   * @param endpoints 服务端点
   * @param request 更新偏移量请求
   * @param duration 超时时间
   */
  async updateOffset(
    endpoints: Endpoints,
    request: UpdateOffsetRequest,
    duration: number
  ) {
    const client = this.#getClient(endpoints);
    const metadata = this.#client.getRequestMetadata();
    return await client.updateOffset(request, metadata, duration);
  }

  /**
   * 获取偏移量。
   *
   * @param endpoints 服务端点
   * @param request 获取偏移量请求
   * @param duration 超时时间
   */
  async getOffset(
    endpoints: Endpoints,
    request: GetOffsetRequest,
    duration: number
  ) {
    const client = this.#getClient(endpoints);
    const metadata = this.#client.getRequestMetadata();
    return await client.getOffset(request, metadata, duration);
  }

  /**
   * 查询偏移量。
   *
   * @param endpoints 服务端点
   * @param request 查询偏移量请求
   * @param duration 超时时间
   */
  async queryOffset(
    endpoints: Endpoints,
    request: QueryOffsetRequest,
    duration: number
  ) {
    const client = this.#getClient(endpoints);
    const metadata = this.#client.getRequestMetadata();
    return await client.queryOffset(request, metadata, duration);
  }

  /**
   * 结束事务。
   *
   * @param endpoints 服务端点
   * @param request 结束事务请求
   * @param duration 超时时间
   */
  async endTransaction(
    endpoints: Endpoints,
    request: EndTransactionRequest,
    duration: number
  ) {
    const client = this.#getClient(endpoints);
    const metadata = this.#client.getRequestMetadata();
    return await client.endTransaction(request, metadata, duration);
  }

  /**
   * 上报遥测数据。
   *
   * @param endpoints 服务端点
   * @param metadata 遥测数据
   */
  telemetry(endpoints: Endpoints, metadata: Metadata) {
    const client = this.#getClient(endpoints);
    return client.telemetry(metadata);
  }

  /**
   * 修改不可见持续时间。
   *
   * @param endpoints 服务端点
   * @param request 修改不可见持续时间请求
   * @param duration 超时时间
   */
  async changeInvisibleDuration(
    endpoints: Endpoints,
    request: ChangeInvisibleDurationRequest,
    duration: number
  ) {
    const client = this.#getClient(endpoints);
    const metadata = this.#client.getRequestMetadata();
    return await client.changeInvisibleDuration(request, metadata, duration);
  }

  /**
   * 通知客户端终止。
   *
   * @param endpoints 服务端点
   * @param request 通知客户端终止请求
   * @param duration 超时时间
   */
  async notifyClientTermination(
    endpoints: Endpoints,
    request: NotifyClientTerminationRequest,
    duration: number
  ) {
    const client = this.#getClient(endpoints);
    const metadata = this.#client.getRequestMetadata();
    return await client.notifyClientTermination(request, metadata, duration);
  }
}
