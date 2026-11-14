import { PKPass } from 'passkit-generator'
import { randomUUID } from 'crypto'
import * as forge from 'node-forge'
import type { CardType } from '@/types'
import { PASS_CONFIGS, getStampLabel } from './pass-config'

function getCertificates() {
  const p12Base64 = process.env.APPLE_CERT_P12_BASE64
  const wwdrBase64 = process.env.APPLE_WWDR_CERT_BASE64
  const password = process.env.APPLE_CERT_PASSWORD

  if (!p12Base64 || !wwdrBase64 || !password) {
    throw new Error('Apple Wallet certificates not configured')
  }

  // Extract PEM cert + key from P12 using node-forge
  const p12Der = forge.util.decode64(p12Base64)
  const p12Asn1 = forge.asn1.fromDer(p12Der)
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)

  let certPem = ''
  let keyPem = ''

  for (const safeContent of p12.safeContents) {
    for (const safeBag of safeContent.safeBags) {
      if (safeBag.type === forge.pki.oids.certBag && safeBag.cert) {
        certPem = forge.pki.certificateToPem(safeBag.cert)
      }
      if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag && safeBag.key) {
        keyPem = forge.pki.privateKeyToPem(safeBag.key)
      }
    }
  }

  return {
    signerCert: certPem,
    signerKey: keyPem,
    wwdr: Buffer.from(wwdrBase64, 'base64'),
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

  const pass = new PKPass({}, certs, {
    serialNumber: serial,
    passTypeIdentifier: passTypeId,
    teamIdentifier: teamId,
    organizationName: "HAIR'ITAGE",
    description: config.subLabel,
    backgroundColor: config.backgroundColor,
    foregroundColor: config.foregroundColor,
    labelColor: config.labelColor,
    webServiceURL: `${appUrl}/api/passes/apple`,
    authenticationToken: serial,
  })

  pass.type = 'storeCard'

  pass.primaryFields.push({
    key: 'stamps',
    label: 'TAMPONS',
    value: getStampLabel(stamps, config.totalStamps),
    changeMessage: 'Tampon ajouté !',
  })

  pass.secondaryFields.push(
    { key: 'gift', label: 'CADEAU', value: config.gift },
    { key: 'client', label: 'CLIENT', value: customerName }
  )

  pass.auxiliaryFields.push({ key: 'type', label: 'TYPE', value: config.label })

  pass.backFields.push(
    {
      key: 'info',
      label: "HAIR'ITAGE",
      value: `Présentez cette carte à chaque visite. ${config.totalStamps} tampons = ${config.gift}.`,
    },
    { key: 'contact', label: 'CONTACT', value: 'hairitage.ma' }
  )

  pass.setBarcodes({ message: serial, format: 'PKBarcodeFormatQR', messageEncoding: 'iso-8859-1' })

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

export async function pushPassUpdate(pushToken: string): Promise<void> {
  if (!process.env.APPLE_CERT_P12_BASE64) {
    console.log('Apple push skipped: certificates not configured')
    return
  }
  console.log('Apple push token registered:', pushToken)
}
