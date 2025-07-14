import fs from 'fs/promises';  
import IncorrectStructureError from '../error/IncorrectStructureError.js';

/**
 * Check if the app root directory contains all the required files and/or directories.
 * @param {String} appPath - Path to the app root directory.
 * @returns return true if all the required files/directories are present.
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
 * Check if the tabac-rules directory contains all the required files and/or directories.
 * @param {String} tabacPath - Path to the tabac-rules directory.
 * @returns return true if all the required files/directories are present.
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
 * Check if the modules directory contains all the modules defined in the manifest.json of the app.
 * @param {String} modulesPath - Path to the 'modules' directory path.
 * @param {String[]} manifestModulesName - List of string of all the modules name defined in the manifest.json.
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
 * Check if a given name of file or directory is inside a directory.
 * @param {Dirent[]} entries - A list of dirent.
 * @param {String} name - The name to check for.
 * @param {Boolean} isDir - define if we check about a dirname or filename.
 * @returns True if the given name exist inside the directory.
 */
export function isNameInEntries(entries, name, isDir){
    if (isDir){
        return entries.some(entry => (entry.isDirectory() && entry.name === name));
    }else{
        return entries.some(entry => (entry.isFile() && entry.name === name));
    }
}

