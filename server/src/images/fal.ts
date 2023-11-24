import * as fal from "@fal-ai/serverless-client"
import { Request, Response } from "express"
import { saveToBytescale } from '../helpers/saveToBytescale'

const imageModels = {
  fastImage: {
    name: 'fastImage',
    modelName: '110602490-lcm',
  },
  removeBg: {
    name: 'removeBg',
    modelName: '110602490-imageutils'
  }
}

export async function falAI(req:Request, res:Response) {
  try {
    const { prompt, model } = req.body
    fal.config({
      credentials: process.env.FAL_API_KEY
    })

    const negative_prompt = 'nsfw, (worst quality, low quality:1.3), (depth of field, blurry:1.2), (greyscale, monochrome:1.1), 3D face, nose, cropped, lowres, text, jpeg artifacts, signature, watermark, username, blurry, artist name, trademark, watermark, title, (tan, muscular, loli, petite, child, infant, toddlers, chibi, sd character:1.1), multiple view, Reference sheet,'
    
    if (model === imageModels.removeBg.name) {
      console.log('req.file: ', req.file)
      const file = req.file
      const response = await saveToBytescale(file)
      const result = await fal.subscribe("110602490-imageutils", {
        path: "/rembg",
        input: {
          image_url: response
        },
        logs: true
      })  as any
      console.log('result: ', result)
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

    if (model === imageModels.fastImage.name) {
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