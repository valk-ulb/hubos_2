// const fs = require('fs')

module.exports = class SpeechRecognition {
    constructor(device,eventEngine) {
        this.eventEngine = eventEngine;
        this.decoder = null;
    }

    async run(cameraDevice, eventEngine) {
        // Default input is 16kHz, 32-bit floating-point PCM
        // try to record the following phrases using the following command:
        // sox -c 1 -r 44100 -b 32 -e floating-point -d smart.raw trim 0 3
        // "lights set color red"
        // "tv set channel five"
        // "door lock"
        // let pcm = fs.readFileSync(__dirname + "/resources/smart.raw"); 
        // let pcm = fs.readFileSync(__dirname + "/resources/make-it-warmer.raw"); 
        // console.log("Butler: started speech recognition");
        logger.log.info("test: started speech recognition");
        logger.timeLog("test-app-fetching-audio", "start");
        logger.timeLog("test-app-fetching-audio", "end");
        // console.log(pcm);
        logger.timeLog("test-app-speech-recognition","start") 
        // Start speech processing
        // Get recognized text (NOTE: synchronous method)
        // console.log(hypothesis);
        // Again we must manually release memory
        // this.decoder.delete();
        let hypothesis = "test"
        logger.timeLog("test-app-speech-recognition","end") 
        this.eventEngine.addEvent('test1Event',hypothesis);
        // this.eventEngine.addEvent('SpeechRecognitionEvent','light on');
        
    }
}