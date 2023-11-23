"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFile = void 0;
const Bytescale = __importStar(require("@bytescale/sdk"));
const node_fetch_1 = __importDefault(require("node-fetch"));
require("dotenv/config");
const uploadManager = new Bytescale.UploadManager({
    fetchApi: node_fetch_1.default,
    apiKey: process.env.BYTESCALE_API_KEY || ''
});
async function saveFile(file) {
    const fileBase64 = file.buffer.toString('base64');
    const mimeType = file.mimetype;
    const dataURI = `data:${mimeType};base64,${fileBase64}`;
    var buf = Buffer.from(dataURI.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    try {
        uploadManager
            .upload({
            data: buf,
            mime: file.mimetype,
            originalFileName: file.originalname
        })
            .then(({ fileUrl, filePath }) => {
            console.log(`File uploaded to: ${fileUrl}`);
            console.log('filePath: ', filePath);
            return fileUrl;
        }, error => console.error(`Error: ${error.message}`, error));
    }
    catch (err) {
        console.log('error uploading file: ', err);
    }
}
exports.saveFile = saveFile;
