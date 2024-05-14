import { hostname } from "node:os";

/**
 * ClientFlagHelper 类封装了客户端 ID 的生成逻辑。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/30 18:00
 */
export class ClientFlagHelper {
  /**
   * 当前主机名
   * @private
   */
  private static hostname = hostname();

  /**
   * 客户端 ID 的索引
   * @private
   */
  private static index = 0n;

  /**
   * 创建一个新的客户端 ID。
   *
   * @return {string} 新的客户端 ID。
   */
  static create(): string {
    return `${this.hostname}@${process.pid}@${this.index++}@${Date.now().toString(36)}`;
  }
}
