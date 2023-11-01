"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatRouter_1 = __importDefault(require("./chat/chatRouter"));
require("dotenv/config");
const app = (0, express_1.default)();
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.use('/chat', chatRouter_1.default);
app.listen(3050, () => {
    console.log('Server started on port 3050');
});
