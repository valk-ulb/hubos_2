import HCore from './core/HCore.js';
import { fileURLToPath } from 'url';
import { dirname,join,resolve } from 'path';
import logger from "./utils/logger.js";

import { program } from 'commander';
import * as dotenv from "dotenv";
dotenv.config({});


const __filename = fileURLToPath(import.meta.url);
const __rootDirname = dirname(__filename);
const __databaseDir = join(__rootDirname, './database')
logger.info(`root directory = ${__rootDirname}`)


// Configure proxy
// const p = new Hproxy();
// p.configureForwardProxy();
// p.startProxy();

// App manager
const hcore = new HCore(__rootDirname);
await hcore.initMqtt();
program
    .description('reset all')
    .command('reset')
    .option('-d, --debug','Debug mode')
    .action(async (options) => {
        process.env.NODE_ENV = options.debug ? 'dev' : 'production';
        await hcore.resetAll(__databaseDir);
    });

program
    .description('HubOS start + configure')
    .command('start')
    .option('-d, --debug','Debug mode')
    .option("-r, --reset", "reset all data and run")
    .action(async (options) => {
        process.env.NODE_ENV = options.debug ? 'dev' : 'production';
        logger.info(`database directory: ${__databaseDir}`)
        if (options.reset){
            await hcore.resetAll(__databaseDir);
        }
        await hcore.run(__databaseDir);
    });

program
    .description('hubos api server')
    .command('api')
    .option('-d, --debug', 'Debug mode')
    .action(async (options) => {
        process.env.NODE_ENV = options.debug ? 'dev' : 'production';
        //logger.info('running api server')
        hcore.configureRestApi();
        hcore.configureProxy();
    })

program.parse();
