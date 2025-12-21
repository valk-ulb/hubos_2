import App from "../model/App.js";
import Docker from "dockerode";
import logger from '../utils/logger.js'
import SandboxError from "../error/SandboxError.js";
import path from 'path';
import fs, { link } from 'fs';
import tarStream from 'tar-stream'
import hproxy from "../core/HProxy.js";
import hserver from "../core/Hserver.js";
import util from 'util'
import { replaceUnderscoresWithDashes, getHubosTopicFromModule, getModuleSupervTopic } from "../utils/NameUtil.js";

/**
 * Class in charge of managing sandboxes (containers) for modules with Dockerode.
 */
export default class SandboxManager {

    /**
     * Simple constructor of SandboxManager
     * Connects to the Docker Engine.
     * @param {String} socketPath Path to the socket of Docker Engine.
     */
    constructor(socketPath=null){
        this.docker = new Docker();
        if(socketPath){
            this.docker = new Docker({ socketPath: socketPath});
        }
        this.proxy = hproxy.proxy;
        this.SUBNET = process.env.HOST_DOCKER_SUBNET;
        this.GATEWAY = process.env.HOST_DOCKER_GATEWAY;
        this.MQTT_HOST = process.env.MQTT_HOST;
        this.MQTT_PORT = process.env.MQTT_PORT;
    }

    /**
     * Create a docker network for HubOS containers.
     * The network is derived from the bridge driver and configured as a subnet of 172.20.0.0/16.
     * This function may be deprecated in the future because last version of HubOS require self 
     * configuration of an isolated network since manipulating iptables require specific access. 
     * @returns {void} nothing.
     * @throws {Error} throw an error if occured during the network creation
     */
    async createIsolatedNetwork() {
        logger.info('Creation of a docker isolated network');
        const networks = await this.docker.listNetworks({filters:{name:['hubos_net']}});
        if (networks.length > 0){
            logger.info(`Network hubos_net already. Skipping this part.`);
            return;
        }
        try {
            await this.docker.createNetwork({
                Name: 'hubos_net',
                Driver: 'bridge',
                Internal: true,
                IPAM: {
                    Config: [
                        { 
                            Subnet: "172.20.0.0/16"
                        }
                    ]
                },
                Options: {
                    'com.docker.network.bridge.enable_ip_masquerade': 'false'
                }
            });
            logger.info('Network hubos_net created')
        } catch (err) {
          if (err.statusCode === 409) {
            throw new Error('Error whille trying creating the network hubos_net');
          } else {
            throw err;
          }
        }
    }

    /**
     * Recursive function that read the content of a directory add each file into a pack object 
     * and call this function recursively to read and add the content of each directory.
     * It is used to recreate a module inside a TAR Stream Pack object.
     * @param {tarStream.Pack} pack - Tar Stream Pack representing the tar of a module and its content.
     * @param {String} folder - Absolute path to the current folder. 
     * @param {String} prefix - Path starting a the root of the module.
     * @returns {tarStream.Pack} Tar Stream Pack poppulated with all the files and directory of the given module.
     */
    addDirOnDiskToTar(pack, folder, prefix='') {
        fs.readdirSync(folder).forEach(f => {
            const p = path.join(folder, f);
            const stat = fs.statSync(p);
            if (stat.isDirectory()) return this.addDirOnDiskToTar(pack, p, path.join(prefix, f));
            pack.entry({ name: path.join(prefix, f) }, fs.readFileSync(p));
        });
        return pack
    }
    

    /**
     * Create a tar Stream Pack object from the content of a module.
     * To this tar Stream Pack, the function add also : 
     * 1. the config.json of the app, in case the module need element defined in it 
     * (especially for element defined in the [others] field of the config file).
     * 2. a token.json created from a JWT token that will be used in the future for secure communication between HubOS and modules. 
     * @param {String} modulePath - Absolute path to the module. 
     * @param {String} configPath - Absolute path to the config.json file of the app  
     * @param {String} tokens - JWT token that will be used in the future for secure communication. 
     * @returns {tarStream.Pack} Tar Stream Pack representing the tar of the module.
     */
    async buildTarStream(modulePath, configPath, tokens){
        let pack = tarStream.pack()
        
        pack = this.addDirOnDiskToTar(pack, modulePath)
        

        const extra = path.resolve(configPath);
        pack.entry({name: 'config.json'}, fs.readFileSync(extra));
        pack.entry({name: 'tokens.json'},JSON.stringify(tokens));
        pack.finalize();
        return pack;
    }

    /**
     * Build a docker image using a tar file.
     * the builded docker image has the name: '<moduleUID>:latest'.
     * @param {any} tarStream - tarStream to build.
     * @param {String} moduleUID - uid of the module the image is build for .
     */
    async buildImageWithTar(tarStream, moduleUID){
        logger.info(`Building the image : ${moduleUID}:latest`);
        let stream = await this.docker.buildImage(tarStream, {
            t: `${moduleUID}:latest`,
            dockerfile:'Dockerfile',
            buildargs:{
            }
        })
        logger.info(`image : ${moduleUID}:latest builded`);
        await new Promise((resolve, reject) => {
            this.docker.modem.followProgress(
                stream,
                (err, res) => err ? reject(err) : resolve(res),
                (event) => {
                    if (event.stream) process.stdout.write(event.stream);
                }
            );
        });    
    }

