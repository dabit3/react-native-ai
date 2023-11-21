"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createThread = void 0;
async function createThread(_, res) {
    try {
        const headers = {
            'OpenAI-Beta': 'assistants=v1',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        };
        const response = await fetch('https://api.openai.com/v1/threads', {
            headers
        });
        const json = await response.json();
        console.log('json: ', json);
        return res.json({
            success: true
        });
    }
    catch (err) {
        console.log('error in assistant chat: ', err);
    }
}
exports.createThread = createThread;
