import TabacTrigger from "../../src/tabacManager/TabacTrigger.js";
import { test, expect, vi } from "vitest";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Device from "../../src/model/Device.js";
import Module from "../../src/model/Module.js";
import { getItemNameFromModule, getModuleAuthTopic, getModuleSupervTopic } from "../../src/utils/NameUtil";
import TabacError from "../../src/error/TabacError.js";
import TabacAction from "../../src/tabacManager/TabacAction.js";
import Server from "../../src/model/Server.js";
import Configuration from "../../src/model/Configuration.js";
import { access } from "fs";
import util from 'util';
import TabacRule from "../../src/tabacManager/TabacRule.js";

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
test('tabacRule test 1 device, updated trigger', async () => {
    let actionTemp={
        access:'device1',
        type:'device',
        context:{
            period:'4',
            concern:'module1'
        }
    }
    let triggerTemp = {
        event: "mqtt.module1",
        context: "updated",
        value:'1'
    }
    let tabacRuleTemp = new TabacRule('test',triggerTemp, [], [actionTemp]);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234')]
    
    expect(tabacRuleTemp.trigger).toStrictEqual(new TabacTrigger('mqtt.module1', 'updated','1',1));
    expect(tabacRuleTemp.conditions).toStrictEqual([]);
    expect(tabacRuleTemp.actions).toStrictEqual([new TabacAction('device1','device',actionTemp.context,2)])
    expect(tabacRuleTemp.position).toBe(2)

    tabacRuleTemp.linkEntityReferences(conf,modules);

    expect(tabacRuleTemp.trigger.itemName).toBe(getItemNameFromModule('1234'))
    expect(tabacRuleTemp.actions[0].linkedDeviceUID).toBe('111');

    let openhabRule = tabacRuleTemp.decode('myBrokerTest');
    let expected = {
        configuration: {},
        triggers: [{
            id:1,
            configuration:{
                itemName: getItemNameFromModule('1234'),
                state: '1'
            },
            type: 'core.ItemStateUpdateTrigger'
        }],
        conditions: [],
        actions: [{
            id:2,
            configuration:{
                topic: getModuleAuthTopic('1234'),
                value: "[{\"period\":\"4\",\"type\":\"device\",\"access\":\"device1\",\"deviceUID\":\"111\"}]",
                config: 'myBrokerTest'
            },
            type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
        }]
    }
    expect(tabacRuleTemp.position).toBe(3)

    expect(openhabRule).toStrictEqual({name:"test",openhabRule:expected})
})

test('tabacRule test 1 device all server, updated trigger', async () => {
    let actionTemp=[
        {
            access:'device1',
            type:'device',
            context:{
                period:'4',
                concern:'module1'
            }
        },
        {
            access: 'NetworkClient',
            type:'service',
            context: {
                'period': '5',
                'host': 'all',
                concern:'module1'
            }
        }
    ]
    let triggerTemp = {
        event: "mqtt.module1",
        context: "updated",
        value:'1'
    }
    let tabacRuleTemp = new TabacRule('test',triggerTemp, [], actionTemp);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234')]
    
    expect(tabacRuleTemp.trigger).toStrictEqual(new TabacTrigger('mqtt.module1', 'updated','1',1));
    expect(tabacRuleTemp.conditions).toStrictEqual([]);
    expect(tabacRuleTemp.actions).toStrictEqual([new TabacAction('device1','device',actionTemp[0].context,2), new TabacAction(actionTemp[1].access,actionTemp[1].type, actionTemp[1].context,2)])
    expect(tabacRuleTemp.position).toBe(2)

    tabacRuleTemp.linkEntityReferences(conf,modules);

    expect(tabacRuleTemp.trigger.itemName).toBe(getItemNameFromModule('1234'))
    expect(tabacRuleTemp.actions[0].linkedDeviceUID).toBe('111');

    let openhabRule = tabacRuleTemp.decode('myBrokerTest');
    let expected = {
        configuration: {},
        triggers: [{
            id:1,
            configuration:{
                itemName: getItemNameFromModule('1234'),
                state: '1'
            },
            type: 'core.ItemStateUpdateTrigger'
        }],
        conditions: [],
        actions: [{
            id:2,
            configuration:{
                topic: getModuleAuthTopic('1234'),
                value: "[{\"period\":\"4\",\"type\":\"device\",\"access\":\"device1\",\"deviceUID\":\"111\"},{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"all\"}]",
                config: 'myBrokerTest'
            },
            type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
        }]
    }
    expect(tabacRuleTemp.position).toBe(3)

    expect(openhabRule).toStrictEqual({name:"test",openhabRule:expected})
})

