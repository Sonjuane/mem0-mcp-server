/**
 * Simple logger utility for the Mem0 MCP Server
 */

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

class Logger {
    constructor() {
        this.level = process.env.DEBUG === 'true' ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
    }

    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length > 0 ? ' ' + args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') : '';

        return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
    }

    error(message, ...args) {
        if (this.level >= LOG_LEVELS.ERROR) {
            console.error(this.formatMessage('ERROR', message, ...args));
        }
    }

    warn(message, ...args) {
        if (this.level >= LOG_LEVELS.WARN) {
            console.warn(this.formatMessage('WARN', message, ...args));
        }
    }

    info(message, ...args) {
        if (this.level >= LOG_LEVELS.INFO) {
            console.log(this.formatMessage('INFO', message, ...args));
        }
    }

    debug(message, ...args) {
        if (this.level >= LOG_LEVELS.DEBUG) {
            console.log(this.formatMessage('DEBUG', message, ...args));
        }
    }
}

export const logger = new Logger();