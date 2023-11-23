import * as Bytescale from '@bytescale/sdk'
import nodeFetch from 'node-fetch'
import 'dotenv/config'

const uploadManager = new Bytescale.UploadManager({
  fetchApi: nodeFetch as any,
  apiKey: process.env.BYTESCALE_API_KEY || ''
})

export async function saveToBytescale(file: any) {
  const fileBase64 = file.buffer.toString('base64')
  const mimeType = file.mimetype
  const dataURI = `data:${mimeType};base64,${fileBase64}`
  var buf = Buffer.from(dataURI.replace(/^data:image\/\w+;base64,/, ""),'base64')
  try {
    uploadManager
    .upload({
      data: buf,
      mime: file.mimetype,
      originalFileName: file.originalname
    })
    .then(
      ({ fileUrl, filePath }) => {
        console.log(`File uploaded to: ${fileUrl}`)
        console.log('filePath: ', filePath)
        return fileUrl
      },
      error => console.error(`Error: ${error.message}`, error)
    )
  } catch (err) {
    console.log('error uploading file: ', err)
  }
}