test('tabacRule test 1 device 1 server, updated trigger', async () => {
    let actionTemp=[
        {
            access:'device1',
            type:'device',
            context:{
                period:'4',
                concern:'module1'
            }
        },
        {
            access: 'NetworkClient',
            type:'service',
            context: {
                'period': '5',
                'host': 'server1',
                concern:'module1'
            }
        },
        {
            access: 'NetworkClient',
            type:'service',
            context: {
                'period': '5',
                'host': 'server3',
                concern:'module1'
            }
        }
    ]
    let triggerTemp = {
        event: "mqtt.module1",
        context: "updated",
        value:'1'
    }
    let tabacRuleTemp = new TabacRule('test',triggerTemp, [], actionTemp);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344'),new Server('server2','www.domainServer2.be','description','3345'),new Server('server3','www.domainServer3.be','description','3346')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234')]
    
    expect(tabacRuleTemp.trigger).toStrictEqual(new TabacTrigger('mqtt.module1', 'updated','1',1));
    expect(tabacRuleTemp.conditions).toStrictEqual([]);
    expect(tabacRuleTemp.actions).toStrictEqual([new TabacAction('device1','device',actionTemp[0].context,2), new TabacAction(actionTemp[1].access,actionTemp[1].type, actionTemp[1].context,2),new TabacAction(actionTemp[2].access,actionTemp[2].type, actionTemp[2].context,2)])
    expect(tabacRuleTemp.position).toBe(2)

    tabacRuleTemp.linkEntityReferences(conf,modules);

    expect(tabacRuleTemp.trigger.itemName).toBe(getItemNameFromModule('1234'))
    expect(tabacRuleTemp.actions[0].linkedDeviceUID).toBe('111');
    expect(tabacRuleTemp.actions[1].hostIp).toStrictEqual(['www.domainServer1.be']);
    expect(tabacRuleTemp.actions[2].hostIp).toStrictEqual(['www.domainServer3.be']);



    let openhabRule = tabacRuleTemp.decode('myBrokerTest');
    let expected = {
        configuration: {},
        triggers: [{
            id:1,
            configuration:{
                itemName: getItemNameFromModule('1234'),
                state: '1'
            },
            type: 'core.ItemStateUpdateTrigger'
        }],
        conditions: [],
        actions: [{
            id:2,
            configuration:{
                topic: getModuleAuthTopic('1234'),
                value: "[{\"period\":\"4\",\"type\":\"device\",\"access\":\"device1\",\"deviceUID\":\"111\"},{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server1\",\"hostIp\":\"www.domainServer1.be\"},{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server3\",\"hostIp\":\"www.domainServer3.be\"}]",
                config: 'myBrokerTest'
            },
            type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
        }]
    }
    expect(tabacRuleTemp.position).toBe(3)

    expect(openhabRule).toStrictEqual({name:"test",openhabRule:expected})
})

