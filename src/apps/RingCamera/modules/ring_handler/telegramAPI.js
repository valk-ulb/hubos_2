import fs from 'fs'
import axios from 'axios'
import * as dotenv from "dotenv";
import { HttpsProxyAgent } from 'https-proxy-agent';
dotenv.config({});
import FormData from 'form-data';
import util from 'util'
import fetch from 'node-fetch'
import { url } from 'inspector';
export default class TelegramAPI{

    constructor(){
        this.config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        this.ipcamera = this.config.configuration.others.DoorbellCamera;
        this.ipcameraMjpeg = this.ipcamera.mjpegUrl;
        this.ipcameraJpg = this.ipcamera.snapshotUrl;

        this.telegramBot = this.config.configuration.others.TelegramBot;
        this.telegramToken = this.telegramBot.token;
        this.telegramChatId = this.telegramBot.chatId;
        console.log(this.telegramBot)
        console.log(process.env.HTTPS_PROXY)
        this.agent = new HttpsProxyAgent(`http://${process.env.MODULE_UID}:+${process.env.MODULE_UID}@${process.env.HTTPS_PROXY}`);
        console.log(process.env.MODULE_UID)
    }

    async sendMessage(message){

        const url = `https://api.telegram.org/bot${this.telegramToken}/sendMessage`;
        await axios.post(url, {
            chat_id:this.telegramChatId,
            text: message
        },
        {
            headers:{
                'Content-Type': 'application/json',
                'hubos-container-id': process.env.MODULE_UID,
            },
            httpsAgent: this.agent,
            proxy: false
        }).catch(error => {
            console.error('Erreur sending the message: ',error)
        })

        await this.getSnapshot();
    }

    async getSnapshot(){
        let response = await this.downloadImage(this.ipcameraJpg)
        console.log('Image recu')


        const form = new FormData();
        form.append('photo', response, {
            filename: 'doorbell.jpg',
            contentType: 'image/jpg',
        });
        const url = `https://api.telegram.org/bot${this.telegramToken}/sendPhoto`
        axios.postForm(url, {
            chat_id: this.telegramChatId,
            photo: response
        },{
            httpsAgent: this.agent,
            proxy: false
        }).then((response) => {
            console.log('✅ Image envoyée avec succès');    
            console.log(response);
        })
        .catch((error) => {
          console.log(error);
        });

    }

    async downloadImage(url) {
        const response = await axios.get(url,{
            responseType: 'stream',
            httpAgent: this.agent,
            proxy: false
        });
        return response.data
    }



}