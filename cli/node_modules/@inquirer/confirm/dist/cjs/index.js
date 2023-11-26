"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const core_1 = require("@inquirer/core");
exports.default = (0, core_1.createPrompt)((config, done) => {
    const { transformer = (answer) => (answer ? 'yes' : 'no') } = config;
    const [status, setStatus] = (0, core_1.useState)('pending');
    const [value, setValue] = (0, core_1.useState)('');
    const prefix = (0, core_1.usePrefix)();
    (0, core_1.useKeypress)((key, rl) => {
        if ((0, core_1.isEnterKey)(key)) {
            let answer = config.default !== false;
            if (/^(y|yes)/i.test(value))
                answer = true;
            else if (/^(n|no)/i.test(value))
                answer = false;
            setValue(transformer(answer));
            setStatus('done');
            done(answer);
        }
        else {
            setValue(rl.line);
        }
    });
    let formattedValue = value;
    let defaultValue = '';
    if (status === 'done') {
        formattedValue = chalk_1.default.cyan(value);
    }
    else {
        defaultValue = chalk_1.default.dim(config.default === false ? ' (y/N)' : ' (Y/n)');
    }
    const message = chalk_1.default.bold(config.message);
    return `${prefix} ${message}${defaultValue} ${formattedValue}`;
});
