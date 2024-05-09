import { ClientException } from '@/exception/client.exception';

/**
 * 禁止访问异常
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:33
 */
export class ForbiddenException extends ClientException {
  constructor(code: number, message: string, requestId?: string) {
    super(code, message, requestId);
    this.name = 'ForbiddenException';
  }
}
