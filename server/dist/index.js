"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatRouter_1 = __importDefault(require("./chat/chatRouter"));
const imagesRouter_1 = __importDefault(require("./images/imagesRouter"));
const fileRouter_1 = __importDefault(require("./files/fileRouter"));
const body_parser_1 = __importDefault(require("body-parser"));
require("dotenv/config");
const app = (0, express_1.default)();
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.use(express_1.default.json({ limit: '50mb' }));
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.use('/chat', chatRouter_1.default);
app.use('/images', imagesRouter_1.default);
app.use('/files', fileRouter_1.default);
app.listen(3050, () => {
    console.log('Server started on port 3050');
});
