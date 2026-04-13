import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildPrompt, isValidContentType } from '@/lib/prompts'
import type { ContentType, ContentInputs } from '@/lib/prompts'

export const runtime = 'nodejs'

export function GET() {
  return Response.json({
    ok: true,
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
}

const MAX_TOKENS: Record<ContentType, Record<string, number>> = {
  product_description:  { teaser: 200, standard: 400, extended: 700 },
  blog_post_outline:    { short: 900, medium: 1800, long: 3500 },
  email_composer:       { brief: 400, standard: 700, detailed: 1100 },
  social_media_caption: { micro: 250, short: 400, medium: 600, long: 1000 },
}

const STR_LIMIT = 500

function sanitizeInputs(inputs: unknown): ContentInputs {
  if (!inputs || typeof inputs !== 'object') return {} as ContentInputs
  const sanitized: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(inputs as Record<string, unknown>)) {
    if (typeof v === 'string') {
      sanitized[k] = v.slice(0, STR_LIMIT)
    } else if (Array.isArray(v)) {
      sanitized[k] = v
        .filter((item): item is string => typeof item === 'string')
        .slice(0, 20)
        .map((s) => s.slice(0, 100))
    } else {
      sanitized[k] = v
    }
  }
  return sanitized as unknown as ContentInputs
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'Server configuration error: ANTHROPIC_API_KEY is not set.' }, { status: 500 })
    }

    let supabase
    try {
      supabase = createClient()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return Response.json({ error: 'Auth service unavailable: ' + msg }, { status: 503 })
    }

    let user
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch {
      return Response.json({ error: 'Auth check failed. Please refresh and try again.' }, { status: 503 })
    }

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let inputs: ContentInputs
    let contentTypeRaw: unknown

    try {
      const body = await request.json()
      contentTypeRaw = body.contentType
      if (!body.contentType || !body.inputs) {
        return Response.json({ error: 'contentType and inputs are required' }, { status: 400 })
      }
      inputs = sanitizeInputs(body.inputs)
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!isValidContentType(contentTypeRaw)) {
      return Response.json({ error: 'Invalid content type' }, { status: 400 })
    }

    const contentType = contentTypeRaw
    const inp = inputs as unknown as Record<string, unknown>
    const lengthKey = (inp.wordCount ?? inp.desiredLength ?? inp.emailLength ?? 'standard') as string
    const maxTokens = MAX_TOKENS[contentType][lengthKey] ?? 1500

    const anthropic = new Anthropic({ apiKey })
    const prompt = buildPrompt(contentType, inputs)
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const messageStream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: maxTokens,
            system: 'You write clean, plain text content. Never use markdown formatting: no # headers, no ** or * for bold/italic, no _ underscores, no bullet dashes unless explicitly part of a list structure. To emphasize text, use double quotes. Keep the output minimal and readable.',
            messages: [{ role: 'user', content: prompt }],
          })

          for await (const event of messageStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }

          controller.close()
        } catch (err) {
          let safeMessage = 'Generation failed. Please try again.'
          if (err instanceof Error) {
            const msg = err.message.toLowerCase()
            if (msg.includes('credit balance') || msg.includes('billing') || msg.includes('insufficient')) {
              safeMessage = 'Your Anthropic API credit balance is too low. Please add credits.'
            } else if (msg.includes('rate limit') || msg.includes('429') || msg.includes('overloaded')) {
              safeMessage = 'Rate limit reached. Please wait a moment and try again.'
            } else if (msg.includes('invalid x-api-key') || msg.includes('authentication') || msg.includes('api key') || msg.includes('401')) {
              safeMessage = 'API key is invalid or missing. Check your Vercel environment variables.'
            } else if (msg.includes('model') || msg.includes('not found') || msg.includes('404')) {
              safeMessage = 'Model not available. Please contact support.'
            }
          }
          controller.enqueue(encoder.encode(`\n\n[Error: ${safeMessage}]`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected server error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
