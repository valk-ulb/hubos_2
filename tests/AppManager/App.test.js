import App from "../../src/model/App.js";
import { test, expect } from "vitest";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import Module from "../../src/model/Module.js";
import Server from '../../src/model/Server.js';
import Device from '../../src/model/Device.js';

const __filename = fileURLToPath(import.meta.url);
const __rootDirname = dirname(__filename);
const testFilesDir = join(__rootDirname, '../testFiles');

test('extractModules correct format', () => {
    const manifest = JSON.parse('{"name": "test1","description": "Control your smart home devices with voice commands.","type": "testing","modules": [{"name": "test1_service","type": "service"},{"name": "test1","type": "handler"},{"name": "test2_service","type": "service"},{"name": "test3_service","type": "service"}]}'); 
    const app = new App("");
    const expected = [new Module('test1_service','service'),new Module('test1','handler'),new Module('test2_service','service'),new Module('test3_service','service')]
    app.extractModules(manifest);
    expect(app.manifestModules).toMatchObject(expected);
})

test('extractConfiguration correct format', async () => {
    const confPath = join(testFilesDir, 'config/testExtraConfiguration.json');
    const app = new App("");
    const expectedDevices = [new Device('myDeviceName','123e4567-e89b-12d3-a456-426614174000','Little description of the device for the user','myType'),new Device('myDeviceName2','124e4567-e89b-12d3-a456-426614174000','Little description 2 of the device for the user','myType2')]
    const expectedServers = [new Server('myServerName','www.example.com','1234','Little description of the server for the user'), new Server('myServerName2','www.example2.com','1234','Little description 2 of the server for the user')]
    await app.extractConfiguration(confPath);
    expect(app.configuration.devices).toMatchObject(expectedDevices);
    expect(app.configuration.servers).toMatchObject(expectedServers);
})
