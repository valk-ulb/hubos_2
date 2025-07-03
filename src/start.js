import HCore from './core/HCore.js';
import db from './database/Database.js'
import { fileURLToPath } from 'url';
import { dirname,join,resolve } from 'path';
import logger from "./utils/logger.js";
import SandboxManager from './Controller/SandboxManager.js';
import tar from 'tar-fs'
import fs from 'fs'
import MqttAdmin from './mqtt/MqttAdmin.js'
import MqttError from './error/MqttError.js';
import MqttAlreadyExistError from './error/MqttAlreadyExistError.js'
import MqttNotFoundError from './error/MqttError.js';
import RestApiServer from './hubosAPI/RestApiServer.js'
import path from 'path';
import Hserver from './core/Hserver.js';
import {createJWT} from './utils/jwtUtil.js'
import OpenhabAPI from './openhabAPI/OpenhabAPI.js';
import Hproxy from './core/HProxy.js';
import Hproxy2 from './core/HProxy2.js';

import { program } from 'commander';
import * as dotenv from "dotenv";
dotenv.config({});


const __filename = fileURLToPath(import.meta.url);
const __rootDirname = dirname(__filename);
const __databaseDir = join(__rootDirname, './database')
logger.info(`root directory = ${__rootDirname}`)



let openhabAPI = new OpenhabAPI();

// MQTT admin connect
let mqttAdmin = new MqttAdmin();

await mqttAdmin.connect();
await mqttAdmin.subscribeToAdminTopic();

// Configure proxy
// const p = new Hproxy();
// p.configureForwardProxy();
// p.startProxy();

// App manager
const hcore = new HCore(__rootDirname);

program
    .description('reset all')
    .command('reset')
    .option('-d, --debug','Debug mode')
    .action(async (options) => {
        process.env.NODE_ENV = options.debug ? 'dev' : 'production';
        await db.setupDatabase().catch(()=>{})
        await hcore.appManager.getAllModulesUID().then(async (modulesUID) => {
            modulesUID.forEach(async (moduleUID) => {
                logger.info(`removing module with uid : ${modulesUID} from system`,true)
                // stop + remove all container
                await hcore.sandboxManagerstopAndRemoveContainer(`${moduleUID}:latest`).catch(() => {});
                await hcore.sandboxManagerremoveImage(`${moduleUID}:latest`).catch(() => {});
                await hcore.sandboxManagerstopAndRemoveContainer(`${moduleUID}`).catch(() => {});
                await hcore.sandboxManagerremoveImage(`${moduleUID}`).catch(() => {});
                // remove client mqtt
                await mqttAdmin.disableClient(moduleUID).catch(() => {});
                await mqttAdmin.deleteClient(moduleUID).catch(() => {});
                await mqttAdmin.deleteRole(`role-${moduleUID}`).catch(() => {});
            })
        })
        .catch(()=>{});
        
        // remove admin mqtt 
        await mqttAdmin.disableClient("hubosClient").catch(() => {});
        await mqttAdmin.deleteClient("hubosClient").catch(() => {});
        await mqttAdmin.deleteRole(`hubos`).catch(() => {});
        await mqttAdmin.disableClient("openhabClient").catch(() => {});
        await mqttAdmin.deleteClient("openhabClient").catch(() => {});
        await mqttAdmin.deleteRole(`openHab`).catch(() => {});

        // erase db tables
        await db.dropTables();
        await db.setupDatabase();
        await db.setupExtension();
        await db.initDB(__databaseDir);
    });

