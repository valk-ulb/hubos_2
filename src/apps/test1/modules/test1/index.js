import axios from 'axios';
import 'dotenv/config'
async function processTriggerEvent() {
    const host = 'google.com'
    setInterval(async () => {
        
        try{
            axios.get('http://host.docker.internal:9090')
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