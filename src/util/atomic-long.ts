export class AtomicLong {
  /**
   * 共享内存
   * @private
   */
  private readonly buffer: SharedArrayBuffer;

  /**
   * 视图
   * @private
   */
  private readonly view: BigInt64Array;

  constructor(initialValue: bigint) {
    // 使用 SharedArrayBuffer 分配共享内存
    this.buffer = new SharedArrayBuffer(8); // 8 bytes for a 64-bit integer
    // 创建一个 BigInt64Array，视图链接到共享内存
    this.view = new BigInt64Array(this.buffer);
    // 初始值写入共享内存
    Atomics.store(this.view, 0, initialValue);
  }

  get value(): bigint {
    // 从共享内存读取值
    return Atomics.load(this.view, 0);
  }

  set value(newValue: bigint) {
    // 将新值写入共享内存
    Atomics.store(this.view, 0, newValue);
  }

  incrementAndGet(): bigint {
    // 使用 Atomics.add 来原子性地增加值并返回新值
    return Atomics.add(this.view, 0, BigInt(1)) + BigInt(1);
  }

  decrementAndGet(): bigint {
    // 使用 Atomics.sub 来原子性地减少值并返回新值
    return Atomics.sub(this.view, 0, BigInt(1)) - BigInt(1);
  }

  getAndIncrement(): bigint {
    // 使用 Atomics.add 来原子性地增加值并返回旧值
    return Atomics.add(this.view, 0, BigInt(1));
  }
}
