import App from "../model/App.js";
import Docker from "dockerode";
import logger from '../utils/logger.js'
import SandboxError from "../error/SandboxError.js";
import path from 'path';
import fs from 'fs';
import tarStream from 'tar-stream'
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
        this.SUBNET = '172.25.0.0/16';
        this.GATEWAY = '172.25.0.1';
        this.PROXY_PORT = 9090;
        this.dockerHost = `http://${this.GATEWAY}:${this.PROXY_PORT}`
    }

    async createIsolatedNetwork() {
        console.log('🌐 Création du réseau isolé...');

        try {
          await docker.createNetwork({
            Name: 'isolated_net',
            Driver: 'bridge',
            IPAM: {
              Config: [{ Subnet: SUBNET, Gateway: GATEWAY }]
            }
          });
        } catch (err) {
          if (err.statusCode === 409) {
            logger.info('ℹ️ Le réseau existe déjà, on continue...');
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
    }
    

    async buildTarStream(modulePath, configPath, tokens){
        const pack = tarStream.pack()
        
        this.addDirOnDiskToTar(pack, modulePath)
        

        const extra = path.resolve(configPath);
        pack.entry({name: 'config.json'}, fs.readFileSync(extra));
        pack.entry({name: 'tokens.json'},JSON.stringify(tokens));
        pack.finalize();
        return pack;
    }

    /**
     * Build a docker image using a tar file.
     * @param {any} tarStream - tarStream to build.
     * @param {String} moduleUID - uid of the module the image is build for .
     */
    async buildImageWithTar(tarStream, moduleUID){
        let stream = await this.docker.buildImage(tarStream, {
            t: `${moduleUID}:latest`,
            dockerfile:'Dockerfile',
            buildargs:{
            }
        });
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

    async createContainer(imageName){
        const container = await this.docker.createContainer({
            Image: `${imageName}:latest`,
            name: imageName,
            HostConfig: {
                Runtime: 'runsc',
                NetworkMode: 'host'
            },
            ExposedPorts: {
                '9090/tcp': {}
            },
            Env: [
                `MODULE_UID=${imageName}`
            ]
        });
        return container;
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
                logger.info(`Image with Dir : ${pathToDir} and files : ${files} - build : `, response);
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
                await container.stop().catch(() => {});
                await container.remove({force:true});

                const image = this.docker.getImage(c.Image);
                console.log(image.id)
                console.log(image.tag)
                image.remove((err, data) => {
                    if (err) {
                        logger.error('Error trying stopping a container :', err);
                      } else {
                        logger.info('Container stoped with success', data);
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
            containers.forEach( (containerInfo) => {
                this.docker.getContainer(containerInfo.Id).remove((err, data) => {
                    if (err) {
                        logger.error('Error trying stopping a container :', err);
                      } else {
                        logger.info('Container stoped with success', data);
                      }
                });
            })
        })
    }

    async removeImage(imageName){
        const image = this.docker.getImage(imageName);
        image.remove((err, data) => {
            if (err) {
                logger.error('Error trying stopping a container :', err);
              } else {
                logger.info('Container stoped with success', data);
              }
        });
    }
}