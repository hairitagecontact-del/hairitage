import { NextRequest, NextResponse } from 'next/server'

// Direct download link for Apple Wallet pass
export async function GET(
  req: NextRequest,
  { params }: { params: { serial: string } }
) {
  const { serial } = params

  const { createClient } = await import('@supabase/supabase-js')
  const storage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await storage.storage
    .from('passes')
    .download(`${serial}.pkpass`)

  if (!data) return new NextResponse('Pass not found', { status: 404 })

  const buffer = Buffer.from(await data.arrayBuffer())

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename="hairitage.pkpass"`,
    },
  })
}
