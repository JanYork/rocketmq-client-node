import { ConsumerOptions, FilterExpression } from '@/consumer';
import { MessageListener } from '@/consumer/listener/message.listener';
import { ILock } from '@/consumer/lock/consumer-lock';
import Logger from '@/logger';

/**
 * 推送消费者选项
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:58
 */
export interface PushConsumerOptions extends ConsumerOptions {
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
   * 监听器
   */
  listener: MessageListener;

  /**
   * 设置长轮询的等待时长，默认为30000ms
   */
  awaitDuration?: number;

  /**
   * 单次订阅获取最大消息数量
   */
  maxMessageNum?: number;

  /**
   * 是否为 FIFO 模式
   */
  isFifo?: boolean;

  /**
   * 长轮询时间间隔
   */
  longPollingInterval?: number;

  /**
   * 同步锁
   */
  locker?: ILock<unknown>;

  /**
   * 日志记录器
   */
  logger?: Logger;
}
