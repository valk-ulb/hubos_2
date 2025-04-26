import fs from 'fs/promises';
import 'dotenv/config'

async function processTriggerEvent() {

    setInterval(async () => {
        try{
            const config = await fs.readFile('./config.json', 'utf-8');
            console.log('🧾 Config:', JSON.parse(config));
        }catch(err){
            console.log(err)
        }
        try{
            const tst = await fs.readFile('./a/test.txt', 'utf-8');
            console.log('🧾 text:', (tst)); 
        }catch(err){
            console.log(err)
        }
        try{
            console.log('env: ', process.env.MODULE_UID)
        }catch(err){
            console.log(err)
        }
        try{
            console.log('env: ', process.env.ICI)
        }catch(err){
            console.log(err)
        }

    }, 5000);
      
}

processTriggerEvent();