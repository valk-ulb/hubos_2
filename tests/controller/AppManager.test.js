import AppManager from "../../src/Controller/AppManager.js";
import { test, expect, vi } from "vitest";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import App from "../../src/model/App.js";
import Module from "../../src/model/Module.js";
import Server from '../../src/model/Server.js';
import Device from '../../src/model/Device.js';
import db from "../../src/database/Database.js";
import DatabaseError from "../../src/error/DatabaseError.js";
import InconsistencyError from "../../src/error/InconsistencyError.js";
import TabacManager from "../../src/tabacManager/TabacManager.js";

const __filename = fileURLToPath(import.meta.url);
const __rootDirname = dirname(__filename);
const testFilesDir = join(__rootDirname, '../testFiles');



const expectedDevices = [new Device('myDeviceName','123e4567-e89b-12d3-a456-426614174000','Little description of the device for the user','myType'),new Device('myDeviceName2','124e4567-e89b-12d3-a456-426614174000','Little description 2 of the device for the user','myType')]
const expectedServers = [new Server('myServerName','www.example.com','Little description of the server for the user'), new Server('myServerName2','www.example2.com','Little description 2 of the server for the user')]
const expectedModules = [new Module('test1_service','service','little description'),new Module('test1','handler','little description')]


test('doesAppExist return true', async () => {
    const appsDir = join(testFilesDir, 'apps');
    const appName = "test1"
    const appPath = join(appsDir, 'appOK');
    const appManager = new AppManager(appsDir);
    const mockPool = {
        query: vi.fn().mockResolvedValue({
            rows: [{ found: true }],
        }),
    };
    db.pool = mockPool;
    const result = await appManager.doesAppExist(appName, appPath);
    
    expect(mockPool.query).toHaveBeenCalledWith(`
                SELECT EXISTS (
                    SELECT 1 FROM app
                    WHERE name = $1 AND path = $2
                ) AS "found"`,[appName,appPath]
    );

    expect(result).toBeTruthy();

})

test('doesAppExist return false', async () => {
    const appsDir = join(testFilesDir, 'apps');
    const appName = "test2"
    const appPath = join(appsDir, 'appOK');
    const appManager = new AppManager(appsDir);
    const mockPool = {
        query: vi.fn().mockResolvedValue({
            rows: [{ found: false }],
        }),
    };
    db.pool = mockPool;
    const result = await appManager.doesAppExist(appName, appPath);
    
    expect(mockPool.query).toHaveBeenCalledWith(`
                SELECT EXISTS (
                    SELECT 1 FROM app
                    WHERE name = $1 AND path = $2
                ) AS "found"`,[appName,appPath]
    );

    expect(result).toBeFalsy();

})

test('doesAppExist should throw an error if query fails', async () => {
    const appsDir = join(testFilesDir, 'apps');
    const appName = "test2"
    const appPath = join(appsDir, 'appOK');
    const appManager = new AppManager(appsDir);
    const mockPool = {
        query: vi.fn().mockRejectedValue(new DatabaseError('Error while selecting an app')),
      };
    db.pool = mockPool;
    
    expect(appManager.doesAppExist(appName, appPath)).rejects.toThrow(DatabaseError)

})

//---- getAppFromDB

