import axios from 'axios';
import 'dotenv/config'
async function processTriggerEvent() {
    const host = 'google.com'
    setInterval(async () => {
        
        try{
            axios.get('https://jsonplaceholder.typicode.com/posts/1')
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