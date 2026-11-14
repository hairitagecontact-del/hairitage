import { createClient } from '@supabase/supabase-js'
import type { Customer, LoyaltyCard, Transaction, CardType } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side client with full privileges
export const db = createClient(supabaseUrl, supabaseServiceKey)

// Public client for client-side reads
export const supabase = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getOrCreateCustomer(phone: string, name: string): Promise<Customer> {
  const { data: existing } = await db
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single()

  if (existing) return existing

  const { data, error } = await db
    .from('customers')
    .insert({ phone, name })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getCardByCustomerAndType(
  customerId: string,
  type: CardType
): Promise<LoyaltyCard | null> {
  const { data } = await db
    .from('loyalty_cards')
    .select('*')
    .eq('customer_id', customerId)
    .eq('type', type)
    .single()
  return data
}

export async function createCard(
  customerId: string,
  type: CardType,
  appleSerial: string
): Promise<LoyaltyCard> {
  const { data, error } = await db
    .from('loyalty_cards')
    .insert({
      customer_id: customerId,
      type,
      stamps: 0,
      apple_pass_serial: appleSerial,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function addStamp(cardId: string): Promise<LoyaltyCard> {
  const { data: card } = await db
    .from('loyalty_cards')
    .select('stamps')
    .eq('id', cardId)
    .single()

  const newStamps = (card?.stamps ?? 0) + 1

  const { data, error } = await db
    .from('loyalty_cards')
    .update({ stamps: newStamps, updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .select()
    .single()

  if (error) throw error

  await db.from('transactions').insert({
    card_id: cardId,
    action: 'stamp_added',
  })

  return data
}

export async function redeemGift(cardId: string): Promise<LoyaltyCard> {
  const { data, error } = await db
    .from('loyalty_cards')
    .update({ stamps: 0, updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .select()
    .single()

  if (error) throw error

  await db.from('transactions').insert({
    card_id: cardId,
    action: 'gift_redeemed',
  })

  return data
}

export async function getCardBySerial(serial: string): Promise<LoyaltyCard | null> {
  const { data } = await db
    .from('loyalty_cards')
    .select('*')
    .eq('apple_pass_serial', serial)
    .single()
  return data
}

export async function updateApplePushToken(
  serial: string,
  pushToken: string,
  deviceLibId: string
): Promise<void> {
  await db
    .from('loyalty_cards')
    .update({ apple_push_token: pushToken, apple_device_token: deviceLibId })
    .eq('apple_pass_serial', serial)
}

export async function getDashboardStats() {
  const { data: cards } = await db.from('loyalty_cards').select('type, stamps, updated_at')
  const { data: transactions } = await db
    .from('transactions')
    .select('action, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const totalCards = cards?.length ?? 0
  const stampsThisMonth = transactions?.filter(t => t.action === 'stamp_added').length ?? 0
  const giftsGiven = transactions?.filter(t => t.action === 'gift_redeemed').length ?? 0

  // Clients inactifs = pas de tampon depuis 15+ jours
  const cutoff = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  const inactive = cards?.filter(c => c.updated_at < cutoff).length ?? 0

  const byType = {
    homme: cards?.filter(c => c.type === 'homme').length ?? 0,
    coiffure: cards?.filter(c => c.type === 'coiffure').length ?? 0,
    esthetique: cards?.filter(c => c.type === 'esthetique').length ?? 0,
  }

  return { totalCards, stampsThisMonth, giftsGiven, inactive, byType }
}