test('getAppFromDB return app', async () => {
    const appsDir = join(testFilesDir, 'apps');
    const appName = "test1"
    const appPath = join(appsDir, 'appOK');
    const appManager = new AppManager(appsDir);
    const mockPool = {
        query: vi.fn()
            .mockResolvedValueOnce({
                rows: [{ id:'124e4567-e89b-12d3-a456-426614174000',name:appName,path:appPath,type:'testing',description:'Control your smart home devices with voice commands.' }],
            })
            .mockResolvedValueOnce({
                rows: [{id:'124e4567-e89b-12d3-a456-426614174001',app_id:'124e4567-e89b-12d3-a456-426614174000',name:'test1_service',type:'service',description:'little description'},{id:'124e4567-e89b-12d3-a456-426614174002',app_id:'124e4567-e89b-12d3-a456-426614174000',name:'test1',type:'handler',description:'little description'}]
            })
            .mockResolvedValueOnce({
                rows: [{id:'124e4567-e89b-12d3-a456-426614174003',app_id:'124e4567-e89b-12d3-a456-426614174000',name:'myServerName',host:'www.example.com',port:'1234',description:'Little description of the server for the user'},{id:'124e4567-e89b-12d3-a456-426614174004',app_id:'124e4567-e89b-12d3-a456-426614174000',name:'myServerName2',host:'www.example2.com',port:'1234',description:'Little description 2 of the server for the user'}]
            })
            .mockResolvedValueOnce({
                rows: [{id:'124e4567-e89b-12d3-a456-426614174005',app_id:'124e4567-e89b-12d3-a456-426614174000',name:'myDeviceName',deviceUID:'223e4567-e89b-12d3-a456-426614174005',description:'Little description of the device for the user',type:'myType'},{id:'124e4567-e89b-12d3-a456-426614174006',app_id:'124e4567-e89b-12d3-a456-426614174000',name:'myDeviceName2',deviceUID:'223e4567-e89b-12d3-a456-426614174005',description:'Little description 2 of the device for the user',type:'myType'}]
            }),
    };
    db.pool = mockPool;
    const result = await appManager.getAppFromDB(appName);
    const tempDevices = [new Device('myDeviceName','223e4567-e89b-12d3-a456-426614174005','Little description of the device for the user','myType','124e4567-e89b-12d3-a456-426614174005'),new Device('myDeviceName2','223e4567-e89b-12d3-a456-426614174005','Little description 2 of the device for the user','myType','124e4567-e89b-12d3-a456-426614174006')]
    const tempServers = [new Server('myServerName','www.example.com','Little description of the server for the user','124e4567-e89b-12d3-a456-426614174003'), new Server('myServerName2','www.example2.com','Little description 2 of the server for the user','124e4567-e89b-12d3-a456-426614174004')]
    const tempModules = [new Module('test1_service','service','little description','124e4567-e89b-12d3-a456-426614174001'),new Module('test1','handler','little description','124e4567-e89b-12d3-a456-426614174002')]

    expect(mockPool.query).toHaveBeenNthCalledWith(1,`
            SELECT id, name, path, type, description
            FROM app
            WHERE name = $1
            LIMIT 1
            `,["test1"]);
    expect(mockPool.query).toHaveBeenNthCalledWith(2,`
            SELECT id, app_id, name, type, description
            FROM module
            WHERE app_id = $1
            `,['124e4567-e89b-12d3-a456-426614174000']);
    expect(mockPool.query).toHaveBeenNthCalledWith(3,`
            SELECT id, app_id, name, host, description
            FROM appServer
            WHERE app_id = $1
            `,['124e4567-e89b-12d3-a456-426614174000']);
    expect(mockPool.query).toHaveBeenNthCalledWith(4,`
            SELECT id, app_id, name, deviceUID, description, type
            FROM appDevice
            WHERE app_id = $1
            `,['124e4567-e89b-12d3-a456-426614174000']);
    
    const expected = new App(appPath, "124e4567-e89b-12d3-a456-426614174000", appName, "Control your smart home devices with voice commands.","testing");
    expected.setManifestModules(tempModules)
    expected.configuration.setDevices(tempDevices)
    expected.configuration.setServers(tempServers)
    expect(result).toEqual(expected);

})

test('getAppFromDB return app', async () => {
    const appsDir = join(testFilesDir, 'apps');
    const appName = "test1"
    const appPath = join(appsDir, 'appOK');
    const appManager = new AppManager(appsDir);
    const mockPool = {
        query: vi.fn().mockRejectedValue(new DatabaseError('Error while selecting an app')),
    };
    db.pool = mockPool;

    expect(() => appManager.getAppFromDB("NoApp")).rejects.toThrowError(DatabaseError);
    expect(mockPool.query).toHaveBeenCalledWith(`
            SELECT id, name, path, type, description
            FROM app
            WHERE name = $1
            LIMIT 1
            `,["NoApp"]
    );
})

//------insertAppToDB

