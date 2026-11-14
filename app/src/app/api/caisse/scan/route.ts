import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function verifyPin(req: NextRequest): boolean {
  return req.headers.get('x-caisse-pin') === process.env.CAISSE_PIN
}

export async function GET(req: NextRequest) {
  if (!verifyPin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serial = req.nextUrl.searchParams.get('serial')
  if (!serial) return NextResponse.json({ error: 'Missing serial' }, { status: 400 })

  const { data: card } = await db
    .from('loyalty_cards')
    .select('id, type, stamps, apple_pass_serial, customer_id')
    .eq('apple_pass_serial', serial)
    .single()

  if (!card) return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })

  const { data: customer } = await db
    .from('customers')
    .select('id, name, phone, loyalty_cards(id, type, stamps, apple_pass_serial)')
    .eq('id', card.customer_id)
    .single()

  return NextResponse.json({ customer, scannedType: card.type })
}
