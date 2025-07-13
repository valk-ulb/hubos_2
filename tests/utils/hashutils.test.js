import { test, expect } from "vitest";
import { signFileMD5, checkFileMD5 } from "../../src/utils/hashUtil";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Dirent } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __rootDirname = dirname(__filename);
const testFilesDir = join(__rootDirname, '../testFiles');

test('signfile', async () => {
    const tabacPath = join(testFilesDir, 'tabac/tabacCorrect.json');
    const digest = await signFileMD5(tabacPath);
    expect(digest).toEqual('6c1fcdc17b55e06b5224f53de9944a89');
})