test('insertAppToDB return app', async () => {
    const appsDir = join(testFilesDir, 'apps');
    const appName = "test1"
    const appPath = join(appsDir, 'appOK');
    const appManager = new AppManager(appsDir);
    const mockClient = {
        query: vi.fn().mockResolvedValue({
            rows: [{ id:'124e4567-e89b-12d3-a456-426614174000',name:appName,path:appPath,type:'testing',description:'Control your smart home devices with voice commands.' }],
        }),
        release: vi.fn()
    };

    db.pool = {
        connect: vi.fn().mockResolvedValue(mockClient)
    };
    const app = new App(appPath, "124e4567-e89b-12d3-a456-426614174000", appName, "Control your smart home devices with voice commands.","testing");
    app.configuration.devices = expectedDevices;
    app.configuration.servers = expectedServers;
    app.manifestModules = expectedModules;

    await appManager.insertAppToDB(app);
    expect(mockClient.query).toHaveBeenNthCalledWith(1,`BEGIN`);
    expect(mockClient.query).toHaveBeenNthCalledWith(2,`
            INSERT INTO app (name, path, description, type)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `,[appName, appPath, "Control your smart home devices with voice commands.", "testing"]
    );

    expect(mockClient.query).toHaveBeenNthCalledWith(3,`
            INSERT INTO module (app_id, name, description, type)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `,["124e4567-e89b-12d3-a456-426614174000", "test1_service", "little description","service"]
    );

    expect(mockClient.query).toHaveBeenNthCalledWith(4,`
            INSERT INTO module (app_id, name, description, type)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `,["124e4567-e89b-12d3-a456-426614174000", "test1","little description", "handler"]
    );

    expect(mockClient.query).toHaveBeenNthCalledWith(5,`
            INSERT INTO appDevice (app_id, name, deviceUID, description, type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `,["124e4567-e89b-12d3-a456-426614174000", "myDeviceName","123e4567-e89b-12d3-a456-426614174000","Little description of the device for the user","myType"]
    );

    expect(mockClient.query).toHaveBeenNthCalledWith(6,`
            INSERT INTO appDevice (app_id, name, deviceUID, description, type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `,["124e4567-e89b-12d3-a456-426614174000", "myDeviceName2","124e4567-e89b-12d3-a456-426614174000","Little description 2 of the device for the user","myType"]
    );

    expect(mockClient.query).toHaveBeenNthCalledWith(7,`
            INSERT INTO appServer (app_id, name, host, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `,["124e4567-e89b-12d3-a456-426614174000", "myServerName","www.example.com","Little description of the server for the user"]
    );

    expect(mockClient.query).toHaveBeenNthCalledWith(8,`
            INSERT INTO appServer (app_id, name, host, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `,["124e4567-e89b-12d3-a456-426614174000", "myServerName2","www.example2.com","Little description 2 of the server for the user"]
    );

    expect(mockClient.query).toHaveBeenNthCalledWith(9,`COMMIT`);

    expect(mockClient.release).toHaveBeenCalled();
})

test('insertAppToDB fails', async () => {
    const appsDir = join(testFilesDir, 'apps');
    const appName = "test1"
    const appPath = join(appsDir, 'appOK');
    const appManager = new AppManager(appsDir);
    const mockClient = {
        query: vi.fn().mockRejectedValue(new DatabaseError('Error while inserting an app')),

        release: vi.fn()
    };

    db.pool = {
        connect: vi.fn().mockResolvedValue(mockClient)
    };
    const app = new App(appPath, "124e4567-e89b-12d3-a456-426614174000", appName, "Control your smart home devices with voice commands.","testing");
    app.configuration.devices = expectedDevices;
    app.configuration.servers = expectedServers;
    app.manifestModules = expectedModules;

    expect(() => appManager.insertAppToDB(app)).rejects.toThrowError(DatabaseError);
});

//--- listAppDirectories

test('listAppDirectories return list of app directories', async () => {
    const appsDir = join(testFilesDir, 'apps');
    const appManager = new AppManager(appsDir);

    const result = await appManager.listAppDirectories(appsDir);
    const dirNames = ['appMissingModule','appNoConfig','appNoManifest','appNoModulesDir','appNoResourcesDir','appNoTabac','appNoTabacDir','appOK'];
    let expected = []
    for (const dirName of dirNames){
        expected.push({'name':dirName,'path':join(appsDir,dirName)})
    }
    expect(result).toEqual(expected);
})

