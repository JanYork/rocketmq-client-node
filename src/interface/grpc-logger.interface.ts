import LogLevel from '@/enum/logger.enum';

/**
 * log entry interface
 *
 * @interface LogEntry
 * @property {string} message - log message
 * @property {Record<string, unknown>} [context] - log context
 * @property {Error} [error] - log error
 */
interface LogEntry {
    message: string;
    context?: Record<string, unknown>;
    error?: Error;
}

/**
 * logger interface
 *
 * @interface ILogger
 * @method debug - log debug message
 * @method info - log info message
 * @method warn - log warn message
 * @method error - log error message
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
 * logger config interface
 *
 * @interface LoggerConfig
 * @property {LogLevel} level - log level
 */
interface LoggerConfig {
    level: LogLevel;
}

export { LogEntry, ILogger, LoggerConfig };
