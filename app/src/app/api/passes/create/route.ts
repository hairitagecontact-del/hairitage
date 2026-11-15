import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getOrCreateCustomer, createCard, getCardByCustomerAndType } from '@/lib/db'
import { createApplePass } from '@/lib/apple-wallet'
import { ensureLoyaltyClass, createGooglePassObject, generateGoogleWalletUrl } from '@/lib/google-wallet'
import type { CardType } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { type, name, phone } = await req.json() as {
      type: CardType
      name: string
      phone: string
    }

    if (!['homme', 'coiffure', 'esthetique'].includes(type)) {
      return NextResponse.json({ error: 'Invalid card type' }, { status: 400 })
    }
    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Name and phone required' }, { status: 400 })
    }

    const customer = await getOrCreateCustomer(phone.trim(), name.trim())

    // Don't create duplicate cards for same type
    const existing = await getCardByCustomerAndType(customer.id, type)
    if (existing) {
      const googleUrl = existing.google_pass_id
        ? generateGoogleWalletUrl(type, existing.id)
        : undefined

      return NextResponse.json({
        exists: true,
        card_id: existing.id,
        serial: existing.apple_pass_serial,
        apple_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/passes/apple/${existing.apple_pass_serial}/download`,
        google_url: googleUrl,
      })
    }

    const serial = randomUUID()
    const card = await createCard(customer.id, type, serial)

    let appleUrl: string | undefined
    let googleUrl: string | undefined

    // Generate Apple pass — skip if certs not configured
    if (process.env.APPLE_CERT_P12_BASE64) {
      try {
        const { buffer } = await createApplePass(type, name, 0, serial)
        const { createClient } = await import('@supabase/supabase-js')
        const storage = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        await storage.storage
          .from('passes')
          .upload(`${serial}.pkpass`, buffer, { contentType: 'application/vnd.apple.pkpass', upsert: true })
        appleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/passes/apple/${serial}/download`
      } catch (e) {
        console.error('Apple pass error (skipped):', e)
      }
    }

    // Generate Google pass — skip if not configured
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        await ensureLoyaltyClass(type)
        await createGooglePassObject(type, card.id, name, 0)
        googleUrl = generateGoogleWalletUrl(type, card.id)
      } catch (e) {
        console.error('Google pass error (skipped):', e)
      }
    }

    if (!appleUrl && !googleUrl) {
      return NextResponse.json({ error: 'Aucun Wallet configuré' }, { status: 503 })
    }

    return NextResponse.json({
      card_id: card.id,
      serial,
      apple_url: appleUrl,
      google_url: googleUrl,
    })
  } catch (err: any) {
    console.error('create pass error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
