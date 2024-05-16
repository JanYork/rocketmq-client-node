import { BaseClientOption } from '../../client';
import { ITransactionChecker } from './transaction-checker';

export interface ProducerOptions extends BaseClientOption {
  /**
   * 主题
   */
  topic?: string | string[];

  /**
   * 最大尝试次数
   */
  maxAttempts?: number;

  /**
   * 事务检查器
   */
  checker?: ITransactionChecker;
}
