import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function verifyPin(req: NextRequest): boolean {
  const pin = req.headers.get('x-caisse-pin')
  return pin === process.env.CAISSE_PIN
}

// Search customers by phone or name (for cashier)
export async function GET(req: NextRequest) {
  if (!verifyPin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json([])

  const { data } = await db
    .from('customers')
    .select(`
      id, name, phone,
      loyalty_cards (id, type, stamps, updated_at)
    `)
    .or(`phone.ilike.%${q}%,name.ilike.%${q}%`)
    .limit(10)

  return NextResponse.json(data ?? [])
}
