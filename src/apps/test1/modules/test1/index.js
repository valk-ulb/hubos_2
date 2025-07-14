import axios from 'axios';
import * as dotenv from "dotenv";
dotenv.config({});

async function processTriggerEvent() {
    const host = 'http://host.docker.internal:9090/api/v1'
    setInterval(async () => {
        
        try{
            console.log("ici")
            axios.post(`${process.env.HUBOS_API}/echo`, 
                {
                    message: 'Hello from axios'
                }, 
                {
                    headers:{
                        'Hubos-Container-ID':process.env.MODULE_UID
                    }
                })
                .then(response => {
                    // Afficher le corps de la réponse
                    console.log('Response:', response.data);
                })
                .catch(error => {
                    console.error('Error occurred:', error);
                });
        }catch(err){
            console.log(err)
        }

    }, 5000);
      
}

processTriggerEvent();