import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../lib/version.ts', import.meta.url), 'utf8');
async function load(version) {
    process.env.NEXT_PUBLIC_APP_VERSION = version;
    const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
    return import(`data:text/javascript;base64,${Buffer.from(`${outputText}\n// ${Math.random()}`).toString('base64')}`);
}

function browser(t, latest) {
    const previous = { window: globalThis.window, fetch: globalThis.fetch };
    globalThis.window = {};
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ version: latest }) });
    t.after(() => { globalThis.window = previous.window; globalThis.fetch = previous.fetch; });
}

test('recognises chunk and server-action errors from stale builds', async () => {
    const { isStaleBuildError } = await load('a');
    const chunk = new Error('Loading chunk 123 failed.');
    chunk.name = 'ChunkLoadError';
    assert.equal(isStaleBuildError(chunk), true);
    assert.equal(isStaleBuildError(new TypeError('Failed to fetch dynamically imported module: /_next/x.js')), true);
    assert.equal(isStaleBuildError(new Error('Failed to load chunk /_next/static/chunks/abc.js')), true);
    assert.equal(isStaleBuildError(new Error('Failed to find Server Action "abc"')), true);
    assert.equal(isStaleBuildError(new Error('Request failed (500)')), false);
    assert.equal(isStaleBuildError(null), false);
});

test('flags an update only when the deployed version differs', async (t) => {
    const same = await load('build-1');
    browser(t, 'build-1');
    assert.equal(await same.checkForNewVersion(), false);
    assert.equal(same.versionStore.getSnapshot(), false);

    const stale = await load('build-1');
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ version: 'build-2' }) });
    let notified = 0;
    stale.versionStore.subscribe(() => { notified += 1; });
    assert.equal(await stale.checkForNewVersion(), true);
    assert.equal(stale.versionStore.getSnapshot(), true);
    assert.equal(notified, 1);
});

test('stays quiet in development and when the check fails', async (t) => {
    const dev = await load('dev');
    browser(t, 'other');
    assert.equal(await dev.checkForNewVersion(), false);

    const offline = await load('build-1');
    globalThis.fetch = async () => { throw new Error('offline'); };
    assert.equal(await offline.checkForNewVersion(), false);
    assert.equal(await offline.reportPossibleStaleBuild(new Error('ChunkLoadError')), true);
});
