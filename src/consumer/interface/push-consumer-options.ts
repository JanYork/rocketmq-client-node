import { SimpleConsumerOptions } from "@/consumer";

/**
 * 推送消费者选项
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:58
 */
export interface PushConsumerOptions extends SimpleConsumerOptions {
  /**
   * 单次订阅获取最大消息数量
   */
  maxMessageNum?: number;

  /**
   * 是否为 FIFO 模式
   */
  isFifo?: boolean;
}
