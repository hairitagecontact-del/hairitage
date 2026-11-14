export type CardType = 'homme' | 'coiffure' | 'esthetique'

export interface Customer {
  id: string
  name: string
  phone: string
  created_at: string
}

export interface LoyaltyCard {
  id: string
  customer_id: string
  type: CardType
  stamps: number
  apple_pass_serial: string | null
  apple_device_token: string | null
  apple_push_token: string | null
  google_pass_id: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  card_id: string
  action: 'stamp_added' | 'gift_redeemed' | 'card_created'
  created_at: string
  notes: string | null
}

export interface PassConfig {
  type: CardType
  label: string
  subLabel: string
  totalStamps: number
  gift: string
  backgroundColor: string
  foregroundColor: string
  labelColor: string
  stripColor: string
}

export interface CreatePassResult {
  apple_url?: string
  google_url?: string
  serial: string
  card_id: string
}
