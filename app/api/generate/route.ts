import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildPrompt, isValidContentType } from '@/lib/prompts'
import type { ContentType, ContentInputs } from '@/lib/prompts'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const runtime = 'nodejs'

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
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let inputs: ContentInputs
  let contentTypeRaw: unknown

  try {
    const body = await request.json()
    contentTypeRaw = body.contentType
    inputs = sanitizeInputs(body.inputs)

    if (!body.inputs) {
      return Response.json({ error: 'contentType and inputs are required' }, { status: 400 })
    }
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!isValidContentType(contentTypeRaw)) {
    return Response.json({ error: 'Invalid content type' }, { status: 400 })
  }

  const contentType = contentTypeRaw
  const lengthKey = (inputs as Record<string, unknown>).wordCount as string
    || (inputs as Record<string, unknown>).desiredLength as string
    || (inputs as Record<string, unknown>).emailLength as string
    || 'standard'
  const maxTokens = MAX_TOKENS[contentType][lengthKey] ?? 1500

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
        // Sanitize error — only expose safe, user-facing messages
        let safeMessage = 'Generation failed. Please try again.'
        if (err instanceof Error) {
          if (err.message.includes('credit balance') || err.message.includes('billing')) {
            safeMessage = 'Your Anthropic API credit balance is too low. Please add credits.'
          } else if (err.message.includes('rate limit') || err.message.includes('429')) {
            safeMessage = 'Rate limit reached. Please wait a moment and try again.'
          } else if (err.message.includes('invalid x-api-key') || err.message.includes('authentication')) {
            safeMessage = 'API key is invalid or missing. Check your configuration.'
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
}
