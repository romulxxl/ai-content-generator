import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createClient } from '@/lib/supabase/server'
import { buildPrompt, isValidContentType } from '@/lib/prompts'
import type { ContentType, ContentInputs } from '@/lib/prompts'

export const runtime = 'nodejs'
export const maxDuration = 60

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

    const anthropic = createAnthropic({ apiKey })
    const prompt = buildPrompt(contentType, inputs)

    const result = streamText({
      model: anthropic('claude-sonnet-4-6'),
      system: 'You write clean, plain text content. Never use markdown formatting: no # headers, no ** or * for bold/italic, no _ underscores, no bullet dashes unless explicitly part of a list structure. To emphasize text, use double quotes. Keep the output minimal and readable.',
      messages: [{ role: 'user', content: prompt }],
      maxOutputTokens: maxTokens,
    })

    return result.toTextStreamResponse({
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[generate] error:', err instanceof Error ? err.message : err)
    const msg = err instanceof Error ? err.message : 'Unexpected server error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
