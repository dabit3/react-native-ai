"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cohere_1 = require("./cohere");
const claude_1 = require("./claude");
const gpt_1 = require("./gpt");
const router = express_1.default.Router();
router.post('/claude', claude_1.claude);
router.post('/cohere', cohere_1.cohere);
router.post('/gpt', gpt_1.gpt);
exports.default = router;
