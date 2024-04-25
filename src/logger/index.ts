import {ILogger, LogEntry} from "@/interface/grpc-logger.interface";
import ConsoleLogger from "./console.logger";
import LogLevel from "@/enum/logger.enum";

/**
 * Logger class, used to log messages
 *
 * @export
 * @class Logger
 * @method info - log info message
 * @method debug - log debug message
 * @method warn - log warn message
 * @method error - log error message
 * @method setLogger - set logger
 * @method getLogger - get logger
 */
export default class Logger {
    /**
     * Logger instance
     * @private
     */
    private instance: ILogger;

    /**
     * Logger level
     * @private
     */
    private readonly level: LogLevel;

    private constructor(logger?: ILogger, level?: LogLevel) {
        this.instance = logger || new ConsoleLogger();
        this.level = level || LogLevel.INFO;
    }

    /**
     * Check if the log level is enabled
     *
     * @param level - log level
     * @private
     */
    private shouldLog(level: LogLevel): boolean {
        return level >= this.level && level !== LogLevel.OFF;
    }

    /**
     * Create a logger instance
     *
     * @static
     * @param logger 日志器
     * @param level 日志级别
     */
    public static create(logger: ILogger, level: LogLevel): Logger {
        return new Logger(logger, level);
    }

    public info(
        log: LogEntry
    ): void {
        if (this.shouldLog(LogLevel.INFO)) {
            this.instance.info(log);
        }
    }

    public debug(
        log: LogEntry
    ): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            this.instance.debug(log);
        }
    }

    public warn(
        log: LogEntry
    ): void {
        if (this.shouldLog(LogLevel.WARN)) {
            this.instance.warn(log);
        }
    }

    public error(
        log: LogEntry
    ): void {
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