program
    .description('HubOS start + configure')
    .command('start')
    .option('-d, --debug','Debug mode')
    .action(async (options) => {
        process.env.NODE_ENV = options.debug ? 'dev' : 'production';
        logger.info(`database directory: ${__databaseDir}`)

        await db.setupDatabase().catch(()=>{})
        await db.setupExtension().catch(()=>{});
        await db.initDB(__databaseDir).catch(()=>{});

        await mqttAdmin.createSupervisorRole('hubos').catch(()=>{});
        await mqttAdmin.createSupervisorRole('openHab').catch(()=>{});
        await mqttAdmin.createClient('hubosClient','hubosClient','','hubos client',['hubos']).catch(()=>{})
        await mqttAdmin.createClient('openhabClient','openhabClient','','openHab client',['openHab']).catch(()=>{})
        const brokerThing = await openhabAPI.getBrokerThing();

        await hcore.extractApps();
        hcore.getApps().forEach(async (app) => {
            await app.manifestModules.forEach(async (module) => {
                logger.info(`mqtt configuration for module ${module.moduleId}`,true)
                await mqttAdmin.createModuleRole(module.moduleId, `role-${module.moduleId}`);
                await mqttAdmin.createClient(module.moduleId, module.moduleId, module.moduleId, `client module: ${module.moduleId}`,[`role-${module.moduleId}`]);

                logger.info(`openhab configuration for module ${module.moduleId}`,true)
                const topicItem = await openhabAPI.createTopicItem(`item_${module.moduleId}`,`item_${module.moduleId}`);
                const topicChannel = await openhabAPI.createTopicChannel(`hubos/topic-${module.moduleId}`, `item_${module.moduleId}`);
                const linkItem = await openhabAPI.linkItemToChannel(`item_${module.moduleId}`)
                
                logger.info(`sanbox creation and run for module ${module.moduleId}`,true);
                const tokens = createJWT(module.moduleId);
                const pack = await hcore.sandboxManagerbuildTarStream(join(app.appPath, module.moduleName),app.configPath, tokens)
                await hcore.sandboxManagerbuildImageWithTar(pack, module.moduleId)
                let cont = await hcore.sandboxManagercreateContainer(module.moduleId)
                hcore.sandboxManagerstartContainer(cont);
                logger.info('sanbox creation and start is a success',true)
            });
        })
    });

program
    .description("HubOS run")
    .command('run')
    .option("-d, --debug", "Debug mode")
    .option("-r, --reset", "reset all data and run")
    .action(async (options) => {
        process.env.NODE_ENV = options.debug ? 'production' : 'dev';
    });

program.parse();

/*
const appPath = join(__rootDirname, 'apps/test1/modules/test1')
const configPath = join(__rootDirname, 'apps/test1/config.json')
const viewPath = join(__rootDirname,'views');

let hserver = new Hserver(viewPath);
hserver.setupMiddelwares();
hserver.setupRoutes();
hserver.start();
*/


/*

let res = await o.getItemState('MQTT_Broker_testOfMe');
//logger.info(res)

res = await o.getBrokerThing();

res = await o.createTopicItem('myTestItem', 'myApp222');

res = await o.createTopicChannel('/test/te/t','myTestItem').catch(err => console.log(err));
console.log("linking")
res = await o.linkItemToChannel('myTestItem');
*/
/*
let a = new MqttAdmin();

await a.connect();
await a.subscribeToAdminTopic();


try{
    await a.deleteRole('hubos');
}catch(err){
    if (err === MqttAlreadyExistError || err === MqttNotFoundError){
        console.log(err)
    }
}
try{
    await a.deleteRole('openHab');
}catch(err){
    if (err === MqttAlreadyExistError || err === MqttNotFoundError){
        console.log(err)
    }
}

await a.createSupervisorRole('hubos');
await a.createSupervisorRole('openHab');
await a.createClient('hubosClient','hubosClient','','hubos client',['hubos'])
await a.createClient('openhabClient','openhabClient','','openHab client',['openHab'])

*/

