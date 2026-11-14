import { GoogleAuth } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import type { CardType } from '@/types'
import { PASS_CONFIGS, getStampLabel } from './pass-config'

function getCredentials() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!json) throw new Error('Google Wallet not configured. Add GOOGLE_SERVICE_ACCOUNT_JSON to .env')
  return JSON.parse(json)
}

function getIssuerId() {
  const id = process.env.GOOGLE_WALLET_ISSUER_ID
  if (!id) throw new Error('Add GOOGLE_WALLET_ISSUER_ID to .env')
  return id
}

async function getAuthClient() {
  const credentials = getCredentials()
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  })
  return auth.getClient()
}

function classId(type: CardType) {
  return `${getIssuerId()}.hairitage_${type}`
}

function objectId(type: CardType, cardId: string) {
  return `${getIssuerId()}.hairitage_${type}_${cardId}`
}

// Creates the Loyalty Class (once per card type — idempotent)
export async function ensureLoyaltyClass(type: CardType): Promise<void> {
  const config = PASS_CONFIGS[type]
  const client = await getAuthClient()
  const classUrl = `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${classId(type)}`

  const { data: existing } = await (client as any).request({ url: classUrl }).catch(() => ({ data: null }))
  if (existing) return

  const loyaltyClass = {
    id: classId(type),
    issuerName: "HAIR'ITAGE",
    programName: config.subLabel,
    programLogo: {
      sourceUri: { uri: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png` },
      contentDescription: { defaultValue: { language: 'fr-FR', value: "HAIR'ITAGE" } }
    },
    hexBackgroundColor: '#1A1A14',
    countryCode: 'MA',
    reviewStatus: 'UNDER_REVIEW',
  }

  await (client as any).request({
    url: 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass',
    method: 'POST',
    data: loyaltyClass,
  })
}

// Creates a Loyalty Object for a specific customer card
export async function createGooglePassObject(
  type: CardType,
  cardId: string,
  customerName: string,
  stamps: number
): Promise<string> {
  const config = PASS_CONFIGS[type]
  const client = await getAuthClient()

  const loyaltyObject = {
    id: objectId(type, cardId),
    classId: classId(type),
    state: 'ACTIVE',
    accountId: cardId,
    accountName: customerName,
    loyaltyPoints: {
      label: 'Tampons',
      balance: { int: stamps },
    },
    textModulesData: [
      {
        header: 'CADEAU',
        body: `${config.totalStamps} tampons = ${config.gift}`,
        id: 'gift_info',
      },
      {
        header: 'PROGRESSION',
        body: getStampLabel(stamps, config.totalStamps),
        id: 'progress',
      }
    ],
    linksModuleData: {
      uris: [
        {
          uri: process.env.GOOGLE_MAPS_URL ?? 'https://maps.google.com',
          description: 'Laisser un avis Google',
          id: 'google_maps',
        }
      ]
    },
    barcode: {
      type: 'QR_CODE',
      value: cardId,
      alternateText: cardId,
    },
  }

  await (client as any).request({
    url: 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject',
    method: 'POST',
    data: loyaltyObject,
  })

  return objectId(type, cardId)
}

// Updates stamps on existing Google pass
export async function updateGooglePassStamps(
  type: CardType,
  cardId: string,
  stamps: number
): Promise<void> {
  const config = PASS_CONFIGS[type]
  const client = await getAuthClient()

  await (client as any).request({
    url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId(type, cardId)}`,
    method: 'PATCH',
    data: {
      loyaltyPoints: { balance: { int: stamps } },
      textModulesData: [
        {
          header: 'PROGRESSION',
          body: getStampLabel(stamps, config.totalStamps),
          id: 'progress',
        }
      ],
    },
  })
}

// Generates a "Save to Google Wallet" JWT link
export function generateGoogleWalletUrl(type: CardType, cardId: string): string {
  const credentials = getCredentials()

  const payload = {
    iss: credentials.client_email,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: {
      loyaltyObjects: [{ id: objectId(type, cardId) }],
    },
  }

  const token = jwt.sign(payload, credentials.private_key, { algorithm: 'RS256' })
  return `https://pay.google.com/gp/v/save/${token}`
}
