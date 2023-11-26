"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useKeypress = void 0;
const use_ref_mjs_1 = require('./use-ref.js');
const use_effect_mjs_1 = require('./use-effect.js');
const hook_engine_mjs_1 = require('./hook-engine.js');
function useKeypress(userHandler) {
    const signal = (0, use_ref_mjs_1.useRef)(userHandler);
    signal.current = userHandler;
    (0, use_effect_mjs_1.useEffect)((rl) => {
        const handler = (0, hook_engine_mjs_1.withUpdates)((_input, event) => {
            signal.current(event, rl);
        });
        rl.input.on('keypress', handler);
        return () => {
            rl.input.removeListener('keypress', handler);
        };
    }, []);
}
exports.useKeypress = useKeypress;
