import { ClientException } from '@/exception/client.exception';

/**
 * 不支持的操作
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:38
 */
export class UnsupportedException extends ClientException {
  constructor(code: number, message: string, requestId?: string) {
    super(code, message, requestId);
    this.name = 'UnsupportedException';
  }
}
