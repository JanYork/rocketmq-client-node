import { ChannelCredentials, Metadata } from "@grpc/grpc-js";
import { MessagingServiceClient } from "@/rpc/apache/rocketmq/v2/service_grpc_pb";
import {
  AckMessageRequest,
  AckMessageResponse,
  ChangeInvisibleDurationRequest,
  ChangeInvisibleDurationResponse,
  EndTransactionRequest,
  EndTransactionResponse,
  ForwardMessageToDeadLetterQueueRequest,
  ForwardMessageToDeadLetterQueueResponse,
  GetOffsetRequest,
  GetOffsetResponse,
  HeartbeatRequest,
  HeartbeatResponse,
  NotifyClientTerminationRequest,
  NotifyClientTerminationResponse,
  PullMessageRequest,
  PullMessageResponse,
  QueryAssignmentRequest,
  QueryAssignmentResponse,
  QueryOffsetRequest,
  QueryOffsetResponse,
  QueryRouteRequest,
  QueryRouteResponse,
  ReceiveMessageRequest,
  ReceiveMessageResponse,
  SendMessageRequest,
  SendMessageResponse,
  UpdateOffsetRequest,
  UpdateOffsetResponse,
} from "@/rpc/apache/rocketmq/v2/service_pb";
import { Endpoints } from "@/model";

/**
 * RpcClient 类封装了 RPC 通信客户端的基本操作。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/30 18:04
 */
export class RpcClient {
  /**
   * RPC 通信客户端（由RocketMQ Protobuf生成的客户端）
   * @private
   */
  private readonly client: MessagingServiceClient;

  /**
   * 最近一次活动时间
   * @private
   */
  private activityTime = Date.now();

  constructor(endpoints: Endpoints, sslEnabled: boolean) {
    const address = endpoints.getGrpcTarget();
    const grpcCredentials = sslEnabled
      ? ChannelCredentials.createSsl()
      : ChannelCredentials.createInsecure();
    this.client = new MessagingServiceClient(address, grpcCredentials);
  }

