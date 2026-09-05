import type { ImageAttachment } from '../types'

let database: Promise<IDBDatabase> | undefined
const urls = new Map<string, string>()

function openDatabase(): Promise<IDBDatabase> {
  if (!database)
    database = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined')
        return reject(new Error('Image storage is unavailable. Use a browser with IndexedDB support.'))
      const request = indexedDB.open('rnai-media-v2', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('images')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        database = undefined
        reject(new Error('Image storage could not be opened. Check your browser privacy settings.'))
      }
      request.onblocked = () => reject(new Error('Close other app tabs, then try again.'))
    })
  return database
}

async function readBlob(id: string): Promise<Blob> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction('images').objectStore('images').get(id)
    request.onsuccess = () =>
      request.result instanceof Blob
        ? resolve(request.result)
        : reject(new Error('An attached image is no longer in this browser. Attach it again.'))
    request.onerror = () => reject(new Error('The saved image could not be read.'))
  })
}

export async function putImage(id: string, base64: string, mimeType: string): Promise<ImageAttachment> {
  const response = await fetch(`data:${mimeType};base64,${base64}`)
  const blob = await response.blob()
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('images', 'readwrite')
    transaction.objectStore('images').put(blob, id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () =>
      reject(new Error('The image could not be saved. Free browser storage, then try again.'))
    transaction.onabort = () =>
      reject(new Error('The image could not be saved. Free browser storage, then try again.'))
  })
  const uri = URL.createObjectURL(blob)
  if (urls.has(id)) URL.revokeObjectURL(urls.get(id)!)
  urls.set(id, uri)
  return { id, uri: `media:${id}`, mimeType }
}

export async function getImageUri(image: ImageAttachment): Promise<string> {
  if (image.id.startsWith('legacy-')) return image.uri
  if (urls.has(image.id)) return urls.get(image.id)!
  const uri = URL.createObjectURL(await readBlob(image.id))
  urls.set(image.id, uri)
  return uri
}

export async function getImageBase64(image: ImageAttachment): Promise<string> {
  if (image.base64) return image.base64
  if (image.uri.startsWith('data:')) return image.uri.slice(image.uri.indexOf(',') + 1)
  const blob = await readBlob(image.id)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(new Error('The image could not be read. Attach it again.'))
    reader.readAsDataURL(blob)
  })
}

export async function deleteImage(image: ImageAttachment): Promise<void> {
  if (image.id.startsWith('legacy-')) return
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('images', 'readwrite')
    transaction.objectStore('images').delete(image.id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(new Error('The image could not be deleted.'))
  })
  if (urls.has(image.id)) URL.revokeObjectURL(urls.get(image.id)!)
  urls.delete(image.id)
}
