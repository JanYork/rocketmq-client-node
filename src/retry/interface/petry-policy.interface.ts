import { RetryPolicy as RetryPolicyPB } from "@/rpc/apache/rocketmq/v2/definition_pb";

/**
 * RetryPolicy 接口定义了重试策略的基本方法。
 * <br/>
 * 重试策略用于控制在消息发送失败时如何进行重试。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午3:24
 */
export interface RetryPolicy {
  /**
   * 获取最大尝试次数。
   *
   * @return 最大尝试次数
   */
  getMaxAttempts(): number;

  /**
   * 根据当前尝试次数，计算下一次尝试的延迟时间。
   *
   * @param attempt 当前的尝试次数，从1开始计数
   * @return 下次尝试前的等待时间（秒）
   */
  getNextAttemptDelay(attempt: number): number;

  /**
   * 根据提供的重试策略更新当前策略，并生成新的策略实例。
   *
   * @param retryPolicy 包含退避策略的重试策略协议对象
   * @return 新的重试策略实例
   */
  inheritBackoff(retryPolicy: RetryPolicyPB): RetryPolicy;

  /**
   * 将当前重试策略转换为协议缓冲区格式。
   *
   * @return 重试策略的协议缓冲区表示形式
   */
  toProtobuf(): RetryPolicyPB;
}
