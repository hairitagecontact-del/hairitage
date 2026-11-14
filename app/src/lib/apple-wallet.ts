import { PKPass } from 'passkit-generator'
import { randomUUID } from 'crypto'
import type { CardType } from '@/types'
import { PASS_CONFIGS, getStampLabel } from './pass-config'

function getCertificates() {
  const p12Base64 = process.env.APPLE_CERT_P12_BASE64
  const wwdrBase64 = process.env.APPLE_WWDR_CERT_BASE64
  const password = process.env.APPLE_CERT_PASSWORD

  if (!p12Base64 || !wwdrBase64 || !password) {
    throw new Error('Apple Wallet certificates not configured. Add APPLE_CERT_P12_BASE64, APPLE_WWDR_CERT_BASE64 and APPLE_CERT_PASSWORD to .env')
  }

  return {
    signerCert: Buffer.from(p12Base64, 'base64'),
    wwdr: Buffer.from(wwdrBase64, 'base64'),
    signerKey: Buffer.from(p12Base64, 'base64'),
    signerKeyPassphrase: password,
  }
}

export async function createApplePass(
  type: CardType,
  customerName: string,
  stamps: number,
  serial: string = randomUUID()
): Promise<{ buffer: Buffer; serial: string }> {
  const config = PASS_CONFIGS[type]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const teamId = process.env.APPLE_TEAM_ID!
  const passTypeId = process.env.APPLE_PASS_TYPE_ID!
  const certs = getCertificates()

  const pass = new PKPass({}, {
    wwdr: certs.wwdr,
    signerCert: certs.signerCert,
    signerKey: certs.signerKey,
    signerKeyPassphrase: certs.signerKeyPassphrase,
  }, {
    serialNumber: serial,
    passTypeIdentifier: passTypeId,
    teamIdentifier: teamId,
    organizationName: "HAIR'ITAGE",
    description: config.subLabel,
    backgroundColor: config.backgroundColor,
    foregroundColor: config.foregroundColor,
    labelColor: config.labelColor,
    webServiceURL: `${appUrl}/api/passes/apple`,
    authenticationToken: serial, // used as auth token for pass updates
    storeCard: {
      primaryFields: [
        {
          key: 'stamps',
          label: 'TAMPONS',
          value: getStampLabel(stamps, config.totalStamps),
          changeMessage: 'Tampon ajouté !'
        }
      ],
      secondaryFields: [
        {
          key: 'gift',
          label: 'CADEAU',
          value: config.gift,
        },
        {
          key: 'client',
          label: 'CLIENT',
          value: customerName,
        }
      ],
      auxiliaryFields: [
        {
          key: 'type',
          label: 'TYPE',
          value: config.label,
        }
      ],
      backFields: [
        {
          key: 'info',
          label: "HAIR'ITAGE",
          value: `Présentez cette carte à chaque visite. ${config.totalStamps} tampons = ${config.gift}.`,
        },
        {
          key: 'contact',
          label: 'CONTACT',
          value: 'hairitage.ma',
        }
      ]
    },
    barcodes: [{
      message: serial,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
    }]
  })

  const buffer = await pass.getAsBuffer()
  return { buffer, serial }
}

export async function getApplePassBuffer(
  type: CardType,
  customerName: string,
  stamps: number,
  serial: string
): Promise<Buffer> {
  const { buffer } = await createApplePass(type, customerName, stamps, serial)
  return buffer
}

// Called by Apple when stamps change — sends a push to the device
export async function pushPassUpdate(pushToken: string): Promise<void> {
  // APNs push notifications require the 'apn' package + Apple certificates
  // This will be enabled once Apple Developer account is configured
  if (!process.env.APPLE_CERT_P12_BASE64) {
    console.log('Apple push skipped: certificates not configured')
    return
  }
  // TODO: implement APNs push when Apple certs are added
  console.log('Apple push token registered:', pushToken)
}