test('tabacRule test 1 device 2 server, updated trigger', async () => {
    let actionTemp=[
        {
            access:'device1',
            type:'device',
            context:{
                period:'4',
                concern:'module1'
            }
        },
        {
            access: 'NetworkClient',
            type:'service',
            context: {
                'period': '5',
                'host': ['server1','server3'],
                concern:'module1'
            }
        }
    ]
    let triggerTemp = {
        event: "mqtt.module1",
        context: "updated",
        value:'1'
    }
    let tabacRuleTemp = new TabacRule('test',triggerTemp, [], actionTemp);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344'),new Server('server2','www.domainServer2.be','description','3345'),new Server('server3','www.domainServer3.be','description','3346')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234')]
    
    expect(tabacRuleTemp.trigger).toStrictEqual(new TabacTrigger('mqtt.module1', 'updated','1',1));
    expect(tabacRuleTemp.conditions).toStrictEqual([]);
    expect(tabacRuleTemp.actions).toStrictEqual([new TabacAction('device1','device',actionTemp[0].context,2), new TabacAction(actionTemp[1].access,actionTemp[1].type, actionTemp[1].context,2)])
    expect(tabacRuleTemp.position).toBe(2)

    tabacRuleTemp.linkEntityReferences(conf,modules);

    expect(tabacRuleTemp.trigger.itemName).toBe(getItemNameFromModule('1234'))
    expect(tabacRuleTemp.actions[0].linkedDeviceUID).toBe('111');
    expect(tabacRuleTemp.actions[1].hostIp).toStrictEqual(['www.domainServer1.be','www.domainServer3.be']);



    let openhabRule = tabacRuleTemp.decode('myBrokerTest');
    let expected = {
        configuration: {},
        triggers: [{
            id:1,
            configuration:{
                itemName: getItemNameFromModule('1234'),
                state: '1'
            },
            type: 'core.ItemStateUpdateTrigger'
        }],
        conditions: [],
        actions: [{
            id:2,
            configuration:{
                topic: getModuleAuthTopic('1234'),
                value: "[{\"period\":\"4\",\"type\":\"device\",\"access\":\"device1\",\"deviceUID\":\"111\"},{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server1\",\"hostIp\":\"www.domainServer1.be\"},{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server3\",\"hostIp\":\"www.domainServer3.be\"}]",
                config: 'myBrokerTest'
            },
            type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
        }]
    }
    expect(tabacRuleTemp.position).toBe(3)
    
    expect(openhabRule).toStrictEqual({name:"test",openhabRule:expected})
})

test('tabacRule test 1 device 2 server, updated trigger + condition', async () => {
    let actionTemp=[
        {
            access:'device1',
            type:'device',
            context:{
                period:'4',
                concern:'module1'
            }
        },
        {
            access: 'NetworkClient',
            type:'service',
            context: {
                'period': '5',
                'host': ['server1','server3'],
                concern:'module1'
            }
        }
    ]
    let conditonTemp = [
        {
            name:'testCodition',
            description: 'testDescription',
            if:{
                event: 'mqtt.module2',
                context:'equals',
                value: 'ValueTest'
            }
            
        }
    ]
    let triggerTemp = {
        event: "mqtt.module1",
        context: "updated",
        value:'1'
    }
    let tabacRuleTemp = new TabacRule('test',triggerTemp, conditonTemp, actionTemp);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344'),new Server('server2','www.domainServer2.be','description','3345'),new Server('server3','www.domainServer3.be','description','3346')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234'),new Module('module2','type2','desc','1235')]
    
    expect(tabacRuleTemp.trigger).toStrictEqual(new TabacTrigger('mqtt.module1', 'updated','1',1));
    expect(tabacRuleTemp.conditions).toStrictEqual([new TabacTrigger('mqtt.module2', 'equals', 'ValueTest',2)]);
    expect(tabacRuleTemp.actions).toStrictEqual([new TabacAction('device1','device',actionTemp[0].context,3), new TabacAction(actionTemp[1].access,actionTemp[1].type, actionTemp[1].context,3)])
    expect(tabacRuleTemp.position).toBe(3)

    tabacRuleTemp.linkEntityReferences(conf,modules);

    expect(tabacRuleTemp.trigger.itemName).toBe(getItemNameFromModule('1234'))
    expect(tabacRuleTemp.conditions[0].itemName).toBe(getItemNameFromModule('1235'))
    expect(tabacRuleTemp.actions[0].linkedDeviceUID).toBe('111');
    expect(tabacRuleTemp.actions[1].hostIp).toStrictEqual(['www.domainServer1.be','www.domainServer3.be']);
    //expect(tabacRuleTemp.actions[1].hostPort).toStrictEqual(['1334','1336']);



    let openhabRule = tabacRuleTemp.decode('myBrokerTest');
    let expected = {
        configuration: {},
        triggers: [{
            id:1,
            configuration:{
                itemName: getItemNameFromModule('1234'),
                state: '1'
            },
            type: 'core.ItemStateUpdateTrigger'
        }],
        conditions: [{
            inputs:{},
            id:2,
            configuration:{
                itemName: getItemNameFromModule('1235'),
                operator: '=',
                state: 'ValueTest'
            },
            type: 'core.ItemStateCondition'
        }],
        actions: [{
            id:3,
            configuration:{
                topic: getModuleAuthTopic('1234'),
                value: "[{\"period\":\"4\",\"type\":\"device\",\"access\":\"device1\",\"deviceUID\":\"111\"},{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server1\",\"hostIp\":\"www.domainServer1.be\"},{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server3\",\"hostIp\":\"www.domainServer3.be\"}]",
                config: 'myBrokerTest'
            },
            type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
        }]
    }
    expect(tabacRuleTemp.position).toBe(4)
    expect(openhabRule).toStrictEqual({name:"test",openhabRule:expected})
})

test('tabacRule test 1 device 2 server, updated trigger + all condition', async () => {
    let actionTemp=[
        {
            access:'device1',
            type:'device',
            context:{
                period:'4',
                concern:'module1'
            }
        },
        {
            access: 'NetworkClient',
            type:'service',
            context: {
                'period': '5',
                'host': ['server1','server3'],
                concern:'module2'
            }
        }
    ]
    let conditonTemp = [
        {
            name:'testCodition',
            description: 'testDescription',
            if:{
                event: 'mqtt.module2',
                context:'equals',
                value: 'ValueTest'
            }
            
        },
        {
            name:'testCodition',
            description: 'testDescription',
            if:{
                event: 'mqtt.module2',
                context:'not equals',
                value: 'ValueTest'
            }
            
        },
        {
            name:'testCodition',
            description: 'testDescription',
            if:{
                event: 'mqtt.module2',
                context:'lower',
                value: 'ValueTest'
            }
            
        },
        {
            name:'testCodition',
            description: 'testDescription',
            if:{
                event: 'mqtt.module2',
                context:'lower or equals',
                value: 'ValueTest'
            }
            
        },
        {
            name:'testCodition',
            description: 'testDescription',
            if:{
                event: 'mqtt.module2',
                context:'not lower',
                value: 'ValueTest'
            }
            
        },
        {
            name:'testCodition',
            description: 'testDescription',
            if:{
                event: 'mqtt.module2',
                context:'not lower or equals',
                value: 'ValueTest'
            }
            
        },
        {
            name:'testCodition',
            description: 'testDescription',
            if:{
                event: 'mqtt.module2',
                context:'higher',
                value: 'ValueTest'
            }
            
        },
        {
            name:'testCodition',
            description: 'testDescription',
            if:{
                event: 'mqtt.module2',
                context:'higher or equals',
                value: 'ValueTest'
            }
            
        },
        {
            name:'testCodition',
            description: 'testDescription',
            if:{
                event: 'mqtt.module2',
                context:'not higher',
                value: 'ValueTest'
            }
            
        },
        {
            name:'testCodition',
            description: 'testDescription',
            if:{
                event: 'mqtt.module2',
                context:'not higher or equals',
                value: 'ValueTest'
            }
            
        }
    ]
    let triggerTemp = {
        event: "mqtt.module1",
        context: "updated",
        value:'1'
    }
    let tabacRuleTemp = new TabacRule('test',triggerTemp, conditonTemp, actionTemp);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344'),new Server('server2','www.domainServer2.be','description','3345'),new Server('server3','www.domainServer3.be','description','3346')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234'),new Module('module2','type2','desc','1235')]
    
    expect(tabacRuleTemp.trigger).toStrictEqual(new TabacTrigger('mqtt.module1', 'updated','1',1));
    expect(tabacRuleTemp.conditions).toStrictEqual([new TabacTrigger('mqtt.module2', 'equals', 'ValueTest',2),new TabacTrigger('mqtt.module2', 'not equals', 'ValueTest',3),
        new TabacTrigger('mqtt.module2', 'lower', 'ValueTest',4),new TabacTrigger('mqtt.module2', 'lower or equals', 'ValueTest',5),new TabacTrigger('mqtt.module2', 'not lower', 'ValueTest',6),
        new TabacTrigger('mqtt.module2', 'not lower or equals', 'ValueTest',7),new TabacTrigger('mqtt.module2', 'higher', 'ValueTest',8),new TabacTrigger('mqtt.module2', 'higher or equals', 'ValueTest',9),
        new TabacTrigger('mqtt.module2', 'not higher', 'ValueTest',10),new TabacTrigger('mqtt.module2', 'not higher or equals', 'ValueTest',11)
    ]);
    expect(tabacRuleTemp.actions).toStrictEqual([new TabacAction('device1','device',actionTemp[0].context,12), new TabacAction(actionTemp[1].access,actionTemp[1].type, actionTemp[1].context,12)])
    expect(tabacRuleTemp.position).toBe(12)

    tabacRuleTemp.linkEntityReferences(conf,modules);

    expect(tabacRuleTemp.trigger.itemName).toBe(getItemNameFromModule('1234'))
    for (let i=0;i<10;i++){
        expect(tabacRuleTemp.conditions[0].itemName).toBe(getItemNameFromModule('1235'))
    }
    expect(tabacRuleTemp.actions[0].linkedDeviceUID).toBe('111');
    expect(tabacRuleTemp.actions[1].hostIp).toStrictEqual(['www.domainServer1.be','www.domainServer3.be']);
    //expect(tabacRuleTemp.actions[1].hostPort).toStrictEqual(['1334','1336']);



    let openhabRule = tabacRuleTemp.decode('myBrokerTest');
    let expected = {
        configuration: {},
        triggers: [{
            id:1,
            configuration:{
                itemName: getItemNameFromModule('1234'),
                state: '1'
            },
            type: 'core.ItemStateUpdateTrigger'
        }],
        conditions: [
            {
                inputs:{},
                id:2,
                configuration:{
                    itemName: getItemNameFromModule('1235'),
                    operator: '=',
                    state: 'ValueTest'
                },
                type: 'core.ItemStateCondition'
            },
            {
                inputs:{},
                id:3,
                configuration:{
                    itemName: getItemNameFromModule('1235'),
                    operator: '!=',
                    state: 'ValueTest'
                },
                type: 'core.ItemStateCondition'
            },
            {
                inputs:{},
                id:4,
                configuration:{
                    itemName: getItemNameFromModule('1235'),
                    operator: '<',
                    state: 'ValueTest'
                },
                type: 'core.ItemStateCondition'
            },
            {
                inputs:{},
                id:5,
                configuration:{
                    itemName: getItemNameFromModule('1235'),
                    operator: '<=',
                    state: 'ValueTest'
                },
                type: 'core.ItemStateCondition'
            },
            {
                inputs:{},
                id:6,
                configuration:{
                    itemName: getItemNameFromModule('1235'),
                    operator: '>=',
                    state: 'ValueTest'
                },
                type: 'core.ItemStateCondition'
            },
            {
                inputs:{},
                id:7,
                configuration:{
                    itemName: getItemNameFromModule('1235'),
                    operator: '>',
                    state: 'ValueTest'
                },
                type: 'core.ItemStateCondition'
            },
            {
                inputs:{},
                id:8,
                configuration:{
                    itemName: getItemNameFromModule('1235'),
                    operator: '>',
                    state: 'ValueTest'
                },
                type: 'core.ItemStateCondition'
            },
            {
                inputs:{},
                id:9,
                configuration:{
                    itemName: getItemNameFromModule('1235'),
                    operator: '>=',
                    state: 'ValueTest'
                },
                type: 'core.ItemStateCondition'
            },
            {
                inputs:{},
                id:10,
                configuration:{
                    itemName: getItemNameFromModule('1235'),
                    operator: '<=',
                    state: 'ValueTest'
                },
                type: 'core.ItemStateCondition'
            },
            {
                inputs:{},
                id:11,
                configuration:{
                    itemName: getItemNameFromModule('1235'),
                    operator: '<',
                    state: 'ValueTest'
                },
                type: 'core.ItemStateCondition'
            }
        ],
        actions: [{
            id:12,
            configuration:{
                topic: getModuleAuthTopic('1234'),
                value: "[{\"period\":\"4\",\"type\":\"device\",\"access\":\"device1\",\"deviceUID\":\"111\"}]",
                config: 'myBrokerTest'
            },
            type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
        },
        {
            id:13,
            configuration:{
                topic: getModuleAuthTopic('1235'),
                value: "[{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server1\",\"hostIp\":\"www.domainServer1.be\"},{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server3\",\"hostIp\":\"www.domainServer3.be\"}]",
                config: 'myBrokerTest'
            },
            type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
        }]
    }
    expect(tabacRuleTemp.position).toBe(14)

    expect(openhabRule).toStrictEqual({name:"test",openhabRule:expected})
})

