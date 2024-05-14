import { ClientException } from './client.exception';

/**
 * 请求过于频繁
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:37
 */
export class TooManyRequestsException extends ClientException {
  constructor(code: number, message: string, requestId?: string) {
    super(code, message, requestId);
    this.name = 'TooManyRequestsException';
  }
}
