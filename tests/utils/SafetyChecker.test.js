import {isSafeName, isSafeUID, isHost, isNumber, isSafeContext, isSafeText, isSafeType, isSafeValue } from '../../src/utils/SafetyChecker.js'
import { test, expect } from "vitest";

test('isSafeName correct input', () => {
    const val = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-'
    expect(isSafeName(val)).toBeTruthy();
})

test('isSafeName incorrect input', () => {
    const val = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-@/'
    expect(isSafeName(val)).toBeFalsy();
})

test('isSafeUID correct input', () => {
    const val = '123e4567-e89b-12d3-a456-426614174000'
    expect(isSafeUID(val)).toBeTruthy();
})

test('isSafeUID incorrect input', () => {
    const val = '11-11221-22121'
    expect(isSafeUID(val)).toBeFalsy();
})

test('isSafeType correct input', () => {
    const val = 'myType'
    expect(isSafeType(val)).toBeTruthy();
})

test('isSafeType incorrect input', () => {
    const val = 'my type'
    expect(isSafeType(val)).toBeFalsy();
})

test('isSafeValue correct input', () => {
    const val = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .-_,/:'
    expect(isSafeValue(val)).toBeTruthy();
})

test('isSafeValue incorrect input', () => {
    const val = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .-_,/:|'
    expect(isSafeValue(val)).toBeFalsy();
})

test('isSafeContext correct input', () => {
    const contexts = [
        'changed','updated','between','contains',
        'contains any','equals','equals any','higher or equals',
        'higher','lower or equals','lower',
        'not changed','not updated','not between','not contains',
        'not contains any','not equals','not equals any','not higher or equals',
        'not higher','not lower or equals','not lower',
    ];
    contexts.forEach(context => {
        expect(isSafeContext(context)).toBeTruthy();    
    })
})

test('isSafeContext incorrect input', () => {
    const contexts = [
        'changed','updated','between','contains',
        'contains any','equals','equals any','higher or equals',
        'higher','lower or equals','lower',
        'not changed','not updated','not between','not contains',
        'not contains any','not equals','not equals any','not higher or equals',
        'not higher','not lower or equals','not lower',
    ];
    contexts.forEach(context => {
        expect(isSafeContext(context+'NO')).toBeFalsy();    
    })
})

test('isSafeText correct input', () => {
    const val = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .-_,'
    expect(isSafeText(val)).toBeTruthy();
})

test('isSafeText incorrect input', () => {
    const val = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .-_,/:|'
    expect(isSafeText(val)).toBeFalsy();
})

test('isNumber correct input', () => {
    const val = '12345'
    expect(isNumber(val)).toBeTruthy();
})

test('isNumber incorrect input', () => {
    const val = '12345DD'
    expect(isNumber(val)).toBeFalsy();
})

test('isHost correct input', () => {
    const val = 'www.example.com'
    expect(isHost(val)).toBeTruthy();
})

test('isHost incorrect input', () => {
    const val = 'www.example.com/here/\_-@'
    expect(isHost(val)).toBeFalsy();
})