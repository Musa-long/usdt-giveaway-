import { NextResponse } from 'next/server'
import { db, init } from '@/lib/db'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await init()
  const { txs = [] } = await req.json()
  await db().query('update sessions set status=$1, txs=$2 where id=$3', ['done', JSON.stringify(txs), params.id])
  return NextResponse.json({ ok: true })
}
