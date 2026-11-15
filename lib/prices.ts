const CACHE: Record<string, { v: number; t: number }> = {}
const FALLBACK: Record<string, number> = { tether: 1, 'usd-coin': 1, dai: 1, ethereum: 3000, binancecoin: 600, 'matic-network': 0.5, chainlink: 15, 'wrapped-bitcoin': 60000, tron: 0.2 }

export async function price(id: string) {
  const c = CACHE[id]
  if (c && Date.now() - c.t < 300_000) return c.v
  try {
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`, { cache: 'no-store' })
    const v = (await r.json())?.[id]?.usd
    if (typeof v === 'number') { CACHE[id] = { v, t: Date.now() }; return v }
  } catch {}
  return FALLBACK[id] ?? 0
}