    /**
     * Create a container using its imageName.
     * The container is created using runsc from gVisor,
     * adding access to the local host, 
     * specifying the networkMode.
     * Addings extra details in the .env: 
     * - Specify the by default use of a HTTP(S)-PROXY service
     * - Allowing not using the proxy for the localhost and the mqtt broker. 
     * - MQTT HOST + MQTT PORT
     * - Module_Topic = the topic the module can use to communicate event.
     * - Module_Superv_topic = the topic HubOS/OpenHAB use to forward messages to the module.
     * - HubOS_API = the url for the REST API of HubOS. 
     * - MQTT_USERNAME + MQTT_PASSWORD in order to connect into the mqtt broker.
     * @param {String} imageName - just the moduleUID
     * @returns {Docker.Container} Docker container of the module.
     * @throws {SandboxError} If an error occured during the creation of the container.
     */
    async createContainer(imageName){
        const container = await this.docker.createContainer({
            Image: `${imageName}:latest`,
            name: imageName,
            HostConfig: {
                Runtime: 'runsc',
                ExtraHosts:['host.docker.internal:host-gateway'],
                NetworkMode: 'my-secure-network'
            },
            ExposedPorts: {
                '9090/tcp': {}
            },
            Env: [
                `HTTP_PROXY=${this.proxy}`,
                `HTTPS_PROXY=${this.proxy}`,
                `NO_PROXY=localhost,host.docker.internal,mqtt://localhost:${this.MQTT_PORT},mqtt://host.docker.internal:${this.MQTT_PORT}`,
                `MODULE_UID=${imageName}`,
                `MQTT_PORT= ${this.MQTT_PORT}`,
                `MQTT_HOST=${this.MQTT_HOST}`,
                `MODULE_TOPIC=${getHubosTopicFromModule(imageName)}`,
                `MODULE_SUPERV_TOPIC=${getModuleSupervTopic(imageName)}`,
                `HUBOS_API=${hserver.hubosServer}`,
                `MQTT_USERNAME=${replaceUnderscoresWithDashes(imageName)}`,
                `MQTT_PASSWORD=${replaceUnderscoresWithDashes(imageName)}`
            ]
        }).catch((err) => {
            throw new SandboxError('Error while creating the container',err);
        });
        return container;
    }

    /**
     * Run a container.
     * Used if the container was stopped.
     * @param {String} imageName - just moduleUID
     */
    async runContainer(imageName){
        await this.docker.run(`${imageName}:latest`)
    }

    /**
     * Start the given container.
     * @param {Docker.Container} container - Docker container of a module. 
     */
    async startContainer(container){
        await container.start();
    }

    /**
     * DEPRECATED - Build a docker image using a dir and dockerFile.
     * @param {String} pathToDir - Path to the dir to build (containing the dockerFile)
     * @param {String} imageName - Name for the docker image.
     * @param {Array<String>} files - List of additionaly files that are involved in the build.
     * @throws {SandboxError} If an error occured during the build.
     */
    buildImageWithDir(pathToDir, imageName, files){
        this.docker.buildImage({
            context: pathToDir,
            src: files
        },{t:imageName}, function (err, response) {
            if (err){
                throw new SandboxError(`Error: trying to build image from dir with path : ${pathToDir} and files : ${files}`,err)
            }else{
                logger.info(`Image with Dir : ${pathToDir} and files : ${files} - build : `,true, response);
            }
        });
    }

    /**
     * Get the container with its name.
     * @param {String} imageName - Image name <moduleUID>:latest 
     * @returns {Docker.Container} container of the given imageName if found.
     */
    async getContainer(imageName){
        const containers = await this.docker.listContainers({all:true})
        for (const c of containers){
            if (c.Image === imageName){
                return this.docker.getContainer(c.Id);
            }
        }
    }

    /**
     * Stop and remove a container using its imageName.
     * + Remove the linked image.
     * @param {String} imageName - Image name <moduleUID>:latest.
     */
    async stopAndRemoveContainer(imageName){
        const containers = await this.docker.listContainers({all:true})
        for (const c of containers){
            if (c.Image === imageName){
                const container = this.docker.getContainer(c.Id);
                await container.stop().catch((err) => {logger.error(`error deleting container: `,true, err)});
                await container.remove({force:true});

                const image = this.docker.getImage(c.Image);
                image.remove((err, data) => {
                    if (err) {
                        logger.error('Error trying stopping a container :',true, err);
                      } else {
                        logger.info('Container stoped with success',true, data);
                      }
                });
            }
        }
    }

    /**
     * Stop a container using its imageName
     * @param {String} imageName - Image name <moduleUID>:latest 
     */
    async stopContainer(imageName){
        const containers = await this.docker.listContainers({all:true})
        for (const c of containers){
            if (c.Image === imageName){
                const container = this.docker.getContainer(c.Id);
                await container.stop().catch(() => {});
            }
        }
    }


    /**
     * Remove all Docker containers on host.
     * !!! TO REWORK - just remove HubOS containers not others. 
     */
    async removeAllContainersOnHost(){
        this.docker.listImages( (err, containers) => {
            console.log(containers.length)
        })
        this.docker.listContainers( (err,containers) => {
            console.log(containers.length)
            for (let containerInfo of containers){
                this.docker.getContainer(containerInfo.Id).remove((err, data) => {
                    if (err) {
                        logger.error('Error trying removing a container :',true, err);
                      } else {
                        logger.info('Container removed with success',true, data);
                      }
                });
            }
        })
    }

    /**
     * Remove a Docker image with its name.
     * @param {String} imageName - Image name <moduleUID>:latest 
     */
    async removeImage(imageName){
        const image = this.docker.getImage(imageName);
        image.remove((err, data) => {
            if (err) {
                logger.error('Error trying removing a container image :',true, err);
              } else {
                logger.info('Container image removed with success',true, data);
              }
        });
    }
}