import { ClientException } from './client.exception';

/**
 * 需要付费异常
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:35
 */
export class PaymentRequiredException extends ClientException {
  constructor(code: number, message: string, requestId?: string) {
    super(code, message, requestId);
    this.name = 'PaymentRequiredException';
  }
}
