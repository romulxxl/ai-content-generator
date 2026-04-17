import { createClient } from '@/lib/supabase/server'
import { isValidContentType } from '@/lib/prompts'

const PAGE_LIMIT = 20

export async function GET(request: Request) {
  const supabase = createClient()

  let user
  try {
    const { data, error: authError } = await supabase.auth.getUser()
    if (authError) return Response.json({ error: 'Auth check failed' }, { status: 503 })
    user = data.user
  } catch {
    return Response.json({ error: 'Auth check failed. Please refresh and try again.' }, { status: 503 })
  }

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? String(PAGE_LIMIT), 10), 50)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0)

  const { data, error, count } = await supabase
    .from('generations')
    .select('id, content_type, inputs, result, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: data ?? [], total: count ?? 0 })
}

export async function POST(request: Request) {
  const supabase = createClient()

  let user
  try {
    const { data, error: authError } = await supabase.auth.getUser()
    if (authError) return Response.json({ error: 'Auth check failed' }, { status: 503 })
    user = data.user
  } catch {
    return Response.json({ error: 'Auth check failed. Please refresh and try again.' }, { status: 503 })
  }

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { contentType: unknown; inputs: unknown; result: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { contentType, inputs, result } = body

  if (!isValidContentType(contentType)) {
    return Response.json({ error: 'Invalid content type' }, { status: 400 })
  }

  if (!result || typeof result !== 'string') {
    return Response.json({ error: 'result is required and must be a string' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('generations')
    .insert({
      user_id: user.id,
      content_type: contentType,
      inputs: (inputs && typeof inputs === 'object') ? inputs : {},
      result,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}
