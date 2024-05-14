import { MessageView } from '../../message';
import { MessageResult } from '../../enum';

/**
 * 消息监听器。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/7 下午5:26
 */
export interface MessageListener {
  /**
   * 消息监听
   * @param message 消息
   */
  onMessage(message: MessageView): Promise<MessageResult>;

  /**
   * 消息开始监听
   */
  onStart?(): void;

  /**
   * 消息监听结束
   */
  onStop?(): void;

  /**
   * 消息监听异常
   */
  onError?(error: Error): void;
}
