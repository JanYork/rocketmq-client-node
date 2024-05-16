"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_enum_1 = __importDefault(require("../enum/logger.enum"));
const console_logger_1 = __importDefault(require("./console.logger"));
class Logger {
    instance;
    level;
    constructor(logger, level) {
        this.instance = logger || new console_logger_1.default();
        this.level = level || logger_enum_1.default.INFO;
    }
    shouldLog(level) {
        return level >= this.level && level !== logger_enum_1.default.OFF;
    }
    static create(logger, level) {
        return new Logger(logger, level);
    }
    info(log) {
        if (this.shouldLog(logger_enum_1.default.INFO)) {
            this.instance.info(log);
        }
    }
    debug(log) {
        if (this.shouldLog(logger_enum_1.default.DEBUG)) {
            this.instance.debug(log);
        }
    }
    warn(log) {
        if (this.shouldLog(logger_enum_1.default.WARN)) {
            this.instance.warn(log);
        }
    }
    error(log) {
        if (this.shouldLog(logger_enum_1.default.ERROR)) {
            this.instance.error(log);
        }
    }
    setLogger(logger) {
        this.instance = logger;
    }
    getLogger() {
        return this.instance;
    }
}
exports.default = Logger;
