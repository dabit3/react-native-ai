"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.effectScheduler = exports.handleChange = exports.withPointer = exports.withUpdates = exports.readline = exports.withHooks = void 0;
const node_async_hooks_1 = require("node:async_hooks");
const hookStorage = new node_async_hooks_1.AsyncLocalStorage();
function createStore(rl) {
    const store = {
        rl,
        hooks: [],
        hooksCleanup: [],
        hooksEffect: [],
        index: 0,
        handleChange() { },
    };
    return store;
}
// Run callback in with the hook engine setup.
function withHooks(rl, cb) {
    const store = createStore(rl);
    return hookStorage.run(store, () => {
        cb(store);
    });
}
exports.withHooks = withHooks;
// Safe getStore utility that'll return the store or throw if undefined.
function getStore() {
    const store = hookStorage.getStore();
    if (!store) {
        throw new Error('[Inquirer] Hook functions can only be called from within a prompt');
    }
    return store;
}
function readline() {
    return getStore().rl;
}
exports.readline = readline;
// Merge state updates happening within the callback function to avoid multiple renders.
function withUpdates(fn) {
    const wrapped = (...args) => {
        const store = getStore();
        let shouldUpdate = false;
        const oldHandleChange = store.handleChange;
        store.handleChange = () => {
            shouldUpdate = true;
        };
        const returnValue = fn(...args);
        if (shouldUpdate) {
            oldHandleChange();
        }
        store.handleChange = oldHandleChange;
        return returnValue;
    };
    return node_async_hooks_1.AsyncResource.bind(wrapped);
}
exports.withUpdates = withUpdates;
function withPointer(cb) {
    const store = getStore();
    const { index } = store;
    const pointer = {
        get() {
            return store.hooks[index];
        },
        set(value) {
            store.hooks[index] = value;
        },
        initialized: index in store.hooks,
    };
    const returnValue = cb(pointer);
    store.index++;
    return returnValue;
}
exports.withPointer = withPointer;
function handleChange() {
    getStore().handleChange();
}
exports.handleChange = handleChange;
exports.effectScheduler = {
    queue(cb) {
        const store = getStore();
        const { index } = store;
        store.hooksEffect.push(() => {
            var _a, _b;
            (_b = (_a = store.hooksCleanup)[index]) === null || _b === void 0 ? void 0 : _b.call(_a);
            const cleanFn = cb(readline());
            if (cleanFn != null && typeof cleanFn !== 'function') {
                throw new Error('useEffect return value must be a cleanup function or nothing.');
            }
            store.hooksCleanup[index] = cleanFn;
        });
    },
    run() {
        const store = getStore();
        withUpdates(() => {
            store.hooksEffect.forEach((effect) => {
                effect();
            });
            // Warning: Clean the hooks before exiting the `withUpdates` block.
            // Failure to do so means an updates would hit the same effects again.
            store.hooksEffect.length = 0;
        })();
    },
};
