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
await hcore.configureProxy();
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
