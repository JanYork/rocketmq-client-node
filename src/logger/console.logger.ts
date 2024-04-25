import {ILogger, LogEntry} from "@/interface/grpc-logger.interface";

/**
 * Console logger implementation
 *
 * @export
 * @class ConsoleLogger
 * @implements {ILogger}
 */
export default class ConsoleLogger implements ILogger {
    debug(entry: LogEntry): void {
        if (entry.context) {
            console.debug(entry.message, entry.context);
        } else {
            console.debug(entry.message);
        }
    }

    info(entry: LogEntry): void {
        console.info(entry.message, entry.context);
    }

    warn(entry: LogEntry): void {
        console.warn(entry.message, entry.context);
    }

    error(entry: LogEntry): void {
        console.error(entry.message, entry.context, entry.error);
    }
}
