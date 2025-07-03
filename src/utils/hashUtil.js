import fs from "node:fs" 
import crypto from "crypto"

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

export async function checkFileMD5(filePath, digestToCompare){
    const digest = await signFileMD5(filePath);
    return digestToCompare === digest; 
}