"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAssistant = void 0;
async function createAssistant(req, res) {
    try {
        const { instructions, name, file_ids } = req.body;
        const body = {
            model: 'gpt-4',
            instructions,
            name
        };
        if (file_ids) {
            body.file_ids = file_ids,
                body.tools = [{ type: "code_interpreter" }];
        }
        const headers = {
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v1',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        };
        const response = await fetch('https://api.openai.com/v1/assistants', {
            method: 'POST',
            body: JSON.stringify(body),
            headers
        });
        const json = await response.json();
        console.log('json:', json);
        return res.json({
            success: true
        });
    }
    catch (err) {
        console.log('error in assistant chat: ', err);
    }
}
exports.createAssistant = createAssistant;
