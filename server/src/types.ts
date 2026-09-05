import { z } from 'zod'

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function validImageBytes(bytes: Buffer, mimeType: string): boolean {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return false
  if (mimeType === 'image/png')
    return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (mimeType === 'image/jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (mimeType === 'image/webp')
    return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
  return false
}

export const imageAttachmentSchema = z
  .object({
    mimeType: z.enum(IMAGE_MIME_TYPES),
    data: z
      .string()
      .min(1)
      .max(Math.ceil(MAX_IMAGE_BYTES / 3) * 4)
      .regex(/^[A-Za-z0-9+/]+={0,2}$/)
  })
  .refine(
    (image) =>
      image.data.length % 4 === 0 && validImageBytes(Buffer.from(image.data, 'base64'), image.mimeType),
    'The image bytes do not match a supported image format.'
  )

export const chatMessageSchema = z
  .object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().max(100000),
    image: imageAttachmentSchema.optional(),
    images: z.array(imageAttachmentSchema).max(4).optional()
  })
  .refine((message) => !(message.image && message.images?.length), 'Use image or images, not both.')
  .refine(
    (message) => message.role === 'user' || !(message.image || message.images?.length),
    'Only user messages can contain images.'
  )
  .refine(
    (message) => !!message.content.trim() || !!message.image || !!message.images?.length,
    'A message needs text or an image.'
  )

export const chatRequestSchema = z
  .object({
    model: z.string().min(1).max(100),
    messages: z.array(chatMessageSchema).min(1).max(81)
  })
  .refine((body) => body.messages.at(-1)?.role === 'user', 'The last message must be from the user.')
  .refine(
    (body) => body.messages.reduce((count, m) => count + messageImages(m).length, 0) <= 4,
    'A request can contain up to four images.'
  )
  .refine(
    (body) => body.messages.reduce((count, m) => count + m.content.length, 0) <= 108000,
    'The conversation context is too large.'
  )

export const imageRequestSchema = z.object({
  model: z.string().min(1).max(100),
  prompt: z.string().trim().min(1, 'Describe the image you want to create.').max(8500),
  aspectRatio: z.enum(['1:1', '3:2', '2:3', '16:9', '9:16']).default('1:1'),
  images: z.array(imageAttachmentSchema).max(4).optional()
})

export type ImageAttachment = z.infer<typeof imageAttachmentSchema>
export type ChatMessage = z.infer<typeof chatMessageSchema>
export type ChatRequest = z.infer<typeof chatRequestSchema>
export type ImageRequest = z.infer<typeof imageRequestSchema>

export function messageImages(message: ChatMessage): ImageAttachment[] {
  return message.images || (message.image ? [message.image] : [])
}
