const REQUEST_ID_KEY = "request-id";
const RESPONSE_CODE_KEY = "response-code";

/**
 * 客户端异常
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:32
 */
export class ClientException extends Error {
  /**
   * 响应状态码
   */
  code: number;

  constructor(code: number, message: string, requestId?: string) {
    super(
      `[${REQUEST_ID_KEY}=${requestId}, ${RESPONSE_CODE_KEY}=${code}] ${message}`,
    );
    this.code = code;
    this.name = "ClientException";
  }
}
