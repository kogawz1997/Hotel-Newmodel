import { NextRequest, NextResponse } from 'next/server'
import { requireHotelAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const hotelId = searchParams.get('hotel_id')

  const ctx = await requireHotelAccess(hotelId)
  if (ctx.error) return ctx.error

  const { data, error } = await ctx.supabase
    .from('conversation_routing_rules')
    .select('*')
    .eq('hotel_id', ctx.hotelId)
    .order('emotion_score_lt', { ascending: true, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ rules: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { hotel_id, name, sentiment, emotion_score_lt, assign_to_role, sla_minutes, escalate_after_minutes } = body

  const ctx = await requireHotelAccess(hotel_id ?? null)
  if (ctx.error) return ctx.error

  if (!name || !sentiment || !assign_to_role || !sla_minutes) {
    return NextResponse.json({ error: 'name, sentiment, assign_to_role, sla_minutes required' }, { status: 400 })
  }

  const { data, error } = await ctx.supabase
    .from('conversation_routing_rules')
    .insert({
      hotel_id: ctx.hotelId,
      name,
      sentiment,
      emotion_score_lt: emotion_score_lt ?? null,
      assign_to_role,
      sla_minutes,
      escalate_after_minutes: escalate_after_minutes ?? null,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ rule: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, hotel_id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const ctx = await requireHotelAccess(hotel_id ?? null)
  if (ctx.error) return ctx.error

  const { data, error } = await ctx.supabase
    .from('conversation_routing_rules')
    .update(updates)
    .eq('id', id)
    .eq('hotel_id', ctx.hotelId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Rule not found' }, { status: 404 })

  return NextResponse.json({ rule: data })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const hotelId = searchParams.get('hotel_id')

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const ctx = await requireHotelAccess(hotelId)
  if (ctx.error) return ctx.error

  const { error } = await ctx.supabase
    .from('conversation_routing_rules')
    .delete()
    .eq('id', id)
    .eq('hotel_id', ctx.hotelId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deleted: true })
}
