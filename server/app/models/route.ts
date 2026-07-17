import { CHAT_MODELS, IMAGE_MODELS } from '@/lib/models'

export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({
    chatModels: Object.values(CHAT_MODELS).map(({ name, label, provider, supportsVision }) => ({
      name,
      label,
      provider,
      supportsVision
    })),
    imageModels: Object.values(IMAGE_MODELS).map(({ name, label, provider }) => ({
      name,
      label,
      provider
    }))
  })
}
