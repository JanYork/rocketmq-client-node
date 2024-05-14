import LogLevel from '../enum/logger.enum';

/**
 * 日志条目
 *
 * @interface LogEntry
 * @property {string} message - log message
 * @property {Record<string, unknown>} [context] - log context
 * @property {Error} [error] - log error
 */
interface LogEntry {
  /**
   * 日志消息
   */
  message: string;

  /**
   * 日志上下文
   */
  context?: Record<string, unknown>;

  /**
   * 日志错误
   */
  error?: Error;
}

/**
 * 日志记录器接口
 *
 * @interface ILogger
 */
interface ILogger {
  /**
   * log debug message
   * @param entry - log entry
   */
  debug(entry: LogEntry): void;

  /**
   * log info message
   * @param entry
   */
  info(entry: LogEntry): void;

  /**
   * log warn message
   * @param entry
   */
  warn(entry: LogEntry): void;

  /**
   * log error message
   * @param entry
   */
  error(entry: LogEntry): void;
}

/**
 * 日志配置
 *
 * @interface LoggerConfig
 * @property {LogLevel} level - log level
 */
interface LoggerConfig {
  level: LogLevel;
}

export { LogEntry, ILogger, LoggerConfig };
