import { NextResponse } from 'next/server'
import { db, init } from '@/lib/db'
import { isAdmin } from '@/lib/auth'
import { isEvmAddr, isTronAddr } from '@/lib/chains'

export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  await init()
  const { chain, address } = await req.json()
  const ok = chain === 'tron' ? isTronAddr(address) : isEvmAddr(address)
  if (!ok) return NextResponse.json({ error: `Invalid ${chain === 'tron' ? 'Tron' : 'EVM'} address` }, { status: 400 })
  await db().query('insert into pools (chain,address) values ($1,$2)', [chain, address])
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  await init()
  await db().query('delete from pools where id=$1', [new URL(req.url).searchParams.get('id')])
  return NextResponse.json({ ok: true })
}
