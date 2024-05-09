/**
 * RocketMQ RPC会话凭证
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/30 17:57
 */
export interface SessionCredential {
  /**
   * 访问密钥（AccessKey）
   */
  accessKey: string;

  /**
   * 访问密钥（AccessSecret）
   */
  accessSecret: string;

  /**
   * 安全令牌（SecurityToken）
   */
  securityToken?: string;
}
