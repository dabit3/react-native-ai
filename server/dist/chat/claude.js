"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claude = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const models = {
    claude: 'claude-3-opus-20240229',
    claudeInstant: 'claude-3-haiku-20240307'
};
exports.claude = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        });
        const { prompt, model } = req.body;
        const decoder = new TextDecoder();
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01',
                'anthropic-beta': 'messages-2023-12-15',
                'x-api-key': process.env.ANTHROPIC_API_KEY || ''
            },
            body: JSON.stringify({
                model: models[model],
                "messages": [{ "role": "user", "content": prompt }],
                "max_tokens": 4096,
                stream: true
            })
        });
        const reader = response.body?.getReader();
        if (reader) {
            let index = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                let chunk = decoder.decode(value);
                const lines = chunk.split("\n");
                const parsedLines = lines
                    .filter(line => line.startsWith('data: '))
                    .map(line => JSON.parse(line.replace('data: ', '')));
                for (const parsedLine of parsedLines) {
                    if (parsedLine) {
                        if (parsedLine.delta && parsedLine.delta.text) {
                            res.write(`data: ${JSON.stringify(parsedLine.delta)}\n\n`);
                        }
                    }
                }
            }
            res.write('data: [DONE]\n\n');
            res.end();
        }
    }
    catch (err) {
        console.log('error in claude chat: ', err);
        res.write('data: [DONE]\n\n');
        res.end();
    }
});
