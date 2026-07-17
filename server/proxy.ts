import { NextRequest, NextResponse } from 'next/server'

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
}

export function proxy(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders() })
  }

  const res = NextResponse.next()
  for (const [key, value] of Object.entries(corsHeaders())) {
    res.headers.set(key, value)
  }
  return res
}

export const config = {
  matcher: ['/health', '/models', '/chat/:path*', '/images/:path*']
}
