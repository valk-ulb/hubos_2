import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import * as dotenv from "dotenv";
dotenv.config({});

/**
 * Class Logger to handle logging in the application.
 * If the application is running in development mode (NODE_ENV=dev), logs are displayed in the console and written to a log file.
 * If the application is running in production mode (NODE_ENV=production), logs are only written to a log file.
 */
class Logger {

    /**
     * Constructor of the Logger class.
     * @param {string} [env=process.env.NODE_ENV] - Environment ("production", "development", etc.)
     * @param {string} [logFilePath='./app.log'] - Path to the log file.
     */
    constructor() {

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const logsDir = path.join(__dirname, '../logs');

        this.logFilePath = path.join(logsDir, 'app.log');

        fs.mkdirSync(logsDir, { recursive: true });
    }
  
    /**
     * Logs an info message.
     * If toDisplay is True, the message will be displayed in the console (either in production or development).
     * @param {String} message - The message to log.
     * @param {Boolean} toDisplay - Whether to display the message in the console.
     * @param  {...any} args - Additional arguments to log.
     */
    info(message,toDisplay=false, ...args) {
        this._printLog('INFO', message,toDisplay, ...args);
    }

    /**
     * Logs an info message.
     * If toDisplay is True, the message will be displayed in the console (either in production or development).
     * @param {String} message - The message to log.
     * @param {Boolean} toDisplay - Whether to display the message in the console.
     * @param  {...any} args - Additional arguments to log.
     */
    serverInfo(message,toDisplay=false, ...args){
        this._printLog('SERVER INFO', message,toDisplay, ...args);
    }
    
    /**
     * Logs a warning message.
     * If toDisplay is True, the message will be displayed in the console (either in production or development).
     * @param {String} message - The message to log.
     * @param {Boolean} toDisplay - Whether to display the message in the console.
     * @param  {...any} args - Additional arguments to log.
     */
    warn(message,toDisplay, ...args) {
        this._printLog('WARN', message,toDisplay, ...args);
    }
  
    /**
     * Logs an error message.
     * If toDisplay is True, the message will be displayed in the console (either in production or development).
     * @param {String} message - The message to log.
     * @param {Boolean} toDisplay - Whether to display the message in the console.
     * @param  {...any} args - Additional arguments to log.
     */
    error(message,toDisplay, ...args) {
        this._printLog('ERROR', message,toDisplay, ...args);
    }

    /**
     * Logs a server error message.
     * If toDisplay is True, the message will be displayed in the console (either in production or development).
     * @param {String} message - The message to log.
     * @param {Boolean} toDisplay - Whether to display the message in the console.
     * @param  {...any} args - Additional arguments to log.
     */
    serverError(message,toDisplay, ...args){
        this._printLog('SERVER ERROR', message,toDisplay, ...args);
    }
  
    /**
     * private method to print log messages to console and file.
     * If toDisplay is True, the message will be displayed in the console (either in production or development).
     * The log line format is: [TIMESTAMP] [LEVEL] MESSAGE ADDITIONAL_ARGS
     * @param {String} level - The log level (e.g., INFO, WARN, ERROR). 
     * @param {String} message - The message to log.
     * @param {Boolean} toDisplay - Whether to display the message in the console.
     * @param  {...any} args - Additional arguments to log.
     */
    _printLog(level, message,toDisplay, ...args) {
        const now = new Date().toISOString();
        const logLine = `${now} [${level}] ${message}`;
    
        // Affiche dans la console
        if (process.env.NODE_ENV === 'dev' || toDisplay) {
            console.log(logLine, ...args);
        }
        // Écrit aussi dans le fichier
        const extra = args.length ? ' ' + JSON.stringify(args) : '';
        const fileLine = `${logLine}${extra}\n`;
        try {
            fs.appendFileSync(this.logFilePath, fileLine, 'utf8');
        } catch (err) {
            console.error(`Impossible d’écrire dans le fichier de log: ${err.message}`);
        }
    }
}

const loggerInstance = new Logger();

export default loggerInstance; //singleton