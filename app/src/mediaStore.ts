import * as FileSystem from 'expo-file-system/legacy'
import type { ImageAttachment } from '../types'

const extension = (mimeType: string) =>
  mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png'
const imagePath = (id: string, mimeType: string) => {
  if (!/^[a-zA-Z0-9-]+$/.test(id)) throw new Error('The saved image reference is invalid.')
  return `${FileSystem.documentDirectory}rnai-${id}.${extension(mimeType)}`
}

export async function putImage(id: string, base64: string, mimeType: string): Promise<ImageAttachment> {
  if (!FileSystem.documentDirectory) throw new Error('Image storage is not available on this device.')
  const uri = imagePath(id, mimeType)
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 })
  return { id, uri, mimeType }
}

export async function getImageUri(image: ImageAttachment): Promise<string> {
  return image.id.startsWith('legacy-') ? image.uri : imagePath(image.id, image.mimeType)
}

export async function getImageBase64(image: ImageAttachment): Promise<string> {
  if (image.base64) return image.base64
  const uri = await getImageUri(image)
  if (uri.startsWith('data:')) return uri.slice(uri.indexOf(',') + 1)
  try {
    return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })
  } catch {
    throw new Error(
      'An attached image is no longer on this device. Start a new conversation and attach it again.'
    )
  }
}

export async function deleteImage(image: ImageAttachment): Promise<void> {
  if (image.id.startsWith('legacy-')) return
  await FileSystem.deleteAsync(imagePath(image.id, image.mimeType), { idempotent: true })
}
