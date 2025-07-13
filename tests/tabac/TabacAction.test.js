import TabacTrigger from "../../src/tabacManager/TabacTrigger.js";
import { test, expect, vi } from "vitest";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Device from "../../src/model/Device.js";
import Module from "../../src/model/Module.js";
import { getItemNameFromModule } from "../../src/utils/NameUtil";
import TabacError from "../../src/error/TabacError.js";
import TabacAction from "../../src/tabacManager/TabacAction.js";
import Server from "../../src/model/Server.js";
import Configuration from "../../src/model/Configuration.js";
import { access } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __rootDirname = dirname(__filename);
const testFilesDir = join(__rootDirname, '../testFiles');


let actionTemp={
    access:'',
    type:'',
    context:{
        period:'',
        host:''
    }
}


test('tabacAction test device', async () => {
    let actionTemp={
        access:'device1',
        type:'device',
        context:{
            period:'4',
            concern:'module1'
        }
    }
    let tabacActionTemp = new TabacAction(actionTemp.access,actionTemp.type,actionTemp.context,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234')]
    expect(tabacActionTemp.isFlow).toBeFalsy();
    expect(tabacActionTemp.isService).toBeFalsy();
    expect(tabacActionTemp.isDevice).toBeTruthy();
    expect(tabacActionTemp.isStream).toBeFalsy();
    expect(tabacActionTemp.isSystem).toBeFalsy();
    expect(tabacActionTemp.isNetworkClient).toBeFalsy();
    expect(tabacActionTemp.period).toBe('4')

    tabacActionTemp.linkEntityReferences(conf,modules);
    expect(tabacActionTemp.linkedDeviceUID).toBe('111');
    expect(tabacActionTemp.concern).toBe('module1');
    expect(tabacActionTemp.concernModuleID).toBe('1234')

    
    const expected = {
        period: '4',
        type: 'device',
        access:'device1',
        deviceUID: '111'
    }
    expect(tabacActionTemp.getAuth()).toStrictEqual(expected)
})

test('tabacAction test device not existe', async () => {
    let actionTemp={
        access:'device12',
        type:'device',
        context:{
            period:'4'
        }
    }
    let tabacActionTemp = new TabacAction(actionTemp.access,actionTemp.type,actionTemp.context,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234')]
    expect(tabacActionTemp.isFlow).toBeFalsy();
    expect(tabacActionTemp.isService).toBeFalsy();
    expect(tabacActionTemp.isDevice).toBeTruthy();
    expect(tabacActionTemp.isStream).toBeFalsy();
    expect(tabacActionTemp.isSystem).toBeFalsy();
    expect(tabacActionTemp.isNetworkClient).toBeFalsy();
    expect(tabacActionTemp.period).toBe('4')

    
    expect(()=>tabacActionTemp.linkEntityReferences(conf,modules)).toThrowError(TabacError);

})

test('tabacAction test network client host all', async () => {
    let actionTemp={
        access:'NetworkClient',
        type:'service',
        context:{
            period:'4',
            host:'all',
            concern:'module1'
        }
    }
    let tabacActionTemp = new TabacAction(actionTemp.access,actionTemp.type,actionTemp.context,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234')]
    expect(tabacActionTemp.isFlow).toBeFalsy();
    expect(tabacActionTemp.isService).toBeTruthy();
    expect(tabacActionTemp.isDevice).toBeFalsy();
    expect(tabacActionTemp.isStream).toBeFalsy();
    expect(tabacActionTemp.isSystem).toBeFalsy();
    expect(tabacActionTemp.isNetworkClient).toBeTruthy();
    expect(tabacActionTemp.period).toBe('4')
    expect(tabacActionTemp.hostsIsAll).toBeTruthy();

    expect(tabacActionTemp.hosts).toBe('all')
    expect(tabacActionTemp.isMultipleHosts).toBeFalsy();

    tabacActionTemp.linkEntityReferences(conf,modules);
    expect(tabacActionTemp.concernModuleID).toBe('1234')
    expect(tabacActionTemp.linkedDeviceUID).toBe('');

    
    const expected = {
        period: '4',
        type: 'service',
        access: 'NetworkClient',
        server: 'all',
        hostIp: undefined
    }
    expect(tabacActionTemp.getAuth()).toStrictEqual(expected)
})

test('tabacAction test network client specific host', async () => {
    let actionTemp={
        access:'NetworkClient',
        type:'service',
        context:{
            period:'4',
            host:'server1',
            concern:'module1'
        }
    }
    let tabacActionTemp = new TabacAction(actionTemp.access,actionTemp.type,actionTemp.context,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234')]
    expect(tabacActionTemp.isFlow).toBeFalsy();
    expect(tabacActionTemp.isService).toBeTruthy();
    expect(tabacActionTemp.isDevice).toBeFalsy();
    expect(tabacActionTemp.isStream).toBeFalsy();
    expect(tabacActionTemp.isSystem).toBeFalsy();
    expect(tabacActionTemp.isNetworkClient).toBeTruthy();
    expect(tabacActionTemp.period).toBe('4')
    expect(tabacActionTemp.hostsIsAll).toBeFalsy();

    expect(tabacActionTemp.hosts).toBe('server1')
    expect(tabacActionTemp.isMultipleHosts).toBeFalsy();

    tabacActionTemp.linkEntityReferences(conf,modules);
    expect(tabacActionTemp.linkedDeviceUID).toBe('');
    expect(tabacActionTemp.hostIp).toStrictEqual(['www.domainServer1.be']);
    
    const expected = {
        period: '4',
        type: 'service',
        access: 'NetworkClient',
        server: 'server1',
        hostIp: 'www.domainServer1.be'
    }
    expect(tabacActionTemp.getAuth()).toStrictEqual(expected)
})

test('tabacAction test network client specific host not exist', async () => {
    let actionTemp={
        access:'NetworkClient',
        type:'service',
        context:{
            period:'4',
            host:'server12'
        }
    }
    let tabacActionTemp = new TabacAction(actionTemp.access,actionTemp.type,actionTemp.context,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234')]

    expect(()=>tabacActionTemp.linkEntityReferences(conf,modules)).toThrowError(TabacError);
})

test('tabacAction test network client list of host', async () => {
    let actionTemp={
        access:'NetworkClient',
        type:'service',
        context:{
            period:'4',
            host:['server1','server2','server3'],
            concern:'module1'
        }
    }
    let tabacActionTemp = new TabacAction(actionTemp.access,actionTemp.type,actionTemp.context,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344'),new Server('server2','www.domainServer2.be','description2','3345'),new Server('server3','www.domainServer3.be','description3','3346')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234')]
    expect(tabacActionTemp.isFlow).toBeFalsy();
    expect(tabacActionTemp.isService).toBeTruthy();
    expect(tabacActionTemp.isDevice).toBeFalsy();
    expect(tabacActionTemp.isStream).toBeFalsy();
    expect(tabacActionTemp.isSystem).toBeFalsy();
    expect(tabacActionTemp.isNetworkClient).toBeTruthy();
    expect(tabacActionTemp.period).toBe('4')
    expect(tabacActionTemp.hostsIsAll).toBeFalsy();

    expect(tabacActionTemp.hosts).toStrictEqual(['server1','server2','server3'])
    expect(tabacActionTemp.isMultipleHosts).toBeTruthy();

    tabacActionTemp.linkEntityReferences(conf,modules);
    expect(tabacActionTemp.linkedDeviceUID).toBe('');
    expect(tabacActionTemp.hostIp).toStrictEqual(['www.domainServer1.be','www.domainServer2.be','www.domainServer3.be']);
    //expect(tabacActionTemp.hostPort).toStrictEqual(['1334','1334','1334']);
    
    const expected = [
        {
            period: '4',
            type: 'service',
            access: 'NetworkClient',
            server: 'server1',
            hostIp: 'www.domainServer1.be'
        },
        {
            period: '4',
            type: 'service',
            access: 'NetworkClient',
            server: 'server2',
            hostIp: 'www.domainServer2.be'
        },
        {
            period: '4',
            type: 'service',
            access: 'NetworkClient',
            server: 'server3',
            hostIp: "www.domainServer3.be",

        }
    ]
    expect(tabacActionTemp.getAuth()).toStrictEqual(expected)
})

test('tabacAction test network client list of host and one not exist', async () => {
    let actionTemp={
        access:'NetworkClient',
        type:'service',
        context:{
            period:'4',
            host:['server1','server44','server3']
        }
    }
    let tabacActionTemp = new TabacAction(actionTemp.access,actionTemp.type,actionTemp.context,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344'),new Server('server2','www.domainServer2.be','description2','3345'),new Server('server3','www.domainServer3.be','description3','3346')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234')]
    expect(tabacActionTemp.isFlow).toBeFalsy();
    expect(tabacActionTemp.isService).toBeTruthy();
    expect(tabacActionTemp.isDevice).toBeFalsy();
    expect(tabacActionTemp.isStream).toBeFalsy();
    expect(tabacActionTemp.isSystem).toBeFalsy();
    expect(tabacActionTemp.isNetworkClient).toBeTruthy();
    expect(tabacActionTemp.period).toBe('4')
    expect(tabacActionTemp.hostsIsAll).toBeFalsy();

    expect(tabacActionTemp.hosts).toStrictEqual(['server1','server44','server3'])
    expect(tabacActionTemp.isMultipleHosts).toBeTruthy();

    expect(()=>tabacActionTemp.linkEntityReferences(conf,modules)).toThrowError(TabacError)
    
})