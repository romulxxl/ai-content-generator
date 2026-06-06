import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createClient } from '@supabase/supabase-js'
import { buildPrompt, isValidContentType } from '@/lib/prompts'
import type { ContentType, ContentInputs } from '@/lib/prompts'

export const runtime = 'nodejs'
export const maxDuration = 30

const DEMO_LIMIT = 3
const TOKEN_MARKER = '\n\n__TOKENS__:'
const ERROR_MARKER = '\n\n__ERROR__:'

const DEMO_MAX_TOKENS: Record<ContentType, number> = {
  product_description:  150,
  blog_post_outline:    500,
  email_composer:       250,
  social_media_caption: 150,
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'demo-unknown'
  )
}

function buildDemoInputs(
  contentType: ContentType,
  raw: Record<string, unknown>,
): ContentInputs | null {
  switch (contentType) {
    case 'product_description': {
      const name = String(raw.productName ?? '').slice(0, 100).trim()
      if (!name) return null
      return {
        productName: name,
        keyFeatures: Array.isArray(raw.keyFeatures)
          ? raw.keyFeatures.slice(0, 5).map((f) => String(f).slice(0, 60))
          : [],
        tone: (['formal','casual','playful','authoritative','urgent','empathetic','minimalist'].includes(String(raw.tone))
          ? raw.tone as 'formal'
          : 'formal'),
        wordCount: 'teaser',
      }
    }
    case 'blog_post_outline': {
      const topic = String(raw.topic ?? '').slice(0, 200).trim()
      if (!topic) return null
      return {
        topic,
        targetAudience: String(raw.targetAudience ?? 'general readers').slice(0, 100).trim() || 'general readers',
        desiredLength: 'short',
      }
    }
    case 'email_composer': {
      const company = String(raw.companyName ?? '').slice(0, 100).trim()
      const purpose = String(raw.emailPurpose ?? '').slice(0, 200).trim()
      if (!company || !purpose) return null
      return {
        companyName: company,
        emailPurpose: purpose,
        emailStyle: (['formal','friendly','persuasive','direct','empathetic'].includes(String(raw.emailStyle))
          ? raw.emailStyle as 'formal'
          : 'formal'),
        emailLength: 'brief',
        keyPoints: [],
      }
    }
    case 'social_media_caption': {
      const topic = String(raw.topic ?? '').slice(0, 200).trim()
      if (!topic) return null
      return {
        platform: (['instagram','linkedin','twitter','facebook'].includes(String(raw.platform))
          ? raw.platform as 'instagram'
          : 'instagram'),
        topic,
        tone: (['professional','casual','fun'].includes(String(raw.tone))
          ? raw.tone as 'professional'
          : 'casual'),
        wordCount: 'short',
      }
    }
  }
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

    let contentTypeRaw: unknown
    let rawInputs: Record<string, unknown>

    try {
      const body = await request.json()
      contentTypeRaw = body.contentType
      rawInputs = (body.inputs && typeof body.inputs === 'object') ? body.inputs as Record<string, unknown> : {}
    } catch {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    if (!isValidContentType(contentTypeRaw)) {
      return Response.json({ error: 'Invalid content type' }, { status: 400 })
    }

    const contentType = contentTypeRaw as ContentType
    const inputs = buildDemoInputs(contentType, rawInputs)
    if (!inputs) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await supabase.from('demo_requests').insert({ ip })

    const remaining = DEMO_LIMIT - used - 1
    const prompt = buildPrompt(contentType, inputs)
    const maxTokens = DEMO_MAX_TOKENS[contentType]

    const anthropic = createAnthropic({ apiKey })
    const streamResult = streamText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system:
        'You are a professional content writer. Use Markdown formatting where it adds clarity: ' +
        '## and ### for section headers in structured content, **bold** for key terms. ' +
        'For flowing prose, keep formatting minimal. Match the language of the user\'s request.',
      messages: [{ role: 'user', content: prompt }],
      maxOutputTokens: maxTokens,
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
