import { createClient } from '@/lib/supabase/server'
import { isValidContentType } from '@/lib/prompts'

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
