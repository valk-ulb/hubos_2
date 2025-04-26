import {checkAppRootStructure, checkAppModulesDirStructure, checkAppTabacDirStructure, isNameInEntries} from "../../src/utils/StructuralChecker.js";
import { test, expect } from "vitest";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import IncorrectStructureError from "../../src/error/IncorrectStructureError.js";
import { Dirent } from "fs";
const __filename = fileURLToPath(import.meta.url);
const __rootDirname = dirname(__filename);
const testFilesDir = join(__rootDirname, '../testFiles');

//----- CheckAppRootStructure
test('checkAppRootStructure correct structure', () => {
    const confPath = join(testFilesDir, 'apps/appOK');
    expect(() => checkAppRootStructure(confPath)).not.toThrowError(IncorrectStructureError);
})

test('checkAppRootStructure no manifest file', async () => {
    const confPath = join(testFilesDir, 'apps/appNoManifest');
    await expect(() => checkAppRootStructure(confPath)).rejects.toThrowError(IncorrectStructureError);
})

test('checkAppRootStructure no config file', async () => {
    const confPath = join(testFilesDir, 'apps/appNoConfig');
    await expect(() => checkAppRootStructure(confPath)).rejects.toThrowError(IncorrectStructureError);
})

test('checkAppRootStructure no tabac file', async () => {
    const confPath = join(testFilesDir, 'apps/appNoTabac');
    expect(checkAppRootStructure(confPath)).toBeTruthy();
})

test('checkAppRootStructure no tabac dir', async () => {
    const confPath = join(testFilesDir, 'apps/appNoTabacDir');
    await expect(() => checkAppRootStructure(confPath)).rejects.toThrowError(IncorrectStructureError);
})

test('checkAppRootStructure no ressources dir', async () => {
    const confPath = join(testFilesDir, 'apps/appNoResourcesDir');
    expect(checkAppRootStructure(confPath)).toBeTruthy();
})

test('checkAppRootStructure no modules dir', async () => {
    const confPath = join(testFilesDir, 'apps/appNoModulesDir');
    await expect(() => checkAppRootStructure(confPath)).rejects.toThrowError(IncorrectStructureError);
})

//----------CheckAppTabacDirStructure

test('checkAppTabacDirStructure with tabac file', () => {
    const confPath = join(testFilesDir, 'apps/appOK/tabac-rules');
    expect(checkAppTabacDirStructure(confPath)).toBeTruthy();
})

test('checkAppTabacDirStructure no tabac file', () => {
    const confPath = join(testFilesDir, 'apps/appNoTabac/tabac-rules');
    expect(() => checkAppTabacDirStructure(confPath)).rejects.toThrowError(IncorrectStructureError);
})

//------------CheckAppModulesDirStructure

test('checkAppModulesDirStructure with existing modules names and module directory', () => {
    const confPath = join(testFilesDir, 'apps/appOK/modules');
    const modulesNames = ['test1', 'test1_service'];
    expect(checkAppModulesDirStructure(confPath, modulesNames)).toBeTruthy();
})

test('checkAppModulesDirStructure with existing modules names and unexisting module directory', () => {
    const confPath = join(testFilesDir, 'apps/appOK/modules');
    const modulesNames = ['test1'];
    expect(checkAppModulesDirStructure(confPath, modulesNames)).toBeTruthy();
})

test('checkAppModulesDirStructure with missing module directory', async () => {
    const confPath = join(testFilesDir, 'apps/appMissingModule/modules');
    const modulesNames = ['test1', 'test1_service'];
    await expect(() => checkAppModulesDirStructure(confPath, modulesNames)).rejects.toThrowError(IncorrectStructureError);
})

test('checkAppModulesDirStructure no modulesName', async () => {
    const confPath = join(testFilesDir, 'apps/appMissingModule/modules');
    const modulesNames = [];
    await expect(() => checkAppModulesDirStructure(confPath, modulesNames)).rejects.toThrowError(IncorrectStructureError);
})


//---------------- IsNameInEntries

const entries = [
    new Dirent('config.json', 1), // 1 pour fichier
    new Dirent('manifest.json', 1), // 1 pour fichier
    new Dirent('modules', 2), // 2 pour répertoire
    new Dirent('resources', 2), // 2 pour répertoire
    new Dirent('tabac-rules', 2), // 2 pour répertoire
];

test('isNameInEntries with existing file', () => {
    
    expect(isNameInEntries(entries, 'config.json', false)).toBeTruthy();
    expect(isNameInEntries(entries, 'manifest.json', false)).toBeTruthy();
})

test('isNameInEntries with existing directory', () => {
    
    expect(isNameInEntries(entries, 'modules', true)).toBeTruthy();
    expect(isNameInEntries(entries, 'resources', true)).toBeTruthy();
    expect(isNameInEntries(entries, 'tabac-rules', true)).toBeTruthy();
})

test('isNameInEntries with existing file as directory', () => {
    
    expect(isNameInEntries(entries, 'config.json', true)).toBeFalsy();
    expect(isNameInEntries(entries, 'manifest.json', true)).toBeFalsy();
})

test('isNameInEntries with existing directory as file', () => {
    
    expect(isNameInEntries(entries, 'modules', false)).toBeFalsy();
    expect(isNameInEntries(entries, 'resources', false)).toBeFalsy();
    expect(isNameInEntries(entries, 'tabac-rules', false)).toBeFalsy();
})

test('isNameInEntries with unexisting directory', () => {
    
    expect(isNameInEntries(entries, 'Nomodules', true)).toBeFalsy();
    expect(isNameInEntries(entries, 'Noresources', true)).toBeFalsy();
    expect(isNameInEntries(entries, 'Notabac-rules', true)).toBeFalsy();
})

test('isNameInEntries with unexisting file', () => {
    
    expect(isNameInEntries(entries, 'Noconfig.json', false)).toBeFalsy();
    expect(isNameInEntries(entries, 'Nomanifest.json', false)).toBeFalsy();
})