import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import * as dotenv from "dotenv";
dotenv.config({});

class Logger {
    /**
     * @param {string} [env=process.env.NODE_ENV] - L'environnement ("production", "development", etc.)
     * @param {string} [logFilePath='./app.log'] - Chemin du fichier de logs en production
     */
    constructor() {

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const logsDir = path.join(__dirname, '../logs');

        this.logFilePath = path.join(logsDir, 'app.log');

        fs.mkdirSync(logsDir, { recursive: true });
    }
  
    info(message, ...args) {
        this._printLog('INFO', message, ...args);
    }

    serverInfo(message, ...args){
        this._printLog('INFO', message, ...args);
    }
    
  
    warn(message, ...args) {
        this._printLog('WARN', message, ...args);
    }
  
    error(message, ...args) {
        this._printLog('ERROR', message, ...args);
    }

    serverError(message, ...args){
        this._printLog('ERROR', message, ...args);
    }
  
    /**
     * Méthode interne pour factoriser la logique d'affichage et d'écriture
     * @private
     */
    _printLog(level, message, ...args) {
        const now = new Date().toISOString();
        const logLine = `${now} [${level}] ${message}`;
    
        // Affiche dans la console
        if (process.env.NODE_ENV === 'dev') {
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

export default loggerInstance;