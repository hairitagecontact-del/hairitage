import { NextRequest, NextResponse } from 'next/server'
import { getCardBySerial } from '@/lib/db'

// Apple calls this endpoint to fetch the updated pass after a push notification
export async function GET(
  req: NextRequest,
  { params }: { params: { serial: string } }
) {
  const { serial } = params

  // Verify auth token (Apple sends it in Authorization header)
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('ApplePass ', '')
  if (token !== serial) {
    return new NextResponse(null, { status: 401 })
  }

  const card = await getCardBySerial(serial)
  if (!card) return new NextResponse(null, { status: 404 })

  // Serve the .pkpass file from Supabase Storage
  const { createClient } = await import('@supabase/supabase-js')
  const storage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await storage.storage
    .from('passes')
    .download(`${serial}.pkpass`)

  if (!data) return new NextResponse(null, { status: 404 })

  const buffer = Buffer.from(await data.arrayBuffer())

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Last-Modified': card.updated_at,
    },
  })
}

// Apple registers a device for push notifications
export async function POST(
  req: NextRequest,
  { params }: { params: { serial: string } }
) {
  const { serial } = params
  const { pushToken } = await req.json()
  const deviceLibId = req.headers.get('x-apple-device-identifier') ?? ''

  const { updateApplePushToken } = await import('@/lib/db')
  await updateApplePushToken(serial, pushToken, deviceLibId)

  return new NextResponse(null, { status: 201 })
}

// Download endpoint (used when user first adds pass)
export async function HEAD(
  req: NextRequest,
  { params }: { params: { serial: string } }
) {
  return new NextResponse(null, { status: 200 })
}