/*
const p = new Hproxy();
p.configureForwardProxy();
p.startProxy();


const sm = new SandboxManager();
const tokens = createJWT();
const pack = await hcore.sandboxManagerbuildTarStream(appPath, configPath, tokens)

await hcore.sandboxManagerstopAndRemoveContainer('image-test:latest').catch(() => {})
await hcore.sandboxManagerremoveImage('image-test:latest').catch(err=>{})
await hcore.sandboxManagerstopAndRemoveContainer('image-test').catch(() => {})
await hcore.sandboxManagerremoveImage('image-test').catch(err=>{})

await hcore.sandboxManagerbuildImageWithTar(pack, 'image-test')

let cont = await hcore.sandboxManagercreateContainer('image-test')

hcore.sandboxManagerstartContainer(cont);
console.log("here")

*/

/*
const outputPath = resolve('./output.tar');
const yourTarball = fs.createWriteStream(outputPath)

pack.pipe(yourTarball)

yourTarball.on('close', function () {
  console.log(outputPath + ' has been written')
  fs.stat(outputPath, function(err, stats) {
    if (err) throw err
    console.log(stats)
    console.log('Got file info successfully!')
  })
})*/























/*
await db.setupDatabase();
await db.setupExtension();
await db.dropTables();
await db.initDB(join(__rootDirname, './database'));


let hCore = new HCore(__rootDirname);

hCore.extractApps();
*/

/*
const sandboxManager = new SandboxManager();
const appPath = join(__rootDirname, '/apps/test1');

const modulePath = `modules/test1`;
const outputPath = resolve('./output.tar');
const tarStream = tar.pack(appPath, {
    entries: [modulePath, 'config.json']
});

const output = fs.WriteStream(outputPath);
tarStream.pipe(output)
output.on('close', () => {
    console.log('✅ tar archive written to', outputPath);
  });

await sandboxManager.stopAndRemoveContainer('my-image-name-2:latest');
await sandboxManager.stopAndRemoveContainer('my-image-name-1:latest');
await sandboxManager.removeImage('my-image-name-2')
await sandboxManager.removeImage('my-image-name-1')
console.log("build")
let res = await sandboxManager.buildImageWithTar(tarStream, 'my-image-name-2');
console.log("eee")
console.log(res)
let container = await sandboxManager.createContainer('my-image-name-2');

sandboxManager.startContainer(container);
*/
/*
let a = new MqttAdmin();

await a.connect();
await a.subscribeToAdminTopic();
await a.deleteClient('test3').catch(err => {if(err !== MqttError) console.log('err')});
try{
    await a.deleteRole('role_test3');
}catch(err){
    if (err === MqttAlreadyExistError || err === MqttNotFoundError){
        console.log(err)
    }
}
try{
    await a.deleteClient('hubosClient');
}catch(err){
    if (err === MqttAlreadyExistError || err === MqttNotFoundError){
        console.log(err)
    }
}
try{
    await a.deleteClient('hubosClient');
}catch(err){
    if (err === MqttAlreadyExistError || err === MqttNotFoundError){
        console.log(err)
    }
}
try{
    await a.deleteClient('openhabClient');
}catch(err){
    if (err === MqttAlreadyExistError || err === MqttNotFoundError){
        console.log(err)
    }
}
try{
    await a.deleteRole('role_supervisor_hubos');
}catch(err){
    if (err === MqttAlreadyExistError || err === MqttNotFoundError){
        console.log(err)
    }
}
try{
    await a.deleteRole('role_supervisor_openHab');
}catch(err){
    if (err === MqttAlreadyExistError || err === MqttNotFoundError){
        console.log(err)
    }
}





let hubosRole = await a.createSupervisorRole('hubos');
let openHabRole = await a.createSupervisorRole('openHab');
await a.createClient('hubosClient','hubosClient','','hubos client',[hubosRole])
await a.createClient('openhabClient','openhabClient','','openHab client',[openHabRole])


let roleName = await a.createModuleRole('test3');

await a.createClient('test3', 'test3', 'abc123', 'petite description',[roleName]);

await a.disableClient('test3');

await a.enableClient('test3');

let res = await a.getClient('test3');
console.log(res)
console.log(res.client.roles)
await a.deleteClient('test3');

await a.deleteRole(roleName);



logger.info('ici')
//sandboxManager.runImage('my-image-name-1')
*/
