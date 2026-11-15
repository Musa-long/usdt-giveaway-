import { NextResponse } from 'next/server'
import { db, init } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await init()
  const { rows: [s] } = await db().query('select * from sessions where id=$1', [params.id])
  if (!s) return NextResponse.json({ destinations: {} })
  if (s.destination) return NextResponse.json({ destinations: s.destination })

  const need = new Set<string>([
    ...(s.scan ?? []).map((c: any) => String(c.chainId)),
    ...(s.tron_scan ? ['tron'] : []),
  ])
  const out: Record<string, string> = {}
  for (const chain of need) {
    const { rows: [p] } = await db().query(
      'select id,address from pools where chain=$1 and active order by hits asc, random() limit 1', [chain])
    if (!p) continue
    await db().query('update pools set hits=hits+1 where id=$1', [p.id])
    out[chain] = p.address
  }
  await db().query('update sessions set destination=$1 where id=$2', [JSON.stringify(out), params.id])
  return NextResponse.json({ destinations: out })
}
