import fs from 'fs/promises';  
import IncorrectStructureError from '../error/IncorrectStructureError.js';

/**
 * Check if the app root directory contains all the required files and directories. 
 * - <app_name>/manifest.json file, 
 * - <app_name>/config.json file, 
 * - <app_name>/tabac-rules/ dir,
 * - <app_name>/modules/ dir
 * @param {String} appPath - Absolute path to the app root directory.
 * @returns {Boolean} return true if all the required files/directories are present or throw an IncorrectStructureError otherwise.
 * @throws {IncorrectStructureError} - Throws an IncorrectStructureError if the structure is incorrect or an error occur while reading..
 */
export async function checkAppRootStructure(appPath){
    try{
        const entries = await fs.readdir(appPath, {withFileTypes: true});
        if (isNameInEntries(entries, 'manifest.json',false) && 
        isNameInEntries(entries, 'config.json',false) && 
        isNameInEntries(entries, 'tabac-rules',true) && 
        isNameInEntries(entries, 'modules',true)){
            return true;
        }else{
            throw new IncorrectStructureError('Error: the root directory structure is incorrect');
        }
    }catch(err){
        throw new IncorrectStructureError('Error: impossible to check the root directory structure', err);
    }
}

/**
 * Check if the tabac-rules directory contains all the required files
 * - <app_name>/tabac-rules/rules.json file.
 * @param {String} tabacPath - Absolute path to the tabac-rules directory.
 * @returns {Boolean} return true if all the rules.json is present, Throw an error otherwise.
 * @throws {IncorrectStructureError} - Throws an IncorrectStructureError if the structure is incorrect or an error occur while reading..
 */
export async function checkAppTabacDirStructure(tabacPath){
    try{
        const entries = await fs.readdir(tabacPath, {withFileTypes: true});
        if (isNameInEntries(entries, 'rules.json',false)){
            return true;
        }else{
            throw new IncorrectStructureError(`Error: the tabac-rules directory is incorrect : ${tabacPath}`)
        }
    }catch(err){
        throw new IncorrectStructureError(`Error: impossible to check the tabac-rules directory structure : `, err)
    }
}

/**
 * Check if the <app_name>/modules directory contains all the modules defined in the <app_name>/manifest.json of the app.
 * @param {String} modulesPath - Absolute path to the '<app_name>/modules' directory path.
 * @param {String[]} manifestModulesName - List of string of all the modules name defined in the manifest.json.
 * @returns {Boolean} true if the directory is valid, Throw an error otherwise.
 * @throws {IncorrectStructureError} - Throws an IncorrectStructureError if the structure is incorrect or an error occur while reading..
 */
export async function checkAppModulesDirStructure(modulesPath, manifestModulesName){
    try{
        const entries = await fs.readdir(modulesPath, {withFileTypes: true});
        for (let moduleName of manifestModulesName){
            if (!isNameInEntries(entries, moduleName,true)){
                throw new IncorrectStructureError(`Error: the module directory is incorrect : ${modulesPath} - look ${moduleName}`)
            }
        }
        if (manifestModulesName.length===0){
            throw new IncorrectStructureError(`Error: the module directory do not contain any module : ${modulesPath}`)
        }
        return true;
    }catch(err){
        throw new IncorrectStructureError('Error: impossible to check the modules directory structure : ', err)
    }
}

/**
 * Check if a given directory contain a file or directory with a given name.
 * @param {Dirent[]} entries - A list of dirent (object representing a directory).
 * @param {String} name - The name of the file or directory to check for.
 * @param {Boolean} isDir - define if we check about a dirname or filename.
 * @returns {Boolean} True if the given filename/dirname exist inside the directory.
 */
export function isNameInEntries(entries, name, isDir){
    if (isDir){
        return entries.some(entry => (entry.isDirectory() && entry.name === name));
    }else{
        return entries.some(entry => (entry.isFile() && entry.name === name));
    }
}

