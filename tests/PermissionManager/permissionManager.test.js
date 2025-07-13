import { test, expect } from "vitest";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import permissionManager from "../../src/permissionManager/PermissionManager";
import { access } from "fs";
import Permission from "../../src/model/Permission";
import Device from "../../src/model/Device";
import Server from "../../src/model/Server";
import { setTimeout } from "timers/promises";
test('Permission manager set modules ID', () => {

    expect(permissionManager.moduleIds).toStrictEqual(null);
    expect(permissionManager.permissions).toStrictEqual(new Map());

    const moduleIds = ['id1','id2','id3','id4','id5'];
    permissionManager.setModulesIds(moduleIds);
    
    expect(permissionManager.moduleIds).toStrictEqual(moduleIds);
    let expected = new Map();
    expected.set('id1',[]);
    expected.set('id2',[]);
    expected.set('id3',[]);
    expected.set('id4',[]);
    expected.set('id5',[]);
    expect(permissionManager.permissions).toStrictEqual(expected)

    //expect(() => app.checkConfigurationFileStructure(confPath)).not.toThrowError();
});

test('PermissionManager add new permission', () => {
    const moduleIds = ['id1','id2','id3','id4','id5'];
    const auths = [
        {
            period: '10',
            type:'device',
            access: 'device1',
            deviceUID: 'deviceID1',
        },
        {
            period: '11',
            type: 'service',
            access: 'NetworkClient',
            server: 'server1',
            hostIp: 'www.domain.be',

        }
    ]
    const message = JSON.stringify(auths);
    permissionManager.moduleIds = null;
    permissionManager.permissions = new Map()
    permissionManager.setModulesIds(moduleIds);
    permissionManager.addNewPermission(message, 'id1')
    expect(permissionManager.moduleIds).toStrictEqual(moduleIds);
    let expected = new Map();
    expected.set('id1',[
        new Permission('10',null,new Device(
            'device1','deviceID1','', 'deviceForPermission'
        )),
        new Permission(
            '11', new Server(
                'server1','www.domain.be',''
            )
        )
    ]);
    expected.set('id2',[]);
    expected.set('id3',[]);
    expected.set('id4',[]);
    expected.set('id5',[]);
    expected.get('id1')[0].end = 0;
    expected.get('id1')[1].end = 0;
    permissionManager.permissions.get('id1')[0].start = expected.get('id1')[0].start;
    permissionManager.permissions.get('id1')[1].start = expected.get('id1')[1].start;

    permissionManager.permissions.get('id1')[0].end = 0;
    permissionManager.permissions.get('id1')[1].end = 0;
    expect(permissionManager.permissions).toStrictEqual(expected);

})

test('PermissionManager add all different permission', () => {
    const moduleIds = ['id1','id2','id3','id4','id5'];
    const auths = [
        {
            period: '10',
            type:'device',
            access: 'device1',
            deviceUID: 'deviceID1',
        },
        {
            period: '11',
            type: 'service',
            access: 'NetworkClient',
            server: 'server1',
            hostIp: 'www.domain.be',

        },
        {
            period: '12',
            type: 'service',
            access: 'NetworkClient',
            server: 'all',
            hostIp: '',
        },
        {
            period: '-13',
            type: 'service',
            access: 'NetworkClient',
            server: 'server2',
            hostIp: 'www.domain2.be',
        }
    ]
    const message = JSON.stringify(auths);
    permissionManager.moduleIds = null;
    permissionManager.permissions = new Map()
    permissionManager.setModulesIds(moduleIds);
    permissionManager.addNewPermission(message, 'id1')
    expect(permissionManager.moduleIds).toStrictEqual(moduleIds);
    let expected = new Map();
    expected.set('id1',[
        new Permission('10',null,new Device(
            'device1','deviceID1','', 'deviceForPermission'
        )),
        new Permission(
            '11', new Server(
                'server1','www.domain.be',''
            )
        ),
        new Permission(
            '12', new Server(
                'all','',''
            )
        ),
        new Permission(
            '-13', new Server(
                'server2','www.domain2.be',''
            )
        )
    ]);
    expected.set('id2',[]);
    expected.set('id3',[]);
    expected.set('id4',[]);
    expected.set('id5',[]);

    expect(permissionManager.permissions.get('id1')[0].isInfinite).toBeFalsy();
    expect(permissionManager.permissions.get('id1')[0].duration).toBe(10);
    expect(permissionManager.permissions.get('id1')[0].isServerAll).toBeFalsy();
    expect(permissionManager.permissions.get('id1')[0].isServer).toBeFalsy();
    expect(permissionManager.permissions.get('id1')[0].isDevice).toBeTruthy();

    expect(permissionManager.permissions.get('id1')[1].isInfinite).toBeFalsy();
    expect(permissionManager.permissions.get('id1')[1].duration).toBe(11);
    expect(permissionManager.permissions.get('id1')[1].isServerAll).toBeFalsy();
    expect(permissionManager.permissions.get('id1')[1].isServer).toBeTruthy();
    expect(permissionManager.permissions.get('id1')[1].isDevice).toBeFalsy();

    expect(permissionManager.permissions.get('id1')[2].isInfinite).toBeFalsy();
    expect(permissionManager.permissions.get('id1')[2].duration).toBe(12);
    expect(permissionManager.permissions.get('id1')[2].isServerAll).toBeTruthy();
    expect(permissionManager.permissions.get('id1')[2].isServer).toBeTruthy();
    expect(permissionManager.permissions.get('id1')[2].isDevice).toBeFalsy();

    expect(permissionManager.permissions.get('id1')[3].isInfinite).toBeTruthy();
    expect(permissionManager.permissions.get('id1')[3].duration).toBe(0);
    expect(permissionManager.permissions.get('id1')[3].isServerAll).toBeFalsy();
    expect(permissionManager.permissions.get('id1')[3].isServer).toBeTruthy();
    expect(permissionManager.permissions.get('id1')[3].isDevice).toBeFalsy();


})



