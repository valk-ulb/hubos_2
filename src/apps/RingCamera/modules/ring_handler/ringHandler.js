import TelegramAPI from "./telegramAPI.js";

class RingHandler{

    constructor(){
        this.telegramAPI = new TelegramAPI();
    }

    handleNewMessage(message){
        const now = new Date();
        const full = now.toLocaleString();
        console.log(`received message: ${message} -- ${full}`)
        this.telegramAPI.sendMessage(`🔔 Doorbell Alert: Someone just rang the bell at your front door | ${full}`)
    }




}

const ringHandler = new RingHandler();

export default ringHandler;