import fs from 'fs'
import path from 'path'
import { baseHeaders } from '../utils'
import { Readable } from 'stream'

export async function saveFileToOpenai(file: any) {
  const uploadsDir = path.join(process.cwd(), 'uploads')
  if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
  }
  const filePath = path.join(uploadsDir, file.originalname);
  try {
    const writeToFile = new Promise((resolve, reject) => {
      const readableStream = new Readable({
          read() {
              this.push(file.buffer);
              this.push(null);
          }
      })
      const writeStream = fs.createWriteStream(filePath)
      readableStream.pipe(writeStream)
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
    await writeToFile
    const formData = new FormData()
    formData.append('purpose', 'assistants')
    formData.append('file', new Blob([fs.readFileSync(filePath)], { type: 'application/json' }), file.originalname)
    const response = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        ...baseHeaders
      },
      body: formData
    }).then(res => res.json())
    return response
  } catch (err) {
    console.log('error saving file to openai: ', err)
  }
}