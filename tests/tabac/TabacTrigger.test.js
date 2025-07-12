import TabacTrigger from "../../src/tabacManager/TabacTrigger.js";
import { test, expect, vi } from "vitest";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Device from "../../src/model/Device.js";
import Module from "../../src/model/Module.js";
import { getItemNameFromModule } from "../../src/utils/NameUtil";
import TabacError from "../../src/error/TabacError.js";

const __filename = fileURLToPath(import.meta.url);
const __rootDirname = dirname(__filename);
const testFilesDir = join(__rootDirname, '../testFiles');

let triggerTemp = {
    event: "",
    context: "",
    value:""
}

test('tabacTrigger test updated mqtt', async () => {
    let triggerTemp = {
        event: "mqtt.module1",
        context: "updated",
        value:"test"
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]
    expect(tabacTriggerTemp.isEventMqtt).toBeTruthy();
    expect(tabacTriggerTemp.isSystem).toBeFalsy();
    expect(tabacTriggerTemp.isEventDevice).toBeFalsy();
    expect(tabacTriggerTemp.isTime).toBeFalsy();
    expect(tabacTriggerTemp.isDateTimeTriggerTimeOnly).toBeFalsy();
    expect(tabacTriggerTemp.isDateTimeTrigger).toBeFalsy();
    expect(tabacTriggerTemp.isTimeOfDayTrigger).toBeFalsy();
    expect(tabacTriggerTemp.isGenericCronTrigger).toBeFalsy();
    expect(tabacTriggerTemp.eventWithoutPrefix).toBe('module1');

    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBe(getItemNameFromModule('1234'));

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        id:0,
        configuration:{
            itemName: getItemNameFromModule('1234'),
            state: 'test'
        },
        type: 'core.ItemStateUpdateTrigger'
    }
    expect(openhabTrigger).toStrictEqual(expected)

})

test('tabacTrigger test changed mqtt', async () => {
    let triggerTemp = {
        event: "mqtt.module1",
        context: "changed",
        value:["test", "test2"]
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]
    expect(tabacTriggerTemp.isEventMqtt).toBeTruthy();
    expect(tabacTriggerTemp.isSystem).toBeFalsy();
    expect(tabacTriggerTemp.isEventDevice).toBeFalsy();
    expect(tabacTriggerTemp.isTime).toBeFalsy();
    expect(tabacTriggerTemp.isDateTimeTriggerTimeOnly).toBeFalsy();
    expect(tabacTriggerTemp.isDateTimeTrigger).toBeFalsy();
    expect(tabacTriggerTemp.isTimeOfDayTrigger).toBeFalsy();
    expect(tabacTriggerTemp.isGenericCronTrigger).toBeFalsy();
    expect(tabacTriggerTemp.eventWithoutPrefix).toBe('module1');

    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBe(getItemNameFromModule('1234'));

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        id:0,
        configuration:{
            itemName: getItemNameFromModule('1234'),
            previousState: 'test',
            state: 'test2'
        },
        type: 'core.ItemStateChangeTrigger'
    }
    expect(openhabTrigger).toStrictEqual(expected)

})

test('tabacTrigger test changed mqtt not exist', async () => {
    let triggerTemp = {
        event: "mqtt.module2",
        context: "changed",
        value:["test", "test2"]
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    expect(() => tabacTriggerTemp.linkEntityReferences(devices,modules)).toThrowError(TabacError)

})

test('tabacTrigger test changed mqtt with one value', async () => {
    let triggerTemp = {
        event: "mqtt.module1",
        context: "changed",
        value:'test'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBe(getItemNameFromModule('1234'));

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        id:0,
        configuration:{
            itemName: getItemNameFromModule('1234'),
            previousState: 't',
            state: 'e'
        },
        type: 'core.ItemStateChangeTrigger'
    }
    expect(openhabTrigger).toStrictEqual(expected)
})

test('tabacTrigger test system.time with DateTimeTriggerTimeOnly', async () => {
    let triggerTemp = {
        event: "system.time",
        context: "DateTimeTriggerTimeOnly",
        value:'module1'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]
    expect(tabacTriggerTemp.isEventMqtt).toBeFalsy();
    expect(tabacTriggerTemp.isSystem).toBeTruthy();
    expect(tabacTriggerTemp.isEventDevice).toBeFalsy();
    expect(tabacTriggerTemp.isTime).toBeTruthy();
    expect(tabacTriggerTemp.isDateTimeTriggerTimeOnly).toBeTruthy();
    expect(tabacTriggerTemp.isDateTimeTrigger).toBeFalsy();
    expect(tabacTriggerTemp.isTimeOfDayTrigger).toBeFalsy();
    expect(tabacTriggerTemp.isGenericCronTrigger).toBeFalsy();
    expect(tabacTriggerTemp.eventWithoutPrefix).toBe('time');

    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBe(getItemNameFromModule('1234'));

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        id:0,
        configuration:{
            timeOnly: true,
            itemName: 'item_1234'
        },
        type: 'timer.DateTimeTrigger'
    }
    expect(openhabTrigger).toStrictEqual(expected)
})

