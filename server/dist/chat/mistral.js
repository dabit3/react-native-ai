"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mistral = void 0;
/*
*  stream help from  https://www.builder.io/blog/stream-ai-javascript
*/
const replicate_1 = __importDefault(require("replicate"));
const eventsource_1 = __importDefault(require("eventsource"));
async function mistral(req, res) {
    try {
        const replicate = new replicate_1.default({
            auth: process.env.REPLICATE_KEY,
        });
        const { prompt } = req.body;
        if (!prompt) {
            return res.json({
                error: 'no prompt'
            });
        }
        let output = await replicate.predictions.create({
            input: {
                prompt,
                max_new_tokens: 5000
            },
            version: '83b6a56e7c828e667f21fd596c338fd4f0039b46bcfa18d973e8e70e455fda70',
            stream: true
        });
        if (output && output.urls && output.urls.stream) {
            const source = new eventsource_1.default(output.urls.stream, { withCredentials: true });
            source.addEventListener("output", (e) => {
                if (e.data) {
                    res.write(`data: ${JSON.stringify(e)}\n\n`);
                }
            });
            source.addEventListener("error", (e) => {
                console.log('error in event listener:', e);
                res.write('data: [DONE]\n\n');
                source.close();
                res.end();
            });
            source.addEventListener("done", (e) => {
                res.write('data: [DONE]\n\n');
                source.close();
                res.end();
            });
        }
        else {
            console.log('error managing Mistral event source ...');
            res.write('data: [DONE]\n\n');
            res.end();
        }
    }
    catch (err) {
        console.log('error in mistral chat: ', err);
        res.write('data: [DONE]\n\n');
        res.end();
    }
}
exports.mistral = mistral;
