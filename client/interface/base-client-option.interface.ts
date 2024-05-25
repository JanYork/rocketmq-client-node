import { ISessionCredential } from './session-credential.interface';
import { Logger } from '../../logger';

/**
 * RocketMQ 客户端基本配置参数
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/2 20:32
 */
export interface BaseClientOption {
  /**
   * 是否启用 SSL
   */
  sslEnabled?: boolean;

  /**
   * RocketMQ 端点地址
   *
   * @example
   * - 127.0.0.1:8081;127.0.0.1:8082
   * - 127.0.0.1:8081
   * - example.com
   * - example.com:8443
   */
  endpoints: string;

  /**
   * 命名空间
   */
  namespace?: string;

  /**
   * 会话凭证，如果启用了 SSL，必须提供会话凭证
   */
  sessionCredential?: ISessionCredential;

  /**
   * 请求超时时间，单位：毫秒z
   */
  requestTimeout?: number;

  /**
   * 日志记录器
   */
  logger?: Logger;

  /**
   * 主题列表
   */
  topics?: string[];
}
