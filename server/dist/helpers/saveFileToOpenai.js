"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFileToOpenai = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
const stream_1 = require("stream");
async function saveFileToOpenai(file) {
    const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
    if (!fs_1.default.existsSync(uploadsDir)) {
        fs_1.default.mkdirSync(uploadsDir);
    }
    const filePath = path_1.default.join(uploadsDir, file.originalname);
    try {
        const writeToFile = new Promise((resolve, reject) => {
            const readableStream = new stream_1.Readable({
                read() {
                    this.push(file.buffer);
                    this.push(null);
                }
            });
            const writeStream = fs_1.default.createWriteStream(filePath);
            readableStream.pipe(writeStream);
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
        await writeToFile;
        const formData = new FormData();
        formData.append('purpose', 'assistants');
        formData.append('file', new Blob([fs_1.default.readFileSync(filePath)], { type: 'application/json' }), file.originalname);
        const response = await fetch('https://api.openai.com/v1/files', {
            method: 'POST',
            headers: {
                ...utils_1.baseHeaders
            },
            body: formData
        }).then(res => res.json());
        return response;
    }
    catch (err) {
        console.log('error saving file to openai: ', err);
    }
}
exports.saveFileToOpenai = saveFileToOpenai;
