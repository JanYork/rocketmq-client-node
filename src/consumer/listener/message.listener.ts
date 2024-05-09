import { MessageView } from "@/message";
import { MessageResult } from "@/enum/message.enum";

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
  onMessage(message: MessageView): MessageResult;
}
