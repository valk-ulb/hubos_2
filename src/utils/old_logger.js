const winston = require('winston');
const fs = require('fs');

let currentRoundLogStarters = new Map();
let currentRoundLogEnders = new Map();
let experimentResults = new Map();

let roundRunning = false;
let roundCount = 0;

const log = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    // defaultMeta: { service: 'user-service' },
    transports: [],
});

const expLog = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    // defaultMeta: { service: 'user-service' },
    transports: [],
});

const myFormat = winston.format.printf(({ level, message, label, timestamp }) => {
    // return `${timestamp} [${label}] ${level}: ${message}`;
    return `${message}`;
  });

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV === 'production') {
    log.add(new winston.transports.Console({
        silent: true
    }));
    expLog.add(new winston.transports.Console({
        format: myFormat,
    }));

} else {
    log.add(new winston.transports.Console({
        format: myFormat,
    }));
    expLog.add(new winston.transports.Console({
        format: myFormat,
    }));
}



const timeLog = function (name,type) {
    if (roundCount<15) return;
    // console.log("HERE?",roundCount)
    if (type==="start") {
        currentRoundLogStarters.set(name,new Date().getTime())
    }
    if (type==="end") {
        currentRoundLogEnders.set(name,new Date().getTime())
    }
};

const printExperimentResults = function(appName,context) {
    results = []
    n = 1;
    results.push(`operation,${context}-runtime, ${context}-stdev`)
    experimentResults.forEach((value,key) => {
        // console.log(`${key}, ${value}`);
        var total = 0;
        for(var k in value) 
           total += value[k];
        var meanVal = total / value.length;
        // CALCULATE AVERAGE
      
        // CALCULATE STANDARD DEVIATION
        var SDprep = 0;
        for(var k in value) 
           SDprep += Math.pow((parseFloat(value[k]) - meanVal),2);
        var SDresult = Math.sqrt(SDprep/(value.length-1));
        // CALCULATE STANDARD DEVIATION

        // expLog.info("Total:"+ total);
        // expLog.info("Mean:" + meanVal);
        // expLog.info("Stdev:" + SDresult);

        expLog.info(`${n}, ${meanVal}, ${SDresult}`);
        results.push(`${n}, ${meanVal}, ${SDresult}`)
        // expLog.info(`${key}, ${value}`);
        n += 1;
    })
    console.log(experimentResults.keys());
    fs.writeFileSync(`./eval-results-${appName}-${context}.csv`, results.join("\r\n"), (err) => {
        console.log(err || "done");
    });
}

const finishCurrentRound = function() {
    // console.log(currentRoundLogStarters.size, currentRoundLogEnders.size);
    try {
        if (currentRoundLogStarters.size !== currentRoundLogEnders.size) {
            throw new Error("Logger: Starters and Enders lists are not the same size.")
        }
        currentRoundLogStarters.forEach((value,key) => {
            let startTime = value;
            if (!currentRoundLogEnders.has(key)) {
                throw new Error("Logger Couldn't find the same key in enders map.")
            }
            let endTime = currentRoundLogEnders.get(key);
            let duration = endTime - startTime;
            if (duration<0) {
                throw new Error(`Logger: got negative duration for ${key} key`)
            }
            if (experimentResults.has(key)) {
                let durationList = experimentResults.get(key);
                durationList.push(duration);
            } else {
                experimentResults.set(key,[duration]);
            }
        })
        currentRoundLogStarters.clear();
        currentRoundLogEnders.clear();
        roundCount += 1;
        roundRunning = false;
    } catch (error) {
        // console.log(error);
        log.info(`Something went wrong: ${error}`);
    }
    
}

const startNewRound = function() {
    // console.log("Current round is", roundCount);
    roundRunning = true;
}

const isRoundRunning = function() {
    return roundRunning;
}

const getRoundCount = function() {
    return roundCount;
}

module.exports = {log, expLog, timeLog, printExperimentResults,finishCurrentRound,startNewRound,isRoundRunning,getRoundCount};
