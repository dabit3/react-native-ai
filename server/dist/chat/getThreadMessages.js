"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getThreadMessages = void 0;
async function getThreadMessages(req, res) {
    try {
        const { thread_id } = req.body;
        const headers = {
            'OpenAI-Beta': 'assistants=v1',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        };
        const response = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
            headers
        }).then(res => res.json());
        return res.json({
            success: true,
            data: response
        });
    }
    catch (err) {
        console.log('error in assistant chat: ', err);
    }
}
exports.getThreadMessages = getThreadMessages;
