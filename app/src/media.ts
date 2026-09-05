import 'react-native-get-random-values'
import { v4 as uuid } from 'uuid'
import { Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import { imageMimeType, resizeDimensions } from './imageData'
import * as MediaLibrary from 'expo-media-library/legacy'
import * as Sharing from 'expo-sharing'
import { ImageAttachment } from '../types'
import { getImageUri, putImage } from './mediaStore'

export const newId = () => uuid()
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

export async function pickImages(limit: number, camera = false): Promise<ImageAttachment[]> {
  if (limit < 1) throw new Error('You can attach up to four images at a time.')
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) throw new Error('Allow camera access in device settings to take a photo.')
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.8,
    base64: true,
    allowsMultipleSelection: !camera && limit > 1,
    selectionLimit: limit
  }
  const result = camera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options)
  if (result.canceled) return []
  const prepared: ImageAttachment[] = []
  for (const asset of result.assets.slice(0, limit)) {
    let base64 = asset.base64 || ''
    let mimeType = imageMimeType(base64)
    const size = resizeDimensions(asset.width, asset.height)
    if (!mimeType || asset.width > 2048 || asset.height > 2048 || base64.length * 0.75 > MAX_IMAGE_BYTES) {
      const format =
        mimeType === 'image/png'
          ? SaveFormat.PNG
          : mimeType === 'image/webp'
            ? SaveFormat.WEBP
            : SaveFormat.JPEG
      const converted = await manipulateAsync(asset.uri, [{ resize: size }], {
        base64: true,
        compress: 0.82,
        format
      })
      base64 = converted.base64 || ''
      mimeType = imageMimeType(base64)
    }
    if (!mimeType) throw new Error('The selected image could not be read. Choose a JPEG, PNG, or WebP image.')
    if (base64.length * 0.75 > MAX_IMAGE_BYTES)
      throw new Error('The optimized image is still too large. Choose an image under 4 MB.')
    prepared.push({
      ...(await putImage(newId(), base64, mimeType)),
      name: asset.fileName || 'Reference image',
      ...size
    })
  }
  return prepared
}

export async function saveImage(image: ImageAttachment): Promise<void> {
  const uri = await getImageUri(image)
  if (Platform.OS === 'web') {
    const anchor = document.createElement('a')
    anchor.href = uri
    anchor.download = `rnai-${image.id}.${image.mimeType === 'image/jpeg' ? 'jpg' : image.mimeType === 'image/webp' ? 'webp' : 'png'}`
    anchor.click()
    return
  }
  const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo'])
  if (!permission.granted) throw new Error('Allow photo library access in device settings to save images.')
  await MediaLibrary.saveToLibraryAsync(uri)
}

export async function shareImage(image: ImageAttachment): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(await getImageUri(image))).blob()
    const file = new File([blob], 'image.png', { type: image.mimeType })
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] })
    else await saveImage(image)
    return
  }
  if (!(await Sharing.isAvailableAsync()))
    throw new Error('Sharing is not available on this device. Save the image instead.')
  await Sharing.shareAsync(await getImageUri(image), { mimeType: image.mimeType })
}