test('PermissionManager add isServerPermitted', () => {
    const moduleIds = ['id1','id2','id3','id4','id5'];
    const auths = [
        {
            period: '10',
            type:'device',
            access: 'device1',
            deviceUID: 'deviceID1',
        },
        {
            period: '1200',
            type: 'service',
            access: 'NetworkClient',
            server: 'server1',
            hostIp: 'www.domain.be',

        },
        {
            period: '1',
            type: 'service',
            access: 'NetworkClient',
            server: 'server2',
            hostIp: 'www.domain2.be',

        }
    ]
    const message = JSON.stringify(auths);
    permissionManager.moduleIds = null;
    permissionManager.permissions = new Map()
    permissionManager.setModulesIds(moduleIds);
    permissionManager.addNewPermission(message, 'id1')
    expect(permissionManager.moduleIds).toStrictEqual(moduleIds);
    
    const f = async () => {
        await setTimeout(1000);
        expect(permissionManager.isServerPermitted('www.domain2.be','id1')).toBeTruthy();
    }
    f();
    expect(permissionManager.isServerPermitted('www.domain.be','id1')).toBeTruthy();
    expect(permissionManager.isServerPermitted('www.domain12.be','id1')).toBeFalsy();
})

test('PermissionManager add isServerPermitted', () => {
    const moduleIds = ['id1','id2','id3','id4','id5'];
    const auths = [
        {
            period: '10',
            type:'device',
            access: 'device1',
            deviceUID: 'deviceID1',
        },
        {
            period: '1200',
            type: 'service',
            access: 'NetworkClient',
            server: 'server1',
            hostIp: 'www.domain.be',

        },
        {
            period: '1',
            type: 'service',
            access: 'NetworkClient',
            server: 'server2',
            hostIp: 'www.domain2.be',

        },
        {
            period: '-1',
            type: 'service',
            access: 'NetworkClient',
            server: 'server3',
            hostIp: 'www.domain3.be',

        },
        {
            period: '600',
            type: 'service',
            access: 'NetworkClient',
            server: 'all',
            hostIp: '',

        }
    ]
    const message = JSON.stringify(auths);
    permissionManager.moduleIds = null;
    permissionManager.permissions = new Map()
    permissionManager.setModulesIds(moduleIds);
    permissionManager.addNewPermission(message, 'id1')
    expect(permissionManager.moduleIds).toStrictEqual(moduleIds);
    
    expect(permissionManager.isServerPermitted('www.domain3.be','id1')).toBeTruthy();
    expect(permissionManager.isServerPermitted('www.domain80.be','id1')).toBeTruthy();
})

test('PermissionManager add isServerPermitted', () => {
    const moduleIds = ['id1','id2','id3','id4','id5'];
    const auths = [
        {
            period: '10',
            type:'device',
            access: 'device1',
            deviceUID: 'deviceID1',
        },
        {
            period: '1200',
            type: 'service',
            access: 'NetworkClient',
            server: 'server1',
            hostIp: 'www.domain.be',

        },
        {
            period: '1',
            type: 'service',
            access: 'NetworkClient',
            server: 'server2',
            hostIp: 'www.domain2.be',

        },
        {
            period: '-1',
            type: 'service',
            access: 'NetworkClient',
            server: 'server3',
            hostIp: 'www.domain3.be',

        },
        {
            period: '600',
            type: 'service',
            access: 'NetworkClient',
            server: 'all',
            hostIp: '',

        }
    ]
    const message = JSON.stringify(auths);
    permissionManager.moduleIds = null;
    permissionManager.permissions = new Map()
    permissionManager.setModulesIds(moduleIds);
    permissionManager.addNewPermission(message, 'id1')
    expect(permissionManager.moduleIds).toStrictEqual(moduleIds);
    const f = async () => {
        await setTimeout(1000);
        expect(permissionManager.isServerPermitted('www.domain2.be','id1')).toBeTruthy();
    }
    f();
    expect(permissionManager.isServerPermitted('www.domain3.be','id1')).toBeTruthy();
    expect(permissionManager.isServerPermitted('www.domain80.be','id1')).toBeTruthy();
})