test('tabacTrigger test system.time with DateTimeTriggerTimeOnly not exist', async () => {
    let triggerTemp = {
        event: "system.time",
        context: "DateTimeTriggerTimeOnly",
        value:'device12'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    
    expect(()=>tabacTriggerTemp.linkEntityReferences(devices,modules)).toThrowError(TabacError);
})

test('tabacTrigger test system.time with DateTimeTrigger', async () => {
    let triggerTemp = {
        event: "system.time",
        context: "DateTimeTrigger",
        value:'module1'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    expect(tabacTriggerTemp.isEventMqtt).toBeFalsy();
    expect(tabacTriggerTemp.isSystem).toBeTruthy();
    expect(tabacTriggerTemp.isEventDevice).toBeFalsy();
    expect(tabacTriggerTemp.isTime).toBeTruthy();
    expect(tabacTriggerTemp.isDateTimeTriggerTimeOnly).toBeFalsy();
    expect(tabacTriggerTemp.isDateTimeTrigger).toBeTruthy();
    expect(tabacTriggerTemp.isTimeOfDayTrigger).toBeFalsy();
    expect(tabacTriggerTemp.isGenericCronTrigger).toBeFalsy();
    expect(tabacTriggerTemp.eventWithoutPrefix).toBe('time');


    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBe(getItemNameFromModule('1234'));

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        id:0,
        configuration:{
            timeOnly: false,
            itemName: 'item_1234'
        },
        type: 'timer.DateTimeTrigger'
    }
    expect(openhabTrigger).toStrictEqual(expected)
})

test('tabacTrigger test system.time with TimeOfDayTrigger', async () => {
    let triggerTemp = {
        event: "system.time",
        context: "TimeOfDayTrigger",
        value:'12:00'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    expect(tabacTriggerTemp.isEventMqtt).toBeFalsy();
    expect(tabacTriggerTemp.isSystem).toBeTruthy();
    expect(tabacTriggerTemp.isEventDevice).toBeFalsy();
    expect(tabacTriggerTemp.isTime).toBeTruthy();
    expect(tabacTriggerTemp.isDateTimeTriggerTimeOnly).toBeFalsy();
    expect(tabacTriggerTemp.isDateTimeTrigger).toBeFalsy();
    expect(tabacTriggerTemp.isTimeOfDayTrigger).toBeTruthy();
    expect(tabacTriggerTemp.isGenericCronTrigger).toBeFalsy();
    expect(tabacTriggerTemp.eventWithoutPrefix).toBe('time');

    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBeNull();

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        id:0,
        configuration:{
            time: '12:00',
        },
        type: 'timer.TimeOfDayTrigger'
    }
    expect(openhabTrigger).toStrictEqual(expected)
})

test('tabacTrigger test system.time with GenericCronTrigger', async () => {
    let triggerTemp = {
        event: "system.time",
        context: "GenericCronTrigger",
        value:'0 0 8 * * ? *'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    expect(tabacTriggerTemp.isEventMqtt).toBeFalsy();
    expect(tabacTriggerTemp.isSystem).toBeTruthy();
    expect(tabacTriggerTemp.isEventDevice).toBeFalsy();
    expect(tabacTriggerTemp.isTime).toBeTruthy();
    expect(tabacTriggerTemp.isDateTimeTriggerTimeOnly).toBeFalsy();
    expect(tabacTriggerTemp.isDateTimeTrigger).toBeFalsy();
    expect(tabacTriggerTemp.isTimeOfDayTrigger).toBeFalsy();
    expect(tabacTriggerTemp.isGenericCronTrigger).toBeTruthy();
    expect(tabacTriggerTemp.eventWithoutPrefix).toBe('time');


    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBeNull();

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        id:0,
        configuration:{
            cronExpression: '0 0 8 * * ? *',
        },
        type: 'timer.GenericCronTrigger'
    }
    expect(openhabTrigger).toStrictEqual(expected)
})

test('tabacTrigger test mqtt with equals', async () => {
    let triggerTemp = {
        event: "mqtt.module1",
        context: "equals",
        value:'1'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    expect(tabacTriggerTemp.isOperator()).toBeTruthy();

    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBe(getItemNameFromModule('1234'));

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        inputs:{},
        id:0,
        configuration:{
            itemName: getItemNameFromModule('1234'),
            state: '1',
            operator: '='
        },
        type: "core.ItemStateCondition"
    }
    expect(openhabTrigger).toStrictEqual(expected)
})

test('tabacTrigger test mqtt with not equals', async () => {
    let triggerTemp = {
        event: "mqtt.module1",
        context: "not equals",
        value:'1'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    expect(tabacTriggerTemp.isOperator()).toBeTruthy();

    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBe(getItemNameFromModule('1234'));

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        inputs:{},
        id:0,
        configuration:{
            itemName: getItemNameFromModule('1234'),
            state: '1',
            operator: '!='
        },
        type: "core.ItemStateCondition"
    }
    expect(openhabTrigger).toStrictEqual(expected)
})

test('tabacTrigger test mqtt with higher', async () => {
    let triggerTemp = {
        event: "mqtt.module1",
        context: "higher",
        value:'12'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    expect(tabacTriggerTemp.isOperator()).toBeTruthy();

    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBe(getItemNameFromModule('1234'));

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        inputs:{},
        id:0,
        configuration:{
            itemName: getItemNameFromModule('1234'),
            state: '12',
            operator: '>'
        },
        type: "core.ItemStateCondition"
    }
    expect(openhabTrigger).toStrictEqual(expected)
})

test('tabacTrigger test mqtt with higher or equals', async () => {
    let triggerTemp = {
        event: "mqtt.module1",
        context: "higher or equals",
        value:'1'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    expect(tabacTriggerTemp.isOperator()).toBeTruthy();

    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBe(getItemNameFromModule('1234'));

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        inputs:{},
        id:0,
        configuration:{
            itemName: getItemNameFromModule('1234'),
            state: '1',
            operator: '>='
        },
        type: "core.ItemStateCondition"
    }
    expect(openhabTrigger).toStrictEqual(expected)
})

test('tabacTrigger test mqtt with not higher', async () => {
    let triggerTemp = {
        event: "mqtt.module1",
        context: "not higher",
        value:'1'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    expect(tabacTriggerTemp.isOperator()).toBeTruthy();

    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBe(getItemNameFromModule('1234'));

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        inputs:{},
        id:0,
        configuration:{
            itemName: getItemNameFromModule('1234'),
            state: '1',
            operator: '<='
        },
        type: "core.ItemStateCondition"
    }
    expect(openhabTrigger).toStrictEqual(expected)
})

test('tabacTrigger test mqtt with not higher or equals', async () => {
    let triggerTemp = {
        event: "mqtt.module1",
        context: "not higher or equals",
        value:'1'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    expect(tabacTriggerTemp.isOperator()).toBeTruthy();

    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBe(getItemNameFromModule('1234'));

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        inputs:{},
        id:0,
        configuration:{
            itemName: getItemNameFromModule('1234'),
            state: '1',
            operator: '<'
        },
        type: "core.ItemStateCondition"
    }
    expect(openhabTrigger).toStrictEqual(expected)
})

test('tabacTrigger test mqtt with lower', async () => {
    let triggerTemp = {
        event: "mqtt.module1",
        context: "lower",
        value:'1'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    expect(tabacTriggerTemp.isOperator()).toBeTruthy();

    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBe(getItemNameFromModule('1234'));

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        inputs:{},
        id:0,
        configuration:{
            itemName: getItemNameFromModule('1234'),
            state: '1',
            operator: '<'
        },
        type: "core.ItemStateCondition"
    }
    expect(openhabTrigger).toStrictEqual(expected)
})

test('tabacTrigger test mqtt with not lower', async () => {
    let triggerTemp = {
        event: "mqtt.module1",
        context: "not lower",
        value:'1'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    expect(tabacTriggerTemp.isOperator()).toBeTruthy();

    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBe(getItemNameFromModule('1234'));

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        inputs:{},
        id:0,
        configuration:{
            itemName: getItemNameFromModule('1234'),
            state: '1',
            operator: '>='
        },
        type: "core.ItemStateCondition"
    }
    expect(openhabTrigger).toStrictEqual(expected)
})

test('tabacTrigger test mqtt with lower or equals', async () => {
    let triggerTemp = {
        event: "mqtt.module1",
        context: "lower or equals",
        value:'1'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    expect(tabacTriggerTemp.isOperator()).toBeTruthy();

    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBe(getItemNameFromModule('1234'));

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        inputs:{},
        id:0,
        configuration:{
            itemName: getItemNameFromModule('1234'),
            state: '1',
            operator: '<='
        },
        type: "core.ItemStateCondition"
    }
    expect(openhabTrigger).toStrictEqual(expected)
})

test('tabacTrigger test mqtt with not lower or equals', async () => {
    let triggerTemp = {
        event: "mqtt.module1",
        context: "not lower or equals",
        value:'1'
    }
    let tabacTriggerTemp = new TabacTrigger(triggerTemp.event,triggerTemp.context,triggerTemp.value,0);
    let devices = [new Device('device1','111','description','type1','112233')]
    let modules = [new Module('module1','type1','desc','1234')]

    expect(tabacTriggerTemp.isOperator()).toBeTruthy();

    tabacTriggerTemp.linkEntityReferences(devices,modules);
    expect(tabacTriggerTemp.itemName).toBe(getItemNameFromModule('1234'));

    let openhabTrigger = tabacTriggerTemp.decodeTabac();
    const expected = {
        inputs:{},
        id:0,
        configuration:{
            itemName: getItemNameFromModule('1234'),
            state: '1',
            operator: '>'
        },
        type: "core.ItemStateCondition"
    }
    expect(openhabTrigger).toStrictEqual(expected)
})