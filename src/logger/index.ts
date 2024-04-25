import {ILogger} from "@/interface/grpc-logger.interface";
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
        return level >= this.level;
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
        message: string,
        context?: Record<string, unknown>,
        error?: Error
    ): void {
        if (this.shouldLog(LogLevel.INFO)) {
            this.instance.info({message, context, error});
        }
    }

    public debug(
        message: string,
        context?: Record<string, unknown>,
        error?: Error
    ): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            this.instance.debug({message, context, error});
        }
    }

    public warn(
        message: string,
        context?: Record<string, unknown>,
        error?: Error
    ): void {
        if (this.shouldLog(LogLevel.WARN)) {
            this.instance.warn({message, context, error});
        }
    }

    public error(
        message: string,
        context?: Record<string, unknown>,
        error?: Error
    ): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            this.instance.error({message, context, error});
        }
    }

    public setLogger(logger: ILogger): void {
        this.instance = logger;
    }

    public getLogger(): ILogger {
        return this.instance;
    }
}
