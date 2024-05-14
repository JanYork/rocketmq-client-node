import assert from 'node:assert';
import { Duration } from 'google-protobuf/google/protobuf/duration_pb';
import {
  ExponentialBackoff,
  RetryPolicy as RetryPolicyPB
} from '../../rpc/apache/rocketmq/v2/definition_pb';
import { RetryPolicy } from '../interface/petry-policy.interface';

/**
 * 本类实现了基于指数退避的重试策略。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午3:23
 */
export class ExponentialBackoffRetryPolicy implements RetryPolicy {
  /**
   * 最大重试次数
   * @private
   */
  private readonly maxAttempts: number;

  /**
   * 初始等待时间，单位为秒
   * @private
   */
  private readonly initialBackoff: number;

  /**
   * 最大等待时间，单位为秒
   * @private
   */
  private readonly maxBackoff: number;

  /**
   * 退避时间增长的倍数
   *
   * @private
   */
  private readonly backoffMultiplier: number;

  /**
   * 构造函数初始化重试策略的各项参数。
   *
   * @param maxAttempts 最大重试次数
   * @param initialBackoff 初始等待时间（秒）
   * @param maxBackoff 最大等待时间（秒）
   * @param backoffMultiplier 退避时间增长的倍数
   */
  constructor(
    maxAttempts: number,
    initialBackoff = 0,
    maxBackoff = 0,
    backoffMultiplier = 1
  ) {
    this.maxAttempts = maxAttempts;
    this.initialBackoff = initialBackoff;
    this.maxBackoff = maxBackoff;
    this.backoffMultiplier = backoffMultiplier;
  }

  /**
   * 创建一个立即重试的策略，没有退避延迟。
   *
   * @param maxAttempts 最大重试次数
   * @return 重试策略对象
   */
  static immediatelyRetryPolicy(maxAttempts: number) {
    return new ExponentialBackoffRetryPolicy(maxAttempts, 0, 0, 1);
  }

  /**
   * 从协议缓冲区对象中解析出重试策略。
   *
   * @param retryPolicy 包含重试策略的协议缓冲区对象
   */
  static fromProtobuf(
    retryPolicy: RetryPolicyPB
  ): ExponentialBackoffRetryPolicy {
    if (
      retryPolicy.getStrategyCase() !==
      RetryPolicyPB.StrategyCase.EXPONENTIAL_BACKOFF
    ) {
      throw new Error('strategy must be exponential backoff');
    }

    const backoff = retryPolicy.getExponentialBackoff()!.toObject();

    return new ExponentialBackoffRetryPolicy(
      retryPolicy.getMaxAttempts(),
      backoff.initial?.seconds,
      backoff.max?.seconds,
      backoff.multiplier
    );
  }

  /**
   * 获取最大尝试次数。
   *
   * @return 最大尝试次数
   */
  getMaxAttempts(): number {
    return this.maxAttempts;
  }

  /**
   * 计算给定尝试次数后的下一次重试延迟。
   *
   * @param attempt 当前的尝试次数，从1开始计数
   * @return 下次尝试前的等待时间（秒）
   */
  getNextAttemptDelay(attempt: number): number {
    assert(attempt > 0, 'try count must be positive');
    // 计算延迟时间
    const delay = Math.min(
      this.initialBackoff * Math.pow(this.backoffMultiplier, attempt - 1),
      this.maxBackoff
    );
    return Math.max(delay, 0); // 确保不返回负数
  }

  /**
   * 从现有的重试策略中继承退避参数，创建新的策略对象。
   *
   * @param retryPolicy 包含退避策略的重试策略协议对象
   * @return 新的重试策略实例
   */
  inheritBackoff(retryPolicy: RetryPolicyPB): RetryPolicy {
    assert(
      retryPolicy.getStrategyCase() ===
        RetryPolicyPB.StrategyCase.EXPONENTIAL_BACKOFF,
      'strategy must be exponential backoff'
    );
    const backoff = retryPolicy.getExponentialBackoff()!.toObject();
    return new ExponentialBackoffRetryPolicy(
      this.maxAttempts,
      backoff.initial?.seconds,
      backoff.max?.seconds,
      backoff.multiplier
    );
  }

  /**
   * 将重试策略对象转换为协议缓冲区格式。
   *
   * @return 重试策略的协议缓冲区表示形式
   */
  toProtobuf(): RetryPolicyPB {
    const expBackoff = new ExponentialBackoff()
      .setInitial(new Duration().setSeconds(this.initialBackoff))
      .setMax(new Duration().setSeconds(this.maxBackoff))
      .setMultiplier(this.backoffMultiplier);

    return new RetryPolicyPB()
      .setMaxAttempts(this.maxAttempts)
      .setExponentialBackoff(expBackoff);
  }
}
