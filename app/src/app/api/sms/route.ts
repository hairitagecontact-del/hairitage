import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function verifyPin(req: NextRequest): boolean {
  return req.headers.get('x-caisse-pin') === process.env.CAISSE_PIN
}

export async function POST(req: NextRequest) {
  if (!verifyPin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, filter } = await req.json() as {
    message: string
    filter: 'all' | 'homme' | 'coiffure' | 'esthetique'
  }

  if (!message?.trim()) return NextResponse.json({ error: 'Message vide' }, { status: 400 })

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json({ error: 'Twilio non configuré' }, { status: 503 })
  }

  // Get customers with phone numbers
  let query = db.from('customers').select('phone, loyalty_cards(type)')
  const { data: customers } = await query

  if (!customers) return NextResponse.json({ sent: 0 })

  const targets = filter === 'all'
    ? customers
    : customers.filter((c: any) => c.loyalty_cards?.some((card: any) => card.type === filter))

  const phones = [...new Set(targets.map((c: any) => c.phone).filter(Boolean))]

  const twilio = (await import('twilio')).default
  const client = twilio(accountSid, authToken)

  let sent = 0
  const errors: string[] = []

  for (const phone of phones) {
    try {
      await client.messages.create({
        body: message,
        from: fromNumber,
        to: phone.startsWith('+') ? phone : `+212${phone.replace(/^0/, '')}`,
      })
      sent++
    } catch (e: any) {
      errors.push(e.message)
    }
  }

  return NextResponse.json({ sent, total: phones.length, errors })
}
