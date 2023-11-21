"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_file_1 = require("./upload-file");
const router = express_1.default.Router();
router.post('/upload-file', upload_file_1.uploadFile);
exports.default = router;