  /**
   * 获取客户端并更新最近一次活动时间。
   *
   * @private
   */
  #updateActivityTimeAndReturnClient() {
    this.activityTime = Date.now();
    return this.client;
  }

  /**
   * 获取截止时间。
   *
   * @param duration 请求最大持续时间
   * @private
   */
  #getDeadline(duration: number) {
    return Date.now() + duration;
  }

  /**
   * 获取客户端空闲时间。
   */
  idleDuration() {
    return Date.now() - this.activityTime;
  }

  /**
   * 关闭客户端。
   */
  close() {
    this.client.close();
  }

  /**
   * 查询主题路由。
   *
   * @param request  查询主题路由请求
   * @param metadata 请求元数据
   * @param duration 请求最大持续时间
   */
  async queryRoute(
    request: QueryRouteRequest,
    metadata: Metadata,
    duration: number,
  ) {
    const client = this.#updateActivityTimeAndReturnClient();
    const deadline = this.#getDeadline(duration);

    return new Promise<QueryRouteResponse>((resolve, reject) => {
      client.queryRoute(request, metadata, { deadline }, (e, res) => {
        if (e) return reject(e);
        resolve(res);
      });
    });
  }

  /**
   * 心跳。
   *
   * @param request 心跳请求
   * @param metadata 请求元数据
   * @param duration 请求最大持续时间
   */
  async heartbeat(
    request: HeartbeatRequest,
    metadata: Metadata,
    duration: number,
  ) {
    const client = this.#updateActivityTimeAndReturnClient();
    const deadline = this.#getDeadline(duration);

    return new Promise<HeartbeatResponse>((resolve, reject) => {
      client.heartbeat(request, metadata, { deadline }, (e, res) => {
        if (e) return reject(e);
        resolve(res);
      });
    });
  }

  /**
   * 发送消息。
   *
   * @param request 发送消息请求
   * @param metadata 请求元数据
   * @param duration 请求最大持续时间
   */
  async sendMessage(
    request: SendMessageRequest,
    metadata: Metadata,
    duration: number,
  ) {
    const client = this.#updateActivityTimeAndReturnClient();
    const deadline = this.#getDeadline(duration);

    return new Promise<SendMessageResponse>((resolve, reject) => {
      client.sendMessage(request, metadata, { deadline }, (e, res) => {
        if (e) return reject(e);
        resolve(res);
      });
    });
  }

  /**
   * 查询分配信息。
   *
   * @param request 查询分配信息请求
   * @param metadata 请求元数据
   * @param duration 请求最大持续时间
   */
  async queryAssignment(
    request: QueryAssignmentRequest,
    metadata: Metadata,
    duration: number,
  ) {
    const client = this.#updateActivityTimeAndReturnClient();
    const deadline = this.#getDeadline(duration);

    return new Promise<QueryAssignmentResponse>((resolve, reject) => {
      client.queryAssignment(request, metadata, { deadline }, (e, res) => {
        if (e) return reject(e);
        resolve(res);
      });
    });
  }

  /**
   * 接收消息。
   *
   * @param request 接收消息请求
   * @param metadata 请求元数据
   * @param duration 请求最大持续时间
   */
  async receiveMessage(
    request: ReceiveMessageRequest,
    metadata: Metadata,
    duration: number,
  ) {
    const client = this.#updateActivityTimeAndReturnClient();
    const deadline = this.#getDeadline(duration);

    // 通过流式 RPC 接收消息
    const readable = client.receiveMessage(request, metadata, { deadline });
    const responses: ReceiveMessageResponse[] = [];
    for await (const res of readable) {
      responses.push(res);
    }
    return responses;
  }

  /**
   * 确认消息。
   *
   * @param request 确认消息请求
   * @param metadata 请求元数据
   * @param duration 请求最大持续时间
   */
  async ackMessage(
    request: AckMessageRequest,
    metadata: Metadata,
    duration: number,
  ) {
    const client = this.#updateActivityTimeAndReturnClient();
    const deadline = this.#getDeadline(duration);

    return new Promise<AckMessageResponse>((resolve, reject) => {
      client.ackMessage(request, metadata, { deadline }, (e, res) => {
        if (e) return reject(e);
        resolve(res);
      });
    });
  }

  /**
   * 转发消息到死信队列。
   *
   * @param request 转发消息到死信队列请求
   * @param metadata 请求元数据
   * @param duration 请求最大持续时间
   */
  async forwardMessageToDeadLetterQueue(
    request: ForwardMessageToDeadLetterQueueRequest,
    metadata: Metadata,
    duration: number,
  ) {
    const client = this.#updateActivityTimeAndReturnClient();
    const deadline = this.#getDeadline(duration);

    return new Promise<ForwardMessageToDeadLetterQueueResponse>(
      (resolve, reject) => {
        client.forwardMessageToDeadLetterQueue(
          request,
          metadata,
          { deadline },
          (e, res) => {
            if (e) return reject(e);
            resolve(res);
          },
        );
      },
    );
  }

  /**
   * 拉取消息。
   *
   * @param request 拉取消息请求
   * @param metadata 请求元数据
   * @param duration 请求最大持续时间
   */
  async pullMessage(
    request: PullMessageRequest,
    metadata: Metadata,
    duration: number,
  ) {
    const client = this.#updateActivityTimeAndReturnClient();
    const deadline = this.#getDeadline(duration);

    // 通过流式 RPC 拉取消息
    const readable = client.pullMessage(request, metadata, { deadline });
    const responses: PullMessageResponse[] = [];
    for await (const res of readable) {
      responses.push(res);
    }
    return responses;
  }

  /**
   * 更新偏移量。
   *
   * @param request 更新偏移量请求
   * @param metadata 请求元数据
   * @param duration 请求最大持续时间
   */
  async updateOffset(
    request: UpdateOffsetRequest,
    metadata: Metadata,
    duration: number,
  ) {
    const client = this.#updateActivityTimeAndReturnClient();
    const deadline = this.#getDeadline(duration);

    return new Promise<UpdateOffsetResponse>((resolve, reject) => {
      client.updateOffset(request, metadata, { deadline }, (e, res) => {
        if (e) return reject(e);
        resolve(res);
      });
    });
  }

  /**
   * 获取偏移量。
   *
   * @param request 获取偏移量请求
   * @param metadata 请求元数据
   * @param duration 请求最大持续时间
   */
  async getOffset(
    request: GetOffsetRequest,
    metadata: Metadata,
    duration: number,
  ) {
    const client = this.#updateActivityTimeAndReturnClient();
    const deadline = this.#getDeadline(duration);

    return new Promise<GetOffsetResponse>((resolve, reject) => {
      client.getOffset(request, metadata, { deadline }, (e, res) => {
        if (e) return reject(e);
        resolve(res);
      });
    });
  }

  /**
   * 查询偏移量。
   *
   * @param request 查询偏移量请求
   * @param metadata 请求元数据
   * @param duration 请求最大持续时间
   */
  async queryOffset(
    request: QueryOffsetRequest,
    metadata: Metadata,
    duration: number,
  ) {
    const client = this.#updateActivityTimeAndReturnClient();
    const deadline = this.#getDeadline(duration);

    return new Promise<QueryOffsetResponse>((resolve, reject) => {
      client.queryOffset(request, metadata, { deadline }, (e, res) => {
        if (e) return reject(e);
        resolve(res);
      });
    });
  }

  /**
   * 结束事务。
   *
   * @param request 结束事务请求
   * @param metadata 请求元数据
   * @param duration 请求最大持续时间
   */
  async endTransaction(
    request: EndTransactionRequest,
    metadata: Metadata,
    duration: number,
  ) {
    const client = this.#updateActivityTimeAndReturnClient();
    const deadline = this.#getDeadline(duration);

    return new Promise<EndTransactionResponse>((resolve, reject) => {
      client.endTransaction(request, metadata, { deadline }, (e, res) => {
        if (e) return reject(e);
        resolve(res);
      });
    });
  }

  /**
   * 发送遥测数据。
   *
   * @param metadata 遥测数据
   */
  telemetry(metadata: Metadata) {
    const client = this.#updateActivityTimeAndReturnClient();
    return client.telemetry(metadata);
  }

  /**
   * 通知客户端终止。
   *
   * @param request 通知客户端终止请求
   * @param metadata 请求元数据
   * @param duration 请求最大持续时间
   */
  async notifyClientTermination(
    request: NotifyClientTerminationRequest,
    metadata: Metadata,
    duration: number,
  ) {
    const client = this.#updateActivityTimeAndReturnClient();
    const deadline = this.#getDeadline(duration);

    return new Promise<NotifyClientTerminationResponse>((resolve, reject) => {
      client.notifyClientTermination(
        request,
        metadata,
        { deadline },
        (e, res) => {
          if (e) return reject(e);
          resolve(res);
        },
      );
    });
  }

  /**
   * 修改不可见时间。
   *
   * @param request 修改不可见时间请求
   * @param metadata 请求元数据
   * @param duration 请求最大持续时间
   */
  async changeInvisibleDuration(
    request: ChangeInvisibleDurationRequest,
    metadata: Metadata,
    duration: number,
  ) {
    const client = this.#updateActivityTimeAndReturnClient();
    const deadline = this.#getDeadline(duration);

    return new Promise<ChangeInvisibleDurationResponse>((resolve, reject) => {
      client.changeInvisibleDuration(
        request,
        metadata,
        { deadline },
        (e, res) => {
          if (e) return reject(e);
          resolve(res);
        },
      );
    });
  }
}
