"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamToStdout = exports.gemini = void 0;
const generative_ai_1 = require("@google/generative-ai");
async function gemini(req, res) {
    try {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        });
        const { prompt } = req.body;
        if (!prompt) {
            return res.json({
                error: 'no prompt'
            });
        }
        const genAIInit = new generative_ai_1.GoogleGenerativeAI(`${process.env.GEMINI_API_KEY}`);
        // For text-only input, use the gemini-pro model
        const model = genAIInit.getGenerativeModel({
            model: "gemini-pro",
        });
        const geminiResult = await model.generateContentStream(prompt);
        if (geminiResult && geminiResult.stream) {
            await streamToStdout(geminiResult.stream, res);
        }
        else {
            res.end();
        }
    }
    catch (err) {
        console.log('error in Gemini chat: ', err);
        res.write('data: [DONE]\n\n');
        res.end();
    }
}
exports.gemini = gemini;
async function streamToStdout(stream, res) {
    for await (const chunk of stream) {
        const chunkText = chunk.text();
        res.write(`data: ${JSON.stringify(chunkText)}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
}
exports.streamToStdout = streamToStdout;