test('tabacRule test 1 device 2 server, DateTime trigger', async () => {
    let actionTemp=[
        {
            access:'device1',
            type:'device',
            context:{
                period:'4',
                concern:'module1'
            }
        },
        {
            access: 'NetworkClient',
            type:'service',
            context: {
                'period': '5',
                'host': ['server1','server3'],
                concern:'module1'
            }
        }
    ]
    let conditonTemp = [
        {
            name:'testCodition',
            description: 'testDescription',
            if:{
                event: 'mqtt.module2',
                context:'equals',
                value: 'ValueTest'
            }
            
        }
    ]
    let triggerTemp = {
        event: "system.time",
        context: "DateTimeTrigger",
        value:'module1'
    }
    let tabacRuleTemp = new TabacRule('test',triggerTemp, conditonTemp, actionTemp);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344'),new Server('server2','www.domainServer2.be','description','3345'),new Server('server3','www.domainServer3.be','description','3346')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234'),new Module('module2','type2','desc','1235')]
    
    expect(tabacRuleTemp.trigger).toStrictEqual(new TabacTrigger('system.time', 'DateTimeTrigger','module1',1));
    expect(tabacRuleTemp.conditions).toStrictEqual([new TabacTrigger('mqtt.module2', 'equals', 'ValueTest',2)]);
    expect(tabacRuleTemp.actions).toStrictEqual([new TabacAction('device1','device',actionTemp[0].context,3), new TabacAction(actionTemp[1].access,actionTemp[1].type, actionTemp[1].context,3)])
    expect(tabacRuleTemp.position).toBe(3)

    tabacRuleTemp.linkEntityReferences(conf,modules);

    expect(tabacRuleTemp.trigger.itemName).toBe(getItemNameFromModule('1234'))
    expect(tabacRuleTemp.conditions[0].itemName).toBe(getItemNameFromModule('1235'))
    expect(tabacRuleTemp.actions[0].linkedDeviceUID).toBe('111');
    expect(tabacRuleTemp.actions[1].hostIp).toStrictEqual(['www.domainServer1.be','www.domainServer3.be']);
    //expect(tabacRuleTemp.actions[1].hostPort).toStrictEqual(['1334','1336']);



    let openhabRule = tabacRuleTemp.decode('myBrokerTest');
    let expected = {
        configuration: {},
        triggers: [{
            id:1,
            configuration:{
                timeOnly: false,
                itemName: getItemNameFromModule('1234')
            },
            type: 'timer.DateTimeTrigger'
        }],
        conditions: [{
            inputs:{},
            id:2,
            configuration:{
                itemName: getItemNameFromModule('1235'),
                operator: '=',
                state: 'ValueTest'
            },
            type: 'core.ItemStateCondition'
        }],
        actions: [{
            id:3,
            configuration:{
                topic: getModuleAuthTopic('1234'),
                value: "[{\"period\":\"4\",\"type\":\"device\",\"access\":\"device1\",\"deviceUID\":\"111\"},{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server1\",\"hostIp\":\"www.domainServer1.be\"},{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server3\",\"hostIp\":\"www.domainServer3.be\"}]",
                config: 'myBrokerTest'
            },
            type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
        }]
    }
    expect(tabacRuleTemp.position).toBe(4)

    expect(openhabRule).toStrictEqual({name:"test",openhabRule:expected})
})

