import { TransactionResolution } from '../../rpc/apache/rocketmq/v2/definition_pb';
import { MessageView } from '../../message';

/**
 * 本接口定义了检查事务消息的接口。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/29 下午5:28
 */
export interface ITransactionChecker {
  /**
   * 检查事务消息。
   *
   * @param messageView 消息视图
   */
  check(messageView: MessageView): Promise<TransactionResolution>;
}
