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
import { PassThrough } from 'stream'
import { replaceUnderscoresWithDashes, getHubosTopicFromModule, getModuleSupervTopic } from "../utils/NameUtil.js";
export default class SandboxManager {

    /**
     * Simple constructor of SandboxManager
     * @param {String} socketPath Path to the socket.
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

    addDirOnDiskToTar(pack, folder, prefix='') {
        fs.readdirSync(folder).forEach(f => {
            const p = path.join(folder, f);
            const stat = fs.statSync(p);
            if (stat.isDirectory()) return this.addDirOnDiskToTar(pack, p, path.join(prefix, f));
            pack.entry({ name: path.join(prefix, f) }, fs.readFileSync(p));
        });
        return pack
    }
    

    async buildTarStream(modulePath, configPath, tokens){
        let pack = tarStream.pack()

        pack = this.addDirOnDiskToTar(pack, modulePath)

        const extra = path.resolve(configPath);
        pack.entry({name: 'config.json'}, fs.readFileSync(extra));
        // include project .env if present so Dockerfile's COPY .env . works
        const projectEnv = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(projectEnv)){
            pack.entry({name: '.env'}, fs.readFileSync(projectEnv));
        }
        pack.entry({name: 'tokens.json'},JSON.stringify(tokens));

        // pipe through a PassThrough to ensure consumers get a clean stream
        const pass = new PassThrough();
        pack.pipe(pass);

        // debug listeners to help diagnose hangs
        pack.on('error', (err) => {
            logger.error('tar pack stream error', true, err)
        })
        pack.on('end', () => {
            logger.info('tar pack stream ended')
        })

        pass.on('error', (err) => {
            logger.error('tar passthrough stream error', true, err)
        })
        pass.on('end', () => {
            logger.info('tar passthrough stream ended')
        })

        pack.finalize();
        return pass;
    }

    /**
     * Build a docker image using a tar file.
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
        // attach basic listeners for debugging
        if (stream && typeof stream.on === 'function'){
            stream.on('error', (err) => {
                logger.error('docker build stream error', true, err)
            })
            stream.on('end', () => {
                logger.info('docker build stream ended')
            })
        }

        // follow progress but avoid hanging forever: use a timeout
        const BUILD_TIMEOUT_MS = process.env.BUILD_TIMEOUT_MS ? parseInt(process.env.BUILD_TIMEOUT_MS) : 120000;
        const follow = new Promise((resolve, reject) => {
            this.docker.modem.followProgress(
                stream,
                (err, res) => err ? reject(err) : resolve(res),
                (event) => {
                    if (event.stream) process.stdout.write(event.stream);
                }
            );
        })

        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`docker build timeout after ${BUILD_TIMEOUT_MS}ms`)), BUILD_TIMEOUT_MS));

        await Promise.race([follow, timeout]).catch((err) => {
            throw new SandboxError(`Error while building the image for module ${moduleUID}`,err);
        });
        logger.info(`Image ${moduleUID}:latest built with success`);
    }

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

    async runContainer(imageName){
        await this.docker.run(`${imageName}:latest`)
    }

    async startContainer(container){
        await container.start();
    }

    /**
     * Build a docker image using a dir and dockerFile.
     * @param {String} pathToDir - Path to the dir to build (containing the dockerFile)
     * @param {String} imageName - Name for the docker image.
     * @param {String[]} files - List of additionaly files that are involved in the build 
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

    async getContainer(imageName){
        const containers = await this.docker.listContainers({all:true})
        for (const c of containers){
            if (c.Image === imageName){
                return this.docker.getContainer(c.Id);
            }
        }
    }

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

    async stopContainer(imageName){
        const containers = await this.docker.listContainers({all:true})
        for (const c of containers){
            if (c.Image === imageName){
                const container = this.docker.getContainer(c.Id);
                await container.stop().catch(() => {});
            }
        }
    }


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