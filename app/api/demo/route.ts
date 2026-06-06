import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 30

const DEMO_LIMIT = 3
const DEMO_MAX_TOKENS = 150
const TOKEN_MARKER = '\n\n__TOKENS__:'
const ERROR_MARKER = '\n\n__ERROR__:'

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'demo-unknown'
  )
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const ip = getClientIp(request)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('demo_requests')
      .select('*', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', since)

    const used = count ?? 0
    if (used >= DEMO_LIMIT) {
      return Response.json({ error: 'Demo limit reached', limitReached: true }, { status: 429 })
    }

    let productName: string
    let keyFeatures: string[]

    try {
      const body = await request.json()
      productName = String(body.productName ?? '').slice(0, 100).trim()
      keyFeatures = Array.isArray(body.keyFeatures)
        ? body.keyFeatures.slice(0, 5).map((f: unknown) => String(f).slice(0, 60))
        : []
    } catch {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    if (!productName) {
      return Response.json({ error: 'Product name is required' }, { status: 400 })
    }

    await supabase.from('demo_requests').insert({ ip })

    const remaining = DEMO_LIMIT - used - 1

    const featuresLine = keyFeatures.length > 0 ? `Key features: ${keyFeatures.join(', ')}\n` : ''
    const prompt =
      `Write a short product description (teaser, 50–80 words) for "${productName}".\n` +
      featuresLine +
      `Tone: professional. Use **bold** for the 1–2 most important features inline. ` +
      `No title — just the description text. Respond in the same language as the product name.`

    const anthropic = createAnthropic({ apiKey })
    const streamResult = streamText({
      model: anthropic('claude-haiku-4-5-20251001'),
      messages: [{ role: 'user', content: prompt }],
      maxOutputTokens: DEMO_MAX_TOKENS,
    })

    const encoder = new TextEncoder()
    const responseBody = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.textStream) {
            controller.enqueue(encoder.encode(chunk))
          }
          const usage = await streamResult.usage
          const tokens = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)
          controller.enqueue(encoder.encode(TOKEN_MARKER + tokens))
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Generation error'
          controller.enqueue(encoder.encode(ERROR_MARKER + msg))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(responseBody, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Demo-Remaining': String(remaining),
      },
    })
  } catch (err) {
    console.error('[demo] error:', err instanceof Error ? err.message : err)
    return Response.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
