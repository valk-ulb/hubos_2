import App from "../../src/model/App.js";
import { test, expect } from "vitest";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import IncorrectJsonStructureError from "../../src/error/IncorrectJsonStructureError.js";
import { rejects } from "assert";

const __filename = fileURLToPath(import.meta.url);
const __rootDirname = dirname(__filename);
const testFilesDir = join(__rootDirname, '../testFiles');

test('checkManifestFileStructure correct format', () => {
    const confPath = join(testFilesDir, 'manifest/manifestCorrect.json');
    const app = new App("");
    expect(() => app.checkManifestFileStructure(confPath, 'test1')).not.toThrowError();
})

test('checkManifestFileStructure correct format but unmatching appDirName', async () => {
    const confPath = join(testFilesDir, 'manifest/manifestCorrect.json');
    const app = new App("");
    await expect(() => app.checkManifestFileStructure(confPath, 'test2')).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkManifestFileStructure incorrect format - name', async () => {
    const confPath = join(testFilesDir, 'manifest/manifestCorrectName.json');
    const app = new App("");
    await expect(app.checkManifestFileStructure(confPath,'test1'))
      .rejects
      .toThrowError(IncorrectJsonStructureError);
})

test('checkManifestFileStructure incorrect format - description', async () => {
    const confPath = join(testFilesDir, 'manifest/manifestCorrectDescription.json');
    const app = new App("");
    await expect(() => app.checkManifestFileStructure(confPath,'test1')).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkManifestFileStructure incorrect format - type', async () => {
    const confPath = join(testFilesDir, 'manifest/manifestCorrectType.json');
    const app = new App("");
    await expect(() => app.checkManifestFileStructure(confPath,'test1')).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkManifestFileStructure incorrect format - modules', async () => {
    const confPath = join(testFilesDir, 'manifest/manifestCorrectModules.json');
    const app = new App("");
    await expect(() => app.checkManifestFileStructure(confPath,'test1')).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkManifestFileStructure incorrect format - module/name', async () => {
    const confPath = join(testFilesDir, 'manifest/manifestCorrectModuleName.json');
    const app = new App("");
    await expect(() => app.checkManifestFileStructure(confPath,'test1')).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkManifestFileStructure incorrect format - module/type', async () => {
    const confPath = join(testFilesDir, 'manifest/manifestCorrectModuleType.json');
    const app = new App("");
    await expect(() => app.checkManifestFileStructure(confPath,'test1')).rejects.toThrowError(IncorrectJsonStructureError);
})

//------

test('checkManifestFileStructure incorrect format value - name', async () => {
    const confPath = join(testFilesDir, 'manifest/manifestCorrectNameValue.json');
    const app = new App("");
    await expect(() => app.checkManifestFileStructure(confPath,'test1@"')).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkManifestFileStructure incorrect format value - description', async () => {
    const confPath = join(testFilesDir, 'manifest/manifestCorrectDescriptionValue.json');
    const app = new App("");
    await expect(() => app.checkManifestFileStructure(confPath,'test1')).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkManifestFileStructure incorrect format value - type', async () => {
    const confPath = join(testFilesDir, 'manifest/manifestCorrectTypeValue.json');
    const app = new App("");
    await expect(() => app.checkManifestFileStructure(confPath,'test1')).rejects.toThrowError(IncorrectJsonStructureError);
})


test('checkManifestFileStructure incorrect format value - module/name', async () => {
    const confPath = join(testFilesDir, 'manifest/manifestCorrectModuleNameValue.json');
    const app = new App("");
    await expect(() => app.checkManifestFileStructure(confPath,'test1')).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkManifestFileStructure incorrect format value - module/type', async () => {
    const confPath = join(testFilesDir, 'manifest/manifestCorrectModuleTypeValue.json');
    const app = new App("");
    await expect(() => app.checkManifestFileStructure(confPath,'test1')).rejects.toThrowError(IncorrectJsonStructureError);
})
