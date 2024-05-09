import { ClientException } from '@/exception/client.exception';

/**
 * 未授权
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:38
 */
export class UnauthorizedException extends ClientException {
  constructor(code: number, message: string, requestId?: string) {
    super(code, message, requestId);
    this.name = 'UnauthorizedException';
  }
}
