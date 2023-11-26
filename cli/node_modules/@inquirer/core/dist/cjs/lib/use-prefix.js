"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePrefix = void 0;
const chalk_1 = __importDefault(require("chalk"));
const cli_spinners_1 = __importDefault(require("cli-spinners"));
const use_state_mjs_1 = require('./use-state.js');
const use_effect_mjs_1 = require('./use-effect.js');
const spinner = cli_spinners_1.default.dots;
function usePrefix(isLoading = false) {
    const [tick, setTick] = (0, use_state_mjs_1.useState)(0);
    (0, use_effect_mjs_1.useEffect)(() => {
        if (isLoading) {
            const timeout = setTimeout(() => {
                setTick(tick + 1);
            }, spinner.interval);
            return () => clearTimeout(timeout);
        }
    }, [isLoading, tick]);
    if (isLoading) {
        const frame = tick % spinner.frames.length;
        return chalk_1.default.yellow(spinner.frames[frame]);
    }
    return chalk_1.default.green('?');
}
exports.usePrefix = usePrefix;
