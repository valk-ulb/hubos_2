import App from "../../src/model/App.js";
import { test, expect } from "vitest";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __rootDirname = dirname(__filename);
const testFilesDir = join(__rootDirname, '../testFiles');

test('checkConfigurationFileStructure correct format', () => {
    const confPath = join(testFilesDir, 'config/configCorrect.json');
    const app = new App("");
    expect(() => app.checkConfigurationFileStructure(confPath)).not.toThrowError();
})

test('checkConfigurationFileStructure with empty string for device and server', () => {
    const confPath = join(testFilesDir, 'config/configCorrect.json');
    const app = new App("");
    expect(() => app.checkConfigurationFileStructure(confPath)).not.toThrowError();
})

test('checkConfigurationFileStructure correct format - configuration', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectConfiguration.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format - device/description', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectDeviceDescription.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format value - device/description', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectDeviceDescriptionValue.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format - device/name', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectDeviceName.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format - devices', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectDevices.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format - device/type', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectDeviceType.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format value - device/type', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectDeviceTypeValue.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format - device/uid', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectDeviceUID.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format value - device/uid', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectDeviceUIDValue.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format - server/description', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectServerDescription.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format value - server/description', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectServerDescriptionValue.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format - server/host', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectServerHost.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format value - server/host', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectServerHostValue.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format - server/name', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectServerName.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format - server/port', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectServerPort.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format value - server/port', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectServerPortValue.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})

test('checkConfigurationFileStructure correct format - servers', async () => {
    const confPath = join(testFilesDir, 'config/configCorrectServers.json');
    const app = new App("");
    await expect(app.checkConfigurationFileStructure(confPath)).rejects.toThrowError();
})