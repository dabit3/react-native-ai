import { checkAuth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'
import { chatRequestSchema } from '@/lib/types'
import { CHAT_HANDLERS } from '@/lib/chat'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ provider: string }> }
) {
  const authError = checkAuth(req)
  if (authError) return authError

  const limited = checkRateLimit(req)
  if (limited) return limited

  const { provider } = await ctx.params
  const handler = CHAT_HANDLERS[provider]
  if (!handler) {
    return Response.json({ error: `unknown chat provider: ${provider}` }, { status: 404 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return Response.json(
      { error: 'invalid request body', details: ['body must be valid JSON'] },
      { status: 400 }
    )
  }

  const result = chatRequestSchema.safeParse(json)
  if (!result.success) {
    return Response.json(
      {
        error: 'invalid request body',
        details: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
      },
      { status: 400 }
    )
  }

  return handler(result.data)
}
