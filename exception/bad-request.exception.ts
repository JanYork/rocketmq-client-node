import { ClientException } from './client.exception';

/**
 * 错误请求异常
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:32
 */
export class BadRequestException extends ClientException {
  constructor(code: number, message: string, requestId?: string) {
    super(code, message, requestId);
    this.name = 'BadRequestException';
  }
}
