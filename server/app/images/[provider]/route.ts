import { checkAuth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'
import { geminiImage } from '@/lib/images/gemini'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const IMAGE_HANDLERS: Record<string, typeof geminiImage> = {
  gemini: geminiImage
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ provider: string }> }
) {
  const authError = checkAuth(req)
  if (authError) return authError

  const limited = checkRateLimit(req)
  if (limited) return limited

  const { provider } = await ctx.params
  const handler = IMAGE_HANDLERS[provider]
  if (!handler) {
    return Response.json({ error: `unknown image provider: ${provider}` }, { status: 404 })
  }

  const contentType = req.headers.get('content-type') || ''

  let model = ''
  let prompt: string | undefined
  let file: { mimeType: string; data: string } | undefined

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    model = form.get('model')?.toString() || ''
    prompt = form.get('prompt')?.toString() || undefined
    const uploaded = form.get('file')
    if (uploaded instanceof File) {
      const buffer = Buffer.from(await uploaded.arrayBuffer())
      file = {
        mimeType: uploaded.type || 'application/octet-stream',
        data: buffer.toString('base64')
      }
    }
  } else {
    const json = await req.json().catch(() => ({}) as any)
    model = typeof json.model === 'string' ? json.model : ''
    prompt = typeof json.prompt === 'string' ? json.prompt : undefined
  }

  return handler({ model, prompt, file })
}
