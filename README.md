# HubOS - a private-by-design smart hub operating system

## Prerequisites

HubOS depends on several off-the-shelf components that need to be running alongside. 
Below we describe how to properly obtain and instantiate those.

### Node.js and npm 

Install Node.js and npm. HubOS was tested with Node.js v16.14.2 and npm v8.10.0 but should *probably* work 
just as fine with the latest versions of both. 
Prefer official distribution channels instead of the ones offered by your operating system distribution.

### Yarn

Some modules have dependencies that can only be installed properly with `yarn` package manager. 
So install `yarn` as well.

You can do so by executing the following command:
```
npm install --global yarn
```

### Build dependencies

Install additional system dependencies by executing the following command (Ubuntu):
```
sudo apt install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```
These are needed by various modules of demo applications.

### Redis server

We use Redis for an in-memory key-value store that is offered through an HubOS API to all the applications.
Redis runs in a Docker container and uses a local `data` folder to store snapshots.

Create a Redis docker container by executing the following script in a `docker/` folder:
```
./create-redis-container.sh
```
Note: a `data` folder will be created in the same folder where you run the script.

To restart the container anytime later use the following script in a `docker/` folder:
```
./start-redis-container.sh
```

### MQTT server

We use MQTT for message-passing between the application modules and HubOS. Along with Redis, MQTT is 
one of the essential parts of HubOS.

You can run MQTT locally as a system process or in a Docker container.

The easiest way is to run it as a local process since most Linux distributions offer it as a package.
To install it run the following command in your terminal:
```
sudo apt install mosquitto
```
This will install Mosquitto MQTT broker with default settings.
Note, you should always consider properly configuring the broker and set up proper authentication for
connecting clients. 

### Cloud-endpoints for applications

Following the cloud-first model, HubOS applications are expected to execute privacy-sensitive 
operations locally at the hub and use cloud resources for those operations that were specifically authorized by the user.
We offer cloud-side endpoints for local HubOS applications to connect to. 
In production these cloud endpoints would be running in, well, a cloud. 
For testing purposes though we run them on the same machine where HubOS applications run (or in the same cluster).

**1. Butler application server aka. remote speech recognition engine**

This server receives audio command that was not recognized locally and runs it through a more complex STT engine.
The results are returned immediately on the same socket. 

Go to `docker/butler-server/` folder:

``` 
cd docker/butler-server/
```

Download the STT recognition models by executing a script:
```
./download-model.sh
```
This will download the model and scorer files and put them in a `models` folder.

Install sox library (should be available on any Linux system. Tested on Ubuntu 20.04)

```
sudo apt install sox
```
Finally, install all the dependencies:

```
npm i
```

and start the app server

```
node start.js
```

**2. FallWatch application server aka. remote senior care service**

This server receives the camera video stream from the local FallWatch application running on the hub
when the latter detects a fall event. The server does not save the received video bytes. The socket connection
is terminated after the last byte of the video. 

Go to `docker/fallwatch-server/` folder:
```
cd docker/fallwatch-server/
```
Install dependencies:
```
npm i
```
and start the server
```
node start-socket-server.js
```

**3. SmartCamera application aka remote file storage service**

This server receives a camera frame from the local application.

Go to `docker/smartcamera-server/` folder:
```
cd docker/smartcamera-server/
```
and start the server
```
node start.js
```

### HubOS core

Go to `system/` folder:
```
cd system/
```
Install the dependencies
```
yarn
```
Create an `.env` file in the main `system/` folder with all the environment variables listed
```
touch .env
```
and put the following data in it:
```
BUTLER_CLOUD_SERVER=0.0.0.0
FALLWATCH_CLOUD_SERVER=0.0.0.0
SMARTCAMERA_CLOUD_SERVER=0.0.0.0
```
Note, when using a cluster of machines modify the IP addresses accordingly.

## Running

HubOS repository contains 4 demo apps:
- **Butler app**: performs locall speech-to-text (STT) recognition and controls local devices. When the command is not recognized the app sends a raw audio to a remote STT engine.
- **ButlerLocal app**: an alternative version of the previous app but with only local STT functionality. No cloud services involved. 
- **FallWatch app**: performs basic fall detection and starts video camera streaming to a care agent service when it detects a fall.
- **SmartCamera app**: performs local face recognition of people in front of the front door and sends snapshots to the home owner if it detects an unknown face.

You can run **all of these apps at the same time** (excluding ButlerLocal app) by executing the following command in the main `system/` folder:
```
npm run dev     # for development mode
```
or 
```
npm run prod    # for production mode (no outputs)
```
Note, with this command HubOS will execute each app **exactly once** and remain in a standby mode.

If you want to **execute each app individually**, run the following command:
```
npm run <appname>  
```
e.g.
```
npm run butler  # or butlerlocal or fallwatch or smartcamera
```
This command executes the specified app in a dev mode by default.

## Evaluation

### Runtime performance of demo applications within HubOS

In this experiment we evaluate the runtime performance of demo applications, that is how much time in ms it takes to execute each of the operation in an application logic.

To run a given application in an evaluation mode execute the following command:
```
npm run eval-butler     # or 'eval-fallwatch' or 'eval-smartcamera'
```
This will execute a given app 20 times after a 15 times warmup. 
Feel free to change these configs in `start.js` file. 
The evaluation runs in minimal output mode. If all goes well you should see the output similar to this one:
```
$ npm run eval-butler

> hubos-core@0.0.1 eval-butler
> NODE_ENV=production node start eval Butler

Finished experiments.
1, 1.35, 0.9333020044867296     # 'butler-app-fetching-audio' operation took 1.35 ms with stdev=0.933 ms
2, 134.2, 24.75904938231251     # 'butler-app-speech-recognition' operation took 134.2 ms with stdev=24.759 ms
3, 2.7, 0.6569466853317864      # ...
4, 878.15, 15.550511922526265
5, 0.25, 0.4442616583193193
6, 0.05, 0.22360679774997894
[Map Iterator] {
  'butler-app-fetching-audio',
  'butler-app-speech-recognition',
  'event-engine-processing-event',
  'butler-app-sending-audio-to-cloud',
  'butler-app-controlling-thermostat',
  'butler-app-sending-command-to-va'
}
```
There were 6 operations in Bulter application logic that we were measuring.
Their names are stated in the `Map Iterator` in the order of their execution.
Above, for each operation, numbered from 1 to 6, there is an average runtime (in ms) and its stdev value (also in ms).

Note, some operations are very fast. For instance a 'butler-app-controlling-thermostat' one. 
That is due to the fact that HubOS does not actually connect to the Thermostat to change its state. 
Instead it just assumes that this state change will be done on a higher API level.
The operation itself is asynchronous and returns immediately. 

Running HubOS application in an evaluation mode generates a **csv file** with all the above measurements in the main project folder.
The file generated after running Butler app in an evaluation mode would have the following name for example: `eval-results-Butler-hubos.csv`.



### Runtime performance of demo applications as standalone apps

Follow the instructions at the designated [README.md](evaluation/standalone-apps/README.md) file. 

### Runtime performance of demo applications as cloud apps/microservices

Follow the instructions at the designated [README.md](evaluation/cloud-apps/README.md) file. 

