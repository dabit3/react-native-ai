import * as fal from "@fal-ai/serverless-client"
import { Request, Response } from "express"
import { saveToBytescale } from '../helpers/saveToBytescale'

const imageModels = {
  fastImage: {
    label: 'fastImage',
    modelName: '110602490-lcm',
  },
  removeBg: {
    label: 'removeBg',
    modelName: '110602490-imageutils'
  },
  stableDiffusionXL: {
    label: 'stableDiffusionXL',
    modelName: '110602490-fast-sdxl'
  },
  upscale: {
    label: 'upscale',
    modelName: '110602490-imageutils'
  },
  illusionDiffusion: {
    label: 'illusionDiffusion',
    modelName: '110602490-fast-illust'
  }
}

export async function falAI(req:Request, res:Response) {
  try {
    const { prompt, model, baseImage } = req.body
    console.log('baseImage: ', baseImage)
    console.log('model: ', model)
    console.log('prompt: ', prompt)
    fal.config({
      credentials: process.env.FAL_API_KEY
    })

    const negative_prompt = 'nsfw, (worst quality, low quality:1.3), (depth of field, blurry:1.2), (greyscale, monochrome:1.1), 3D face, nose, cropped, lowres, text, jpeg artifacts, signature, watermark, username, blurry, artist name, trademark, watermark, title, (tan, muscular, loli, petite, child, infant, toddlers, chibi, sd character:1.1), multiple view, Reference sheet,'
    
    if (model === imageModels.illusionDiffusion.label) {
      const result = await fal.subscribe("54285744-illusion-diffusion", {
        input: {
          image_url: baseImage,
          prompt: '(masterpiece:1.4), (best quality), (detailed), ' + prompt
        },
        logs: true
      }) as any
      if (result && result.image) {
        const image = result.image.url
        return res.json({
          image
        })
      } else {
        return res.json({
          error: 'error generating image'
        })
      }
    }

    if (model === imageModels.stableDiffusionXL.label) {
      const result = await fal.subscribe("110602490-fast-sdxl", {
        input: {
          prompt,
          negative_prompt
        },
        logs: true,
      }) as any
      if (result && result.images.length) {
        const image = result.images[0].url
        return res.json({
          image
        })
      } else {
        return res.json({
          error: 'error generating image'
        })
      }
    }

    if (model === imageModels.removeBg.label) {
      const file = req.file
      const response = await saveToBytescale(file)
      const result = await fal.subscribe("110602490-imageutils", {
        path: "/rembg",
        input: {
          image_url: response
        },
        logs: true
      }) as any
      if (result && result.image) {
        const image = result.image.url
        return res.json({
          image
        })
      } else {
        return res.json({
          error: 'error generating image'
        })
      }
    }

    if (model === imageModels.upscale.label) {
      const file = req.file
      const response = await saveToBytescale(file)
      const result = await fal.subscribe("110602490-imageutils", {
        path: "/esrgan",
        input: {
          image_url: response
        },
        logs: true
      })  as any
      if (result && result.image) {
        const image = result.image.url
        return res.json({
          image
        })
      } else {
        return res.json({
          error: 'error generating image'
        })
      }
    }

    if (model === imageModels.fastImage.label) {
      const result = await fal.subscribe(imageModels.fastImage.modelName, {
        input: {
          prompt,
          negative_prompt
        }
      }) as any
      if (result && result.images.length) {
        const image = result.images[0].url
        return res.json({
          image
        })
      } else {
        return res.json({
          error: 'error generating image'
        })
      }
    }
  } catch (err) {
    console.log('error: ', err)
    return res.json({ error: err });
  }
}