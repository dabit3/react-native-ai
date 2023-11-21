"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.thread = void 0;
async function thread(req, res) {
    try {
        const { prompt, codeInterpreter } = req.body;
    }
    catch (err) {
        console.log('error in assistant chat: ', err);
    }
}
exports.thread = thread;