test('tabacRule test 1 device 2 server, time of day trigger', async () => {
    let actionTemp=[
        {
            access:'device1',
            type:'device',
            context:{
                period:'4',
                concern:'module1'
            }
        },
        {
            access: 'NetworkClient',
            type:'service',
            context: {
                'period': '5',
                'host': ['server1','server3'],
                concern:'module1'
            }
        }
    ]
    let conditonTemp = [
        {
            name:'testCodition',
            description: 'testDescription',
            if:{
                event: 'mqtt.module2',
                context:'equals',
                value: 'ValueTest'
            }
            
        }
    ]
    let triggerTemp = {
        event: "system.time",
        context: "TimeOfDayTrigger",
        value:'11:00'
    }
    let tabacRuleTemp = new TabacRule('test',triggerTemp, conditonTemp, actionTemp);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344'),new Server('server2','www.domainServer2.be','description','3345'),new Server('server3','www.domainServer3.be','description','3346')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234'),new Module('module2','type2','desc','1235')]
    
    expect(tabacRuleTemp.trigger).toStrictEqual(new TabacTrigger('system.time', 'TimeOfDayTrigger','11:00',1));
    expect(tabacRuleTemp.conditions).toStrictEqual([new TabacTrigger('mqtt.module2', 'equals', 'ValueTest',2)]);
    expect(tabacRuleTemp.actions).toStrictEqual([new TabacAction('device1','device',actionTemp[0].context,3), new TabacAction(actionTemp[1].access,actionTemp[1].type, actionTemp[1].context,3)])
    expect(tabacRuleTemp.position).toBe(3)

    tabacRuleTemp.linkEntityReferences(conf,modules);

    expect(tabacRuleTemp.conditions[0].itemName).toBe(getItemNameFromModule('1235'))
    expect(tabacRuleTemp.actions[0].linkedDeviceUID).toBe('111');
    expect(tabacRuleTemp.actions[1].hostIp).toStrictEqual(['www.domainServer1.be','www.domainServer3.be']);
    //expect(tabacRuleTemp.actions[1].hostPort).toStrictEqual(['1334','1336']);



    let openhabRule = tabacRuleTemp.decode('myBrokerTest');
    let expected = {
        configuration: {},
        triggers: [{
            id:1,
            configuration:{
                time: '11:00',
            },
            type: 'timer.TimeOfDayTrigger'
        }],
        conditions: [{
            inputs:{},
            id:2,
            configuration:{
                itemName: getItemNameFromModule('1235'),
                operator: '=',
                state: 'ValueTest'
            },
            type: 'core.ItemStateCondition'
        }],
        actions: [{
            id:3,
            configuration:{
                topic: getModuleAuthTopic('1234'),
                value: "[{\"period\":\"4\",\"type\":\"device\",\"access\":\"device1\",\"deviceUID\":\"111\"},{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server1\",\"hostIp\":\"www.domainServer1.be\"},{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server3\",\"hostIp\":\"www.domainServer3.be\"}]",
                config: 'myBrokerTest'
            },
            type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
        }]
    }
    expect(tabacRuleTemp.position).toBe(4)

    expect(openhabRule).toStrictEqual({name:"test",openhabRule:expected})
})

