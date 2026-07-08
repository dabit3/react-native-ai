import { z } from 'zod'

export const imageAttachmentSchema = z.object({
  mimeType: z.string().min(1),
  data: z.string().min(1)
})

export const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
  image: imageAttachmentSchema.optional()
})

export const chatRequestSchema = z.object({
  model: z.string().min(1),
  messages: z.array(chatMessageSchema).min(1)
})

export const imageRequestSchema = z.object({
  model: z.string().min(1),
  prompt: z.string().optional()
})

export type ImageAttachment = z.infer<typeof imageAttachmentSchema>
export type ChatMessage = z.infer<typeof chatMessageSchema>
export type ChatRequest = z.infer<typeof chatRequestSchema>
