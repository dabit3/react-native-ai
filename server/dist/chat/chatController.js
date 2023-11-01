"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cohere_1 = require("./cohere");
const claude_1 = require("./claude");
const openai_1 = require("./openai");
const router = express_1.default.Router();
router.get('/claude', claude_1.claude);
router.get('/cohere', cohere_1.cohere);
router.get('/openai', openai_1.openai);
exports.default = router;