test('extractApp with non-existing correct app', async () => {
    const appsDir = join(testFilesDir, 'apps');
    const appName = "test1"
    const appPath = join(appsDir, 'appOK');

    const appManager = new AppManager(appsDir);
    
    const mockPool = {
        query: vi.fn()
        .mockResolvedValueOnce({ rows: [{ found: true }],}) // 1er appel
        .mockResolvedValueOnce({
            rows: [{ id:'124e4567-e89b-12d3-a456-426614174000',name:appName,path:appPath,type:'testing',description:'Control your smart home devices with voice commands.' }],
        })
        .mockResolvedValueOnce({
            rows: [{id:'124e4567-e89b-12d3-a456-426614174001',app_id:'124e4567-e89b-12d3-a456-426614174000',name:'test1_service',type:'service',description:'little description'},{id:'124e4567-e89b-12d3-a456-426614174002',app_id:'124e4567-e89b-12d3-a456-426614174000',name:'test1',type:'handler',description:'little description'}]
        })
        .mockResolvedValueOnce({
            rows: [{id:'124e4567-e89b-12d3-a456-426614174003',app_id:'124e4567-e89b-12d3-a456-426614174000',name:'myServerName',host:'www.example.com',port:'1234',description:'Little description of the server for the user'},{id:'124e4567-e89b-12d3-a456-426614174004',app_id:'124e4567-e89b-12d3-a456-426614174000',name:'myServerName2',host:'www.example2.com',port:'1234',description:'Little description 2 of the server for the user'}]
        })
        .mockResolvedValueOnce({
            rows: [{id:'124e4567-e89b-12d3-a456-426614174005',app_id:'124e4567-e89b-12d3-a456-426614174000',name:'myDeviceName',deviceUID:'223e4567-e89b-12d3-a456-426614174005',description:'Little description of the device for the user',type:'myType'},{id:'124e4567-e89b-12d3-a456-426614174006',app_id:'124e4567-e89b-12d3-a456-426614174000',name:'myDeviceName2',deviceUID:'223e4567-e89b-12d3-a456-426614174005',description:'Little description 2 of the device for the user',type:'myType'}]
        })
        .mockResolvedValueOnce({rows:[{rule_file_hash: 'b3a0c5642a7295dfcbce1c816e5eefa9'}]})
        ,
    };

    db.pool = mockPool

    const tempDevices = [new Device('myDeviceName','223e4567-e89b-12d3-a456-426614174005','Little description of the device for the user','myType','124e4567-e89b-12d3-a456-426614174005'),new Device('myDeviceName2','223e4567-e89b-12d3-a456-426614174005','Little description 2 of the device for the user','myType','124e4567-e89b-12d3-a456-426614174006')]
    const tempServers = [new Server('myServerName','www.example.com','Little description of the server for the user','124e4567-e89b-12d3-a456-426614174003'), new Server('myServerName2','www.example2.com','Little description 2 of the server for the user','124e4567-e89b-12d3-a456-426614174004')]
    const tempModules = [new Module('test1_service','service','little description','124e4567-e89b-12d3-a456-426614174001'),new Module('test1','handler','little description','124e4567-e89b-12d3-a456-426614174002')]

    
    const exceptedApp = new App(appPath, "124e4567-e89b-12d3-a456-426614174000", appName, "Control your smart home devices with voice commands.","testing");
    
    
    exceptedApp.configuration.devices = expectedDevices;
    exceptedApp.configuration.servers = expectedServers;
    exceptedApp.manifestModules = expectedModules;

    await appManager.extractApp(appName,appPath);

    expect(mockPool.query).toHaveBeenNthCalledWith(1,`
                SELECT EXISTS (
                    SELECT 1 FROM app
                    WHERE name = $1 AND path = $2
                ) AS "found"`,[appName,appPath]    );
    expect(mockPool.query).toHaveBeenNthCalledWith(2,`
            SELECT id, name, path, type, description
            FROM app
            WHERE name = $1
            LIMIT 1
            `,["test1"]);
    expect(mockPool.query).toHaveBeenNthCalledWith(3,`
            SELECT id, app_id, name, type, description
            FROM module
            WHERE app_id = $1
            `,['124e4567-e89b-12d3-a456-426614174000']);
    expect(mockPool.query).toHaveBeenNthCalledWith(4,`
            SELECT id, app_id, name, host, description
            FROM appServer
            WHERE app_id = $1
            `,['124e4567-e89b-12d3-a456-426614174000']);
    expect(mockPool.query).toHaveBeenNthCalledWith(5,`
            SELECT id, app_id, name, deviceUID, description, type
            FROM appDevice
            WHERE app_id = $1
            `,['124e4567-e89b-12d3-a456-426614174000']);
    expect(mockPool.query).toHaveBeenNthCalledWith(6,`
            SELECT rule_file_hash
            FROM app
            WHERE name = $1
            LIMIT 1
            `, [appName]);
    const expected = new App(appPath, "124e4567-e89b-12d3-a456-426614174000", appName, "Control your smart home devices with voice commands.","testing");
    expected.setManifestModules(tempModules)
    expected.configuration.setDevices(tempDevices)
    expected.configuration.setServers(tempServers)
    expected.extractTabacRules();
    expected.linkEntityReferences();
    expect(appManager.apps[0]).toStrictEqual({'name':appName,'app':expected, 'appExist':true});
})

