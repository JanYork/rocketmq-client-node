import { ILogger, LogEntry } from '../interface/grpc-logger.interface';

/**
 * 控制台日志记录器
 *
 * @export
 * @class ConsoleLogger
 * @implements {ILogger}
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:27
 */
export default class ConsoleLogger implements ILogger {
  debug(entry: LogEntry): void {
    console.log('DEBUG:', entry.message, this.formatContext(entry.context));
  }

  info(entry: LogEntry): void {
    console.info('INFO:', entry.message, this.formatContext(entry.context));
  }

  warn(entry: LogEntry): void {
    console.warn('WARN:', entry.message, this.formatContext(entry.context));
  }

  error(entry: LogEntry): void {
    console.error(
      'ERROR:',
      entry.message,
      this.formatContext(entry.context),
      entry.error
    );
    if (entry.error) {
      throw entry.error;
    }
  }

  private formatContext(context?: Record<string, unknown>): string {
    return context ? JSON.stringify(context) : '';
  }
}