test('tabacRule test 1 device 2 server, generic cron trigger', async () => {
    let actionTemp=[
        {
            access:'device1',
            type:'device',
            context:{
                period:'4',
                concern:'module1'
            }
        },
        {
            access: 'NetworkClient',
            type:'service',
            context: {
                'period': '5',
                'host': ['server1','server3'],
                concern:'module1'
            }
        }
    ]
    let conditonTemp = [
        {
            name:'testCodition',
            description: 'testDescription',
            if:{
                event: 'mqtt.module2',
                context:'equals',
                value: 'ValueTest'
            }
            
        }
    ]
    let triggerTemp = {
        event: "system.time",
        context: "GenericCronTrigger",
        value:'0 0 8 * * ? *'
    }
    let tabacRuleTemp = new TabacRule('test',triggerTemp, conditonTemp, actionTemp);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344'),new Server('server2','www.domainServer2.be','description','3345'),new Server('server3','www.domainServer3.be','description','3346')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234'),new Module('module2','type2','desc','1235')]
    
    expect(tabacRuleTemp.trigger).toStrictEqual(new TabacTrigger('system.time', 'GenericCronTrigger','0 0 8 * * ? *',1));
    expect(tabacRuleTemp.conditions).toStrictEqual([new TabacTrigger('mqtt.module2', 'equals', 'ValueTest',2)]);
    expect(tabacRuleTemp.actions).toStrictEqual([new TabacAction('device1','device',actionTemp[0].context,3), new TabacAction(actionTemp[1].access,actionTemp[1].type, actionTemp[1].context,3)])
    expect(tabacRuleTemp.position).toBe(3)

    tabacRuleTemp.linkEntityReferences(conf,modules);

    expect(tabacRuleTemp.conditions[0].itemName).toBe(getItemNameFromModule('1235'))
    expect(tabacRuleTemp.actions[0].linkedDeviceUID).toBe('111');
    expect(tabacRuleTemp.actions[1].hostIp).toStrictEqual(['www.domainServer1.be','www.domainServer3.be']);
    //expect(tabacRuleTemp.actions[1].hostPort).toStrictEqual(['1334','1336']);



    let openhabRule = tabacRuleTemp.decode('myBrokerTest');
    let expected = {
        configuration: {},
        triggers: [{
            id:1,
            configuration:{
                cronExpression: '0 0 8 * * ? *',
            },
            type: 'timer.GenericCronTrigger'
        }],
        conditions: [{
            inputs:{},
            id:2,
            configuration:{
                itemName: getItemNameFromModule('1235'),
                operator: '=',
                state: 'ValueTest'
            },
            type: 'core.ItemStateCondition'
        }],
        actions: [{
            id:3,
            configuration:{
                topic: getModuleAuthTopic('1234'),
                value: "[{\"period\":\"4\",\"type\":\"device\",\"access\":\"device1\",\"deviceUID\":\"111\"},{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server1\",\"hostIp\":\"www.domainServer1.be\"},{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server3\",\"hostIp\":\"www.domainServer3.be\"}]",                config: 'myBrokerTest'
            },
            type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
        }]
    }
    expect(tabacRuleTemp.position).toBe(4)

    expect(openhabRule).toStrictEqual({name:'test',openhabRule:expected})
})

