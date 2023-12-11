"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cohere_1 = require("./cohere");
const claude_1 = require("./claude");
const gpt_1 = require("./gpt");
const mistral_1 = require("./mistral");
const upload = (0, multer_1.default)();
// assistant API
const createAssistant_1 = require("./createAssistant");
const addMessageToThread_1 = require("./addMessageToThread");
const runStatus_1 = require("./runStatus");
const runResponse_1 = require("./runResponse");
const getThreadMessages_1 = require("./getThreadMessages");
const router = express_1.default.Router();
router.post('/claude', claude_1.claude);
router.post('/cohere', cohere_1.cohere);
router.post('/gpt', gpt_1.gpt);
router.post('/mistral', mistral_1.mistral);
// assistant
router.post('/create-assistant', upload.single('file'), createAssistant_1.createAssistant);
router.post('/add-message-to-thread', upload.single('file'), addMessageToThread_1.addMessageToThread);
router.post('/run-status', runStatus_1.runStatus);
router.post('/run-response', runResponse_1.runResponse);
router.post('/get-thread-messages', getThreadMessages_1.getThreadMessages);
exports.default = router;
