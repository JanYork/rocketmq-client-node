import assert from 'node:assert';
import {
  CustomizedBackoff,
  RetryPolicy as RetryPolicyPB
} from '../../rpc/apache/rocketmq/v2/definition_pb';
import { Duration } from 'google-protobuf/google/protobuf/duration_pb';
import { RetryPolicy } from '../interface/petry-policy.interface';

/**
 * 自定义退避策略
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/7 下午4:24
 */
export class CustomizedBackoffPolicy implements RetryPolicy {
  /**
   * 退避时间列表
   * @private
   */
  readonly #durations: number[];

  /**
   * 最大尝试次数
   * @private
   */
  readonly #maxAttempts: number;

  constructor(durations: number[], maxAttempts: number) {
    assert(durations.length > 0, 'the durations must not be empty');
    this.#durations = durations;
    this.#maxAttempts = maxAttempts;
  }

  /**
   * 获取最大尝试次数。
   */
  getMaxAttempts(): number {
    return this.#maxAttempts;
  }

  /**
   * 获取退避时间列表。
   */
  getDurations(): number[] {
    return this.#durations;
  }

  /**
   * 获取下一次尝试的延迟时间。
   *
   * @param attempt 当前的尝试次数
   */
  getNextAttemptDelay(attempt: number): number {
    assert(attempt > 0, 'the attempt must be greater than 0');
    return attempt > this.#durations.length
      ? this.#durations[this.#durations.length - 1]
      : this.#durations[attempt - 1];
  }

  /**
   * 从协议缓冲区中解析自定义退避策略。
   *
   * @param retryPolicy 包含退避策略的重试策略协议对象
   */
  static fromProtobuf(retryPolicy: RetryPolicyPB): CustomizedBackoffPolicy {
    assert(
      retryPolicy.getStrategyCase() ===
        RetryPolicyPB.StrategyCase.CUSTOMIZED_BACKOFF,
      'strategy must be exponential backoff'
    );

    const backoff = retryPolicy.getCustomizedBackoff()!.toObject();

    const durations: number[] = backoff.nextList.map(duration => {
      return duration.seconds;
    });

    return new CustomizedBackoffPolicy(durations, retryPolicy.getMaxAttempts());
  }

  /**
   * 从现有的重试策略中继承退避参数，创建新的策略对象。
   *
   * @param retryPolicy 包含退避策略的重试策略协议对象
   */
  inheritBackoff(retryPolicy: RetryPolicyPB): RetryPolicy {
    assert(
      retryPolicy.getStrategyCase() ===
        RetryPolicyPB.StrategyCase.CUSTOMIZED_BACKOFF,
      'strategy must be exponential backoff'
    );

    const backoff = retryPolicy.getCustomizedBackoff()!.toObject();

    const durations: number[] = backoff.nextList.map(duration => {
      return duration.seconds;
    });

    return new CustomizedBackoffPolicy(durations, this.#maxAttempts);
  }

  /**
   * 将当前重试策略转换为协议缓冲区格式。
   */
  toProtobuf(): RetryPolicyPB {
    const customizedBackoff = new CustomizedBackoff();

    customizedBackoff.setNextList(
      this.#durations.map(duration => {
        const durationPB = new Duration();
        durationPB.setSeconds(duration);
        return durationPB;
      })
    );

    return new RetryPolicyPB()
      .setMaxAttempts(this.#maxAttempts)
      .setCustomizedBackoff(customizedBackoff);
  }
}
