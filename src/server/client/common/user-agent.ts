import os from "node:os";
import path from "node:path";
import { readFileSync } from "node:fs";
import { UA, Language } from "@/rpc/apache/rocketmq/v2/definition_pb";

// 从 package.json 文件中读取版本号
const VERSION: string = JSON.parse(
  readFileSync(path.join(__dirname, "../../../../../package.json"), "utf-8"),
).version;

/**
 * UserAgent 类封装了用户代理信息，包括版本、平台和主机名。
 * <br/>
 * 这些信息可以用于网络通信中，以标识发送请求的客户端特性。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/4/29 下午2:28
 */
export class UserAgent {
  /**
   * UserAgent 实例的单例
   *
   * @type {UserAgent}
   * @static
   */
  static readonly INSTANCE: UserAgent = new UserAgent(
    VERSION,
    os.platform(),
    os.hostname(),
  );

  /**
   * 客户端的版本号
   */
  readonly version: string;

  /**
   * 运行客户端的操作系统平台
   */
  readonly platform: string;

  /**
   * 运行客户端的主机名
   */
  readonly hostname: string;

  /**
   * 构造一个新的 UserAgent 对象。
   *
   * @param {string} version 客户端的版本号。
   * @param {string} platform 客户端运行的操作系统平台。
   * @param {string} hostname 客户端运行的主机名。
   */
  constructor(version: string, platform: string, hostname: string) {
    this.version = version;
    this.platform = platform;
    this.hostname = hostname;
  }

  /**
   * 将 UserAgent 对象的数据转换为 Protobuf 消息格式。
   *
   * @return {UA} Protobuf 格式的 UserAgent。
   */
  toProtobuf(): UA {
    const ua = new UA();
    ua.setLanguage(Language.NODE_JS);
    ua.setVersion(this.version);
    ua.setPlatform(this.platform);
    ua.setHostname(this.hostname);
    return ua;
  }
}