test('delete app ', async () => {
    const appsDir = join(testFilesDir, 'apps');
    const appName = "test1"
    const appPath = join(appsDir, 'appOK');

    const appManager = new AppManager(appsDir);
    
    const mockPool = {
        query: vi.fn()
        .mockResolvedValueOnce()
    };

    db.pool = mockPool

    const tempDevices = [new Device('myDeviceName','223e4567-e89b-12d3-a456-426614174005','Little description of the device for the user','myType','124e4567-e89b-12d3-a456-426614174005'),new Device('myDeviceName2','223e4567-e89b-12d3-a456-426614174005','Little description 2 of the device for the user','myType','124e4567-e89b-12d3-a456-426614174006')]
    const tempServers = [new Server('myServerName','www.example.com','Little description of the server for the user','124e4567-e89b-12d3-a456-426614174003'), new Server('myServerName2','www.example2.com','Little description 2 of the server for the user','124e4567-e89b-12d3-a456-426614174004')]
    const tempModules = [new Module('test1_service','service','little description','124e4567-e89b-12d3-a456-426614174001'),new Module('test1','handler','little description','124e4567-e89b-12d3-a456-426614174002')]

    
    const tempApp = new App(appPath, "124e4567-e89b-12d3-a456-426614174000", appName, "Control your smart home devices with voice commands.","testing");
    
    
    tempApp.configuration.devices = expectedDevices;
    tempApp.configuration.servers = expectedServers;
    tempApp.manifestModules = expectedModules;
    appManager.apps = [{'name':'test1','app':tempApp}]
    await appManager.deleteApp(tempApp);

    expect(mockPool.query).toHaveBeenNthCalledWith(1,`
            DELETE FROM app
            WHERE id = $1;
            `,["124e4567-e89b-12d3-a456-426614174000"]);

    const expected = new App(appPath, "124e4567-e89b-12d3-a456-426614174000", appName, "Control your smart home devices with voice commands.","testing");
    expect(appManager.apps).toHaveLength(0);
})

test('delete app without been listed', async () => {
    const appsDir = join(testFilesDir, 'apps');
    const appName = "test1"
    const appPath = join(appsDir, 'appOK');

    const appManager = new AppManager(appsDir);
    
    const mockPool = {
        query: vi.fn()
        .mockResolvedValueOnce()
    };

    db.pool = mockPool

    const tempDevices = [new Device('myDeviceName','223e4567-e89b-12d3-a456-426614174005','Little description of the device for the user','myType','124e4567-e89b-12d3-a456-426614174005'),new Device('myDeviceName2','223e4567-e89b-12d3-a456-426614174005','Little description 2 of the device for the user','myType','124e4567-e89b-12d3-a456-426614174006')]
    const tempServers = [new Server('myServerName','www.example.com','Little description of the server for the user','124e4567-e89b-12d3-a456-426614174003'), new Server('myServerName2','www.example2.com','Little description 2 of the server for the user','124e4567-e89b-12d3-a456-426614174004')]
    const tempModules = [new Module('test1_service','service','little description','124e4567-e89b-12d3-a456-426614174001'),new Module('test1','handler','little description','124e4567-e89b-12d3-a456-426614174002')]

    
    const tempApp = new App(appPath, "124e4567-e89b-12d3-a456-426614174000", appName, "Control your smart home devices with voice commands.","testing");
    
    
    tempApp.configuration.devices = expectedDevices;
    tempApp.configuration.servers = expectedServers;
    tempApp.manifestModules = expectedModules;
    await expect(() => appManager.deleteApp(tempApp)).rejects.toThrowError(InconsistencyError);
})