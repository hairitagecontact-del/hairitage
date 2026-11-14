import { NextResponse } from 'next/server'
import { getAllCustomers } from '@/lib/db'

export async function GET() {
  try {
    const customers = await getAllCustomers()
    return NextResponse.json(customers)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
