import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildPrompt, isValidContentType } from '@/lib/prompts'
import type { ContentInputs } from '@/lib/prompts'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const runtime = 'nodejs'

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
    inputs = body.inputs

    if (!inputs) {
      return Response.json({ error: 'contentType and inputs are required' }, { status: 400 })
    }
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!isValidContentType(contentTypeRaw)) {
    return Response.json({ error: 'Invalid content type' }, { status: 400 })
  }

  const contentType = contentTypeRaw
  const prompt = buildPrompt(contentType, inputs)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
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
