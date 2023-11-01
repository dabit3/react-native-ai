"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openai = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
exports.openai = (0, express_async_handler_1.default)(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: OpenAI");
});
