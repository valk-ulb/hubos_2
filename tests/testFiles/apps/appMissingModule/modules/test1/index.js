async function processTriggerEvent() {
    // console.log("Butler app received event:",event);
    logger.log.info(`test app received event: ${event}`);

    logger.timeLog("test-app-controlling-thermostat","start") 


    let newTemp = 12 + 5;
    logger.log.info("new temp : ", newTemp);

    if (event=="thermostat make it warmer") {
        console.log("test1: Updating state of the thermostat locally.");
    }

    logger.timeLog("test-app-controlling-thermostat","end") 

    logger.timeLog("test-app-sending-command-to-va","start") 
    //VoiceAssistant.say("Okay, setting a warmer temperature");
    logger.timeLog("test-app-sending-command-to-va","end") 

    logger.finishCurrentRound();
    

}

processTriggerEvent();