"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAssistant = void 0;
const saveFileToOpenai_1 = require("../helpers/saveFileToOpenai");
async function createAssistant(req, res) {
    try {
        const { instructions, input } = req.body;
        const file = req.file;
        let assistantId;
        let threadId;
        let runId;
        const body = {
            model: 'gpt-4',
            name: 'RN AI Assistant'
        };
        const headers = {
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v1',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        };
        if (instructions) {
            body.instructions = instructions;
        }
        if (file) {
            console.log('file: ', file);
            const response = await (0, saveFileToOpenai_1.saveFileToOpenai)(file);
            console.log('response: ', response);
            // const url = await saveToBytescale(file)
            // console.log('file uploaded to url: ', url)
            // body.file_ids = file_ids,
            // body.tools = [{ type: "code_interpreter" }]
        }
        const assistant = await fetch('https://api.openai.com/v1/assistants', {
            method: 'POST',
            body: JSON.stringify(body),
            headers
        }).then(res => res.json());
        assistantId = assistant.id;
        const thread = await fetch('https://api.openai.com/v1/threads', {
            method: 'POST',
            headers
        }).then(res => res.json());
        threadId = thread.id;
        console.log('threadId: ', threadId);
        await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'POST',
            body: JSON.stringify({
                role: 'user',
                content: input
            }),
            headers
        }).then(res => res.json());
        const run = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                assistant_id: assistantId
            })
        }).then(res => res.json());
        runId = run.id;
        return res.json({
            assistantId,
            threadId,
            runId
        });
    }
    catch (err) {
        console.log('error in assistant chat: ', err);
        return res.json({ error: err });
    }
}
exports.createAssistant = createAssistant;
