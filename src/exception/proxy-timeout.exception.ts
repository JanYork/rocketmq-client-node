import { ClientException } from '@/exception/client.exception';

/**
 * 代理超时异常
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:35
 */
export class ProxyTimeoutException extends ClientException {
  constructor(code: number, message: string, requestId?: string) {
    super(code, message, requestId);
    this.name = 'ProxyTimeoutException';
  }
}
