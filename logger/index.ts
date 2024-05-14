import { ILogger, LogEntry } from '../interface/grpc-logger.interface';
import LogLevel from '../enum/logger.enum';
import ConsoleLogger from './console.logger';

/**
 * 消息日志记录器
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:26
 */
export default class Logger {
  /**
   * 记录器实例
   * @private
   */
  private instance: ILogger;

  /**
   * 日志级别
   * @private
   */
  private readonly level: LogLevel;

  constructor(logger?: ILogger, level?: LogLevel) {
    this.instance = logger || new ConsoleLogger();
    this.level = level || LogLevel.INFO;
  }

  /**
   * 是否需要记录日志。
   *
   * @param level 日志级别
   * @private
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.level && level !== LogLevel.OFF;
  }

  /**
   * 创建日志记录器
   *
   * @static
   * @param logger 日志器
   * @param level 日志级别
   */
  public static create(logger: ILogger, level: LogLevel): Logger {
    return new Logger(logger, level);
  }

  public info(log: LogEntry): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.instance.info(log);
    }
  }

  public debug(log: LogEntry): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.instance.debug(log);
    }
  }

  public warn(log: LogEntry): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.instance.warn(log);
    }
  }

  public error(log: LogEntry): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.instance.error(log);
    }
  }

  public setLogger(logger: ILogger): void {
    this.instance = logger;
  }

  public getLogger(): ILogger {
    return this.instance;
  }
}
