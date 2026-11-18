import { NextRequest, NextResponse } from 'next/server'
import { GoogleAuth } from 'google-auth-library'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    if (!credentialsJson) return NextResponse.json({ error: 'No credentials' }, { status: 500 })

    const credentials = JSON.parse(credentialsJson)
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID

    // Step 1: Try auth
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    })
    const client = await auth.getClient()
    const token = await client.getAccessToken()

    // Step 2: Try creating a loyalty class via REST
    const classId = `${issuerId}.hairitage_debug_test`
    let classResult: any = null
    let classError: any = null
    try {
      const res = await (client as any).request({
        url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${classId}`,
        method: 'GET',
      })
      classResult = { exists: true, status: res.status }
    } catch (e: any) {
      if (e.status === 404) {
        // Try creating
        try {
          const createRes = await (client as any).request({
            url: 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass',
            method: 'POST',
            data: {
              id: classId,
              issuerName: "HAIR'ITAGE",
              programName: 'Debug Test',
              programLogo: {
                sourceUri: { uri: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://hairitage-eight.vercel.app'}/logo.png` },
                contentDescription: { defaultValue: { language: 'fr-FR', value: "HAIR'ITAGE" } },
              },
              loyaltyPointsLabel: 'Tampons',
              hexBackgroundColor: '#1A1A14',
              countryCode: 'MA',
              reviewStatus: 'DRAFT',
            },
          })
          classResult = { created: true, status: createRes.status }
        } catch (createErr: any) {
          classError = { message: createErr.message, status: createErr.status, details: createErr.response?.data }
        }
      } else {
        classError = { message: e.message, status: e.status, details: e.response?.data }
      }
    }

    // Step 3: Generate a minimal JWT
    const payload = {
      iss: credentials.client_email,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      payload: {
        loyaltyObjects: [{
          id: `${issuerId}.hairitage_debug_obj_1`,
          classId,
          state: 'ACTIVE',
          accountId: 'debug',
          accountName: 'Debug User',
          loyaltyPoints: { label: 'Tampons', balance: { int: 0 } },
        }],
      },
    }
    const jwtToken = jwt.sign(payload, credentials.private_key, { algorithm: 'RS256' })
    const walletUrl = `https://pay.google.com/gp/v/save/${jwtToken}`

    return NextResponse.json({
      issuer_id: issuerId,
      service_account: credentials.client_email,
      auth_ok: !!token.token,
      class: classResult,
      class_error: classError,
      wallet_url: walletUrl,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
  }
}
