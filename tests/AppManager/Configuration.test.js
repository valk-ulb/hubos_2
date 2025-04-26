import Device from "../../src/model/Device.js";
import Configuration from "../../src/model/Configuration.js";
import { test, expect } from "vitest";
import Server from "../../src/model/Server.js";

test('extract devices with correct format', () => {
    const confData = JSON.parse('{"configuration":{"devices":{"myDeviceName":{"UID" : "123e4567-e89b-12d3-a456-426614174000","type" : "myType","description" : "Little description of the device for the user"}},"servers":{}}}')
    const configuration = new Configuration();
    configuration.extractDevices(confData);
    const expected = [new Device('myDeviceName','123e4567-e89b-12d3-a456-426614174000','Little description of the device for the user','myType')]
    expect(configuration.devices).toMatchObject(expected);
})

test('extract devices without correct format', () => {
    const confData = JSON.parse('{"configuration":{"device":{"myDeviceName":{"UID" : "123e4567-e89b-12d3-a456-426614174000","type" : "myType","description" : "Little description of the device for the user"}},"servers":{}}}')
    const configuration = new Configuration();
    expect(()=>configuration.extractDevices(confData)).toThrowError("Cannot convert undefined or null to object");
})

test('extract servers with correct format', () => {
    const confData = JSON.parse('{"configuration":{"devices":{},"servers":{"myServerName":{"host":"myHost", "port":"1234", "description":"little description for the server"}}}}')
    const configuration = new Configuration();
    configuration.extractServers(confData);
    const expected = [new Server('myServerName','myHost','1234','little description for the server')]
    expect(configuration.servers).toMatchObject(expected);
})

test('extract servers without correct format 1', () => {
    const confData = JSON.parse('{"configuration":{"devices":{},"server":{"myServerName":{"host":"myHost", "port":"1234", "description":"little description for the server"}}}}')
    const configuration = new Configuration();
    expect(()=>configuration.extractServers(confData)).toThrowError("Cannot convert undefined or null to object");
})

test('extract servers without correct format 2', () => {
    const confData = JSON.parse('{"configuration":{"devices":{},"servers":{"myServerName":{"hosts":"myHost", "port":"1234", "description":"little description for the server"}}}}')
    const configuration = new Configuration();
    expect(() => configuration.extractDevices(confData)).not.toThrowError("Cannot convert undefined or null to object");
})

test('extract servers without correct format 3', () => {
    const confData = JSON.parse('{"configuration":{"devices":{},"servers":{"myServerName":{"host":"myHost", "pordt":"1234", "description":"little description for the server"}}}}')
    const configuration = new Configuration();
    expect(()=>configuration.extractServers(confData)).not.toThrowError("Cannot convert undefined or null to object");
})


test('extract servers without correct format 5', async () => {
    const confData = JSON.parse('{"configuration":{"devices":{}}}')
    const configuration = new Configuration();
    expect(() => configuration.extractServers(confData)).toThrowError("Cannot convert undefined or null to object");
})