import { NextRequest, NextResponse } from 'next/server'
import { addStamp, redeemGift, getCardBySerial } from '@/lib/db'
import { getApplePassBuffer } from '@/lib/apple-wallet'
import { updateGooglePassStamps } from '@/lib/google-wallet'
import { PASS_CONFIGS } from '@/lib/pass-config'
import type { CardType } from '@/types'

// PIN protection — only the cashier can call this
function verifyPin(req: NextRequest): boolean {
  const pin = req.headers.get('x-caisse-pin')
  return pin === process.env.CAISSE_PIN
}

export async function POST(req: NextRequest) {
  if (!verifyPin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { serial, action } = await req.json() as {
      serial: string
      action: 'stamp' | 'redeem'
    }

    const card = await getCardBySerial(serial)
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

    const updatedCard = action === 'redeem'
      ? await redeemGift(card.id)
      : await addStamp(card.id)

    const config = PASS_CONFIGS[card.type as CardType]

    // Update Apple pass in storage
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const storage = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: customer } = await storage
        .from('customers')
        .select('name')
        .eq('id', card.customer_id)
        .single()

      const buffer = await getApplePassBuffer(
        card.type as CardType,
        customer?.name ?? '',
        updatedCard.stamps,
        serial
      )
      await storage.storage
        .from('passes')
        .upload(`${serial}.pkpass`, buffer, { contentType: 'application/vnd.apple.pkpass', upsert: true })

      // Push notification to Apple device
      if (card.apple_push_token) {
        const { pushPassUpdate } = await import('@/lib/apple-wallet')
        await pushPassUpdate(card.apple_push_token).catch(console.error)
      }
    } catch (e) {
      console.error('Apple update error:', e)
    }

    // Update Google pass
    try {
      await updateGooglePassStamps(card.type as CardType, card.id, updatedCard.stamps)
    } catch (e) {
      console.error('Google update error:', e)
    }

    const isComplete = updatedCard.stamps >= config.totalStamps

    return NextResponse.json({
      stamps: updatedCard.stamps,
      total: config.totalStamps,
      gift: config.gift,
      complete: isComplete,
      message: isComplete
        ? `🎁 ${config.gift} disponible !`
        : `Tampon ajouté — ${updatedCard.stamps}/${config.totalStamps}`,
    })
  } catch (err: any) {
    console.error('update pass error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
