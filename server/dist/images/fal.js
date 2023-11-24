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
Object.defineProperty(exports, "__esModule", { value: true });
exports.falAI = void 0;
const fal = __importStar(require("@fal-ai/serverless-client"));
const saveToBytescale_1 = require("../helpers/saveToBytescale");
const imageModels = {
    fastImage: {
        name: 'fastImage',
        modelName: '110602490-lcm',
    },
    removeBg: {
        name: 'removeBg',
        modelName: '110602490-imageutils'
    }
};
async function falAI(req, res) {
    try {
        const { prompt, model } = req.body;
        fal.config({
            credentials: process.env.FAL_API_KEY
        });
        const negative_prompt = 'nsfw, (worst quality, low quality:1.3), (depth of field, blurry:1.2), (greyscale, monochrome:1.1), 3D face, nose, cropped, lowres, text, jpeg artifacts, signature, watermark, username, blurry, artist name, trademark, watermark, title, (tan, muscular, loli, petite, child, infant, toddlers, chibi, sd character:1.1), multiple view, Reference sheet,';
        if (model === imageModels.removeBg.name) {
            console.log('req.file: ', req.file);
            const file = req.file;
            const response = await (0, saveToBytescale_1.saveToBytescale)(file);
            const result = await fal.subscribe("110602490-imageutils", {
                path: "/rembg",
                input: {
                    image_url: response
                },
                logs: true
            });
            console.log('result: ', result);
            if (result && result.image) {
                const image = result.image.url;
                return res.json({
                    image
                });
            }
            else {
                return res.json({
                    error: 'error generating image'
                });
            }
        }
        if (model === imageModels.fastImage.name) {
            const result = await fal.subscribe(imageModels.fastImage.modelName, {
                input: {
                    prompt,
                    negative_prompt
                }
            });
            if (result && result.images.length) {
                const image = result.images[0].url;
                return res.json({
                    image
                });
            }
            else {
                return res.json({
                    error: 'error generating image'
                });
            }
        }
    }
    catch (err) {
        console.log('error: ', err);
        return res.json({ error: err });
    }
}
exports.falAI = falAI;
