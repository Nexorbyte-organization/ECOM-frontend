import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../lib/toast.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
const { toast, toastStore, withFeedback } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

function browser(t) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
    Object.defineProperty(globalThis, 'window', { value: {}, configurable: true });
    t.after(() => { if (previous) Object.defineProperty(globalThis, 'window', previous); else delete globalThis.window; });
    toastStore.getSnapshot().forEach(({ id }) => toast.dismiss(id));
}

test('server rendering stays silent and has a stable empty snapshot', async () => {
    toast.success('server notice');
    assert.deepEqual(toastStore.getServerSnapshot(), []);
    assert.equal(toastStore.getServerSnapshot(), toastStore.getServerSnapshot());
    const save = withFeedback(async () => 'saved', 'saved on server');
    assert.equal(await save(), 'saved');
    assert.deepEqual(toastStore.getSnapshot(), []);
});

test('success waits until the complete action resolves and preserves its result', async (t) => {
    browser(t);
    let finish;
    const action = withFeedback(() => new Promise((resolve) => { finish = resolve; }), 'profile saved');
    const pending = action();
    assert.deepEqual(toastStore.getSnapshot(), []);
    const result = { id: 'profile-1' };
    finish(result);
    assert.equal(await pending, result);
    assert.equal(toastStore.getSnapshot()[0].tone, 'success');
});

test('a failed second step emits only error feedback and rethrows the original error', async (t) => {
    browser(t);
    const error = new Error('Photo upload failed');
    const save = withFeedback(async () => { await Promise.resolve('fields saved'); throw error; }, 'should not be shown');
    await assert.rejects(save(), (caught) => caught === error);
    assert.deepEqual(toastStore.getSnapshot().map(({ tone, message }) => ({ tone, message })), [{ tone: 'error', message: error.message }]);
});

test('duplicate errors from an action and its UI catch appear only once', (t) => {
    browser(t);
    toast.error('duplicate error');
    toast.error('duplicate error');
    assert.equal(toastStore.getSnapshot().length, 1);
});

test('queue is bounded, publishes updates, and dismisses only the requested toast', (t) => {
    browser(t);
    let updates = 0;
    const unsubscribe = toastStore.subscribe(() => updates++);
    for (let i = 0; i < 4; i++) toast.info(`bounded notice ${i}`);
    assert.equal(toastStore.getSnapshot().length, 3);
    const id = toastStore.getSnapshot()[1].id;
    toast.dismiss(id);
    assert.equal(toastStore.getSnapshot().length, 2);
    assert.equal(toastStore.getSnapshot().some((notice) => notice.id === id), false);
    assert.equal(updates, 5);
    unsubscribe();
    toast.info('after unsubscribe');
    assert.equal(updates, 5);
});

test('localized messages remain structured for the current display language', (t) => {
    browser(t);
    const message = { en: 'Saved', ar: 'تم الحفظ', 'ar-eg': 'اتحفظ' };
    toast.success(message);
    assert.equal(toastStore.getSnapshot()[0].message, message);
});
