"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrompt = void 0;
const readline = __importStar(require("node:readline"));
const type_1 = require("@inquirer/type");
const mute_stream_1 = __importDefault(require("mute-stream"));
const signal_exit_1 = require("signal-exit");
const screen_manager_mjs_1 = __importDefault(require('./screen-manager.js'));
const hook_engine_mjs_1 = require('./hook-engine.js');
// Take an AsyncPromptConfig and resolves all it's values.
function getPromptConfig(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = typeof config.message === 'function' ? config.message() : config.message;
        return Object.assign(Object.assign({}, config), { message: yield message });
    });
}
function createPrompt(view) {
    const prompt = (config, context) => {
        var _a, _b;
        // Default `input` to stdin
        const input = (_a = context === null || context === void 0 ? void 0 : context.input) !== null && _a !== void 0 ? _a : process.stdin;
        // Add mute capabilities to the output
        const output = new mute_stream_1.default();
        output.pipe((_b = context === null || context === void 0 ? void 0 : context.output) !== null && _b !== void 0 ? _b : process.stdout);
        const rl = readline.createInterface({
            terminal: true,
            input,
            output,
        });
        const screen = new screen_manager_mjs_1.default(rl);
        let cancel = () => { };
        const answer = new type_1.CancelablePromise((resolve, reject) => {
            (0, hook_engine_mjs_1.withHooks)(rl, (store) => {
                function checkCursorPos() {
                    screen.checkCursorPos();
                }
                const removeExitListener = (0, signal_exit_1.onExit)((code, signal) => {
                    onExit();
                    reject(new Error(`User force closed the prompt with ${code} ${signal}`));
                });
                function onExit() {
                    try {
                        store.hooksCleanup.forEach((cleanFn) => {
                            cleanFn === null || cleanFn === void 0 ? void 0 : cleanFn();
                        });
                    }
                    catch (err) {
                        reject(err);
                    }
                    if (context === null || context === void 0 ? void 0 : context.clearPromptOnDone) {
                        screen.clean();
                    }
                    else {
                        screen.clearContent();
                    }
                    screen.done();
                    removeExitListener();
                    store.rl.input.removeListener('keypress', checkCursorPos);
                }
                cancel = () => {
                    onExit();
                    reject(new Error('Prompt was canceled'));
                };
                function done(value) {
                    // Delay execution to let time to the hookCleanup functions to registers.
                    setImmediate(() => {
                        onExit();
                        // Finally we resolve our promise
                        resolve(value);
                    });
                }
                function workLoop(resolvedConfig) {
                    store.index = 0;
                    store.handleChange = () => workLoop(resolvedConfig);
                    try {
                        const nextView = view(resolvedConfig, done);
                        const [content, bottomContent] = typeof nextView === 'string' ? [nextView] : nextView;
                        screen.render(content, bottomContent);
                        hook_engine_mjs_1.effectScheduler.run();
                    }
                    catch (err) {
                        onExit();
                        reject(err);
                    }
                }
                // TODO: we should display a loader while we get the default options.
                getPromptConfig(config).then((resolvedConfig) => {
                    workLoop(resolvedConfig);
                    // Re-renders only happen when the state change; but the readline cursor could change position
                    // and that also requires a re-render (and a manual one because we mute the streams).
                    // We set the listener after the initial workLoop to avoid a double render if render triggered
                    // by a state change sets the cursor to the right position.
                    store.rl.input.on('keypress', checkCursorPos);
                }, reject);
            });
        });
        answer.cancel = cancel;
        return answer;
    };
    return prompt;
}
exports.createPrompt = createPrompt;
