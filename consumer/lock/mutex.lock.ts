import { Mutex, MutexInterface } from 'async-mutex';
import { ILock } from './consumer-lock';

/**
 * 互斥锁
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/10 下午7:55
 */
export class MutexLock implements ILock<MutexInterface.Releaser> {
  /**
   * 锁
   * @private
   */
  readonly #lock = new Mutex();

  /**
   * 是否已锁定
   */
  isLocked(): boolean {
    return this.#lock.isLocked();
  }

  /**
   * 加锁
   */
  lock() {
    return this.#lock.acquire();
  }

  /**
   * 解锁
   */
  unlock() {
    this.#lock.release();
  }
}
