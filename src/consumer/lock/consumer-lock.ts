/**
 * 消费锁抽象
 * @template T 解锁的钥匙
 */
export interface ILock<T> {
  /**
   * 是否已锁定
   */
  isLocked(): boolean;

  /**
   * 加锁
   */
  lock(): Promise<T>;

  /**
   * 解锁
   */
  unlock(): void;
}
