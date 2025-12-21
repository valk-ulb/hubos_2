import fs from "node:fs" 
import crypto from "crypto"

/**
 * Function to generate the MD5 hash of a file.
 * Read the content of a file and generate a MD5 hash from it.
 * @param {String} filePath - Path to the file to hash.
 * @returns {String} The MD5 digest of the file.
 * @throws {Error} - Throws an error if the file does not exist, is a directory, or is not readable.
 */
export async function signFileMD5(filePath){

    if (!fs.existsSync(filePath)) throw new Error (`Specified file ${filePath} does not exist.`);
    if (fs.statSync(filePath).isDirectory()) throw new Error(`${filePath} is a directory, not a file.`);
    try{
        fs.accessSync(filePath, fs.constants.R_OK);
    }catch(err){
        throw new Error(`${filePath} is not readable`);
    }
    
    const hash = crypto.createHash('md5');
    const rStream = fs.createReadStream(filePath);


    let data = '';
    for await (const chunk of rStream)
        data += chunk;
    hash.update(data);
    return hash.digest('hex');
}

/**
 * Function to check if the MD5 hash of a file matches a given digest.
 * @param {String} filePath - Path to the file to check.
 * @param {String} digestToCompare - The MD5 digest to compare against.
 * @returns {Boolean} True if the file's MD5 hash matches the provided digest, false otherwise.
 */
export async function checkFileMD5(filePath, digestToCompare){
    const digest = await signFileMD5(filePath);
    return digestToCompare === digest; 
}