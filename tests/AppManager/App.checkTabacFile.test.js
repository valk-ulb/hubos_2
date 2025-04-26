import App from "../../src/model/App.js";
import { test, expect } from "vitest";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import IncorrectJsonStructureError from "../../src/error/IncorrectJsonStructureError.js";

const __filename = fileURLToPath(import.meta.url);
const __rootDirname = dirname(__filename);
const testFilesDir = join(__rootDirname, '../testFiles');

test('checkAppTabacFileStructure correct format', () => {
    const confPath = join(testFilesDir, 'tabac/tabacCorrect.json');
    const app = new App("");
    expect(() => app.checkAppTabacFileStructure(confPath)).not.toThrowError(IncorrectJsonStructureError);
})

let jsonFile = 'Name';

test('checkAppTabacFileStructure correct format - name', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkAppTabacFileStructure correct format value - name', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}Value.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'Description';

test('checkAppTabacFileStructure correct format - description', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkAppTabacFileStructure correct format value - description', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}Value.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'When';

test('checkAppTabacFileStructure correct format - when', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'WhenEvent';

test('checkAppTabacFileStructure correct format - when/event', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkAppTabacFileStructure correct format value - when/event', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}Value.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'WhenContext';

test('checkAppTabacFileStructure correct format - when/context', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkAppTabacFileStructure correct format value - when/context', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}Value.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'WhenValue';

test('checkAppTabacFileStructure correct format - when/value', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkAppTabacFileStructure correct format value - when/value', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}Value.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'Condition';

test('checkAppTabacFileStructure correct format - condition', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'ConditionName';

test('checkAppTabacFileStructure correct format - condition/name', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkAppTabacFileStructure correct format value - condition/name', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}Value.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'ConditionDescription';

test('checkAppTabacFileStructure correct format - condition/description', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkAppTabacFileStructure correct format value - condition/description', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}Value.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'ConditionIf';

test('checkAppTabacFileStructure correct format - condition/if', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'ConditionIfEvent';

test('checkAppTabacFileStructure correct format - condition/if/event', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkAppTabacFileStructure correct format value - condition/if/event', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}Value.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'ConditionIfContext';

test('checkAppTabacFileStructure correct format - condition/if/context', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkAppTabacFileStructure correct format value - condition/if/context', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}Value.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'ConditionIfValue';

test('checkAppTabacFileStructure correct format - condition/if/value', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkAppTabacFileStructure correct format value - condition/if/value', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}Value.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'ConditionThen';

test('checkAppTabacFileStructure correct format - condition/then', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'ConditionThenAccess';

test('checkAppTabacFileStructure correct format - condition/then/access', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkAppTabacFileStructure correct format value - condition/then/access', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}Value.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'ConditionThenType';

test('checkAppTabacFileStructure correct format - condition/then/type', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkAppTabacFileStructure correct format value - condition/then/type', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}Value.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'ThenContext';

test('checkAppTabacFileStructure correct format - condition/then/context', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

jsonFile = 'ThenContextPeriod';

test('checkAppTabacFileStructure correct format - condition/then/context/period', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})

test('checkAppTabacFileStructure correct format value - condition/then/context/period', async () => {
    const confPath = join(testFilesDir, `tabac/tabacCorrect${jsonFile}Value.json`);
    const app = new App("");
    await expect(app.checkAppTabacFileStructure(confPath)).rejects.toThrowError(IncorrectJsonStructureError);
})