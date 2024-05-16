import { ClientException } from './client.exception';

/**
 * 请求头字段太大异常
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:36
 */
export class RequestHeaderFieldsTooLargeException extends ClientException {
  constructor(code: number, message: string, requestId?: string) {
    super(code, message, requestId);
    this.name = 'RequestHeaderFieldsTooLargeException';
  }
}