test('tabacRule test 1 device 2 server, action concern', async () => {
    let actionTemp=[
        {
            access:'pass_through',
            type:'flow',
            context:{
                concern: 'module2',
                value: 'valueTest'
            }
        },
        {
            access: 'NetworkClient',
            type:'service',
            context: {
                'period': '5',
                'host': ['server1','server3'],
                concern: 'module1'
            }
        }
    ]
    let conditonTemp = [
        {
            name:'testCodition',
            description: 'testDescription',
            if:{
                event: 'mqtt.module2',
                context:'equals',
                value: 'ValueTest'
            }
            
        }
    ]
    let triggerTemp = {
        event: "system.time",
        context: "GenericCronTrigger",
        value:'0 0 8 * * ? *'
    }
    let tabacRuleTemp = new TabacRule('test',triggerTemp, conditonTemp, actionTemp);
    let devices = [new Device('device1','111','description','type1','112233')]
    let servers = [new Server('server1','www.domainServer1.be','description','3344'),new Server('server2','www.domainServer2.be','description','3345'),new Server('server3','www.domainServer3.be','description','3346')]
    let conf = new Configuration()
    conf.setDevices(devices)
    conf.setServers(servers)
    let modules = [new Module('module1','type1','desc','1234'),new Module('module2','type2','desc','1235')]
    
    expect(tabacRuleTemp.trigger).toStrictEqual(new TabacTrigger('system.time', 'GenericCronTrigger','0 0 8 * * ? *',1));
    expect(tabacRuleTemp.conditions).toStrictEqual([new TabacTrigger('mqtt.module2', 'equals', 'ValueTest',2)]);
    expect(tabacRuleTemp.actions).toStrictEqual([new TabacAction('pass_through','flow',actionTemp[0].context,3), new TabacAction(actionTemp[1].access,actionTemp[1].type, actionTemp[1].context,3)])
    expect(tabacRuleTemp.position).toBe(3)

    tabacRuleTemp.linkEntityReferences(conf,modules);

    expect(tabacRuleTemp.conditions[0].itemName).toBe(getItemNameFromModule('1235'))
    expect(tabacRuleTemp.actions[0].concernModuleID).toBe('1235');
    expect(tabacRuleTemp.actions[1].hostIp).toStrictEqual(['www.domainServer1.be','www.domainServer3.be']);
    //expect(tabacRuleTemp.actions[1].hostPort).toStrictEqual(['1334','1336']);

    let openhabRule = tabacRuleTemp.decode('myBrokerTest');
    let expected = {
        configuration: {},
        triggers: [{
            id:1,
            configuration:{
                cronExpression: '0 0 8 * * ? *',
            },
            type: 'timer.GenericCronTrigger'
        }],
        conditions: [{
            inputs:{},
            id:2,
            configuration:{
                itemName: getItemNameFromModule('1235'),
                operator: '=',
                state: 'ValueTest'
            },
            type: 'core.ItemStateCondition'
        }],
        actions: [
            {
                id:3,
                configuration:{
                    topic: getModuleSupervTopic('1235'),
                    value: 'valueTest',
                    config: 'myBrokerTest'
                },
                type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
            },
            {
            id:4,
            configuration:{
                topic: getModuleAuthTopic('1234'),
                value: "[{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server1\",\"hostIp\":\"www.domainServer1.be\"},{\"period\":\"5\",\"type\":\"service\",\"access\":\"NetworkClient\",\"server\":\"server3\",\"hostIp\":\"www.domainServer3.be\"}]",
                config: 'myBrokerTest'
            },
            type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
        }]
    }
    expect(tabacRuleTemp.position).toBe(5)

    expect(openhabRule).toStrictEqual({name:"test",openhabRule:expected})
})

