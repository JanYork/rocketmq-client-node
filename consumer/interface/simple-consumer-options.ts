import { ConsumerOptions } from './consumer-options';
import { FilterExpression } from '../filter-expression';

/**
 * 简单消费者选项。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:58
 */
export interface SimpleConsumerOptions extends ConsumerOptions {
  /**
   * 支持标签字符串作为过滤器，例如：
   *
   * @example
   * ```ts
   * new Map()
   *  .set('TestTopic1', 'TestTag1')
   *  .set('TestTopic2', 'TestTag2')
   * ```
   */
  subscriptions: Map<string, FilterExpression | string>;

  /**
   * 设置长轮询的等待时长，默认为30000ms
   */
  awaitDuration?: number;
}
