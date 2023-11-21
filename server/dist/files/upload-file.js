"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const endpoint = 'https://api.openai.com/v1/files';
async function uploadFile(req, res) {
    try {
        const { prompt, codeInterpreter } = req.body;
    }
    catch (err) {
        console.log('error in assistant chat: ', err);
    }
}
exports.uploadFile = uploadFile;
