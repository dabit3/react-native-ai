"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gpt = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
exports.gpt = (0, express_async_handler_1.default)(async (req, res) => {
    const models = {
        gptTurbo: 'gpt-4-1106-preview',
        gpt: 'gpt-4'
    };
    try {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        });
        const { model, messages } = req.body;
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: models[model],
                messages,
                stream: true
            })
        });
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let brokenLine = '';
        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                let chunk = decoder.decode(value);
                if (brokenLine) {
                    try {
                        const { choices } = JSON.parse(brokenLine);
                        const { delta } = choices[0];
                        const { content } = delta;
                        if (content) {
                            res.write(`data: ${JSON.stringify(content)}\n\n`);
                        }
                        brokenLine = '';
                    }
                    catch (err) { }
                }
                const lines = chunk.split("data: ");
                const parsedLines = lines
                    .filter(line => line !== "" && line !== "[DONE]")
                    .filter(l => {
                    try {
                        JSON.parse(l);
                        return true;
                    }
                    catch (err) {
                        console.log('line thats not json:', l);
                        if (!l.includes('[DONE]')) {
                            brokenLine = brokenLine + l;
                        }
                        return false;
                    }
                })
                    .map(l => JSON.parse(l));
                for (const parsedLine of parsedLines) {
                    const { choices } = parsedLine;
                    const { delta } = choices[0];
                    const { content } = delta;
                    if (content) {
                        res.write(`data: ${JSON.stringify(delta)}\n\n`);
                    }
                }
            }
        }
        res.write('data: [DONE]\n\n');
    }
    catch (err) {
        console.log('error: ', err);
    }
});
