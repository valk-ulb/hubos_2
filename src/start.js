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

const __filename = fileURLToPath(import.meta.url);
const __rootDirname = dirname(__filename);
logger.info(`root directory = ${__rootDirname}`)



const appPath = join(__rootDirname, 'apps/test1/modules/test1')
const configPath = join(__rootDirname, 'apps/test1/config.json')
const viewPath = join(__rootDirname,'views');

let hserver = new Hserver(viewPath);
hserver.setupMiddelwares();
hserver.setupRoutes();
hserver.start();

let o = new OpenhabAPI();

let res = await o.getItemState('MQTT_Broker_testOfMe');
//logger.info(res)

res = await o.getBrokerThing();

res = await o.createTopicItem('myTestItem', 'myApp222');

res = await o.createTopicChannel('/test/te/t','myTestItem').catch(err => console.log(err));
console.log("linking")
res = await o.linkItemToChannel('myTestItem');

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
const sm = new SandboxManager();
const tokens = createJWT();
const pack = await sm.buildTarStream(appPath, configPath, tokens)

await sm.stopAndRemoveContainer('image-test:latest').catch(err =>{})
await sm.removeImage('image-test:latest').catch(err=>{})
await sm.stopAndRemoveContainer('image-test').catch(err =>{})
await sm.removeImage('image-test').catch(err=>{})

await sm.buildImageWithTar(pack, 'image-test')

let cont = await sm.createContainer('image-test')

sm.startContainer(cont);


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
