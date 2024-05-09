import { BaseClientOption } from "@/server/client";

/**
 * 消费者选项。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:57
 */
export interface ConsumerOptions extends BaseClientOption {
  /**
   * 消费组
   */
  consumerGroup: string;
}
