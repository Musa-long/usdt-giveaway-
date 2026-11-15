'use client'
import { useState } from 'react'
const CH = ['1','56','137','42161','8453','10','tron']
const NAME: Record<string,string> = { '1':'Ethereum','56':'BSC','137':'Polygon','42161':'Arbitrum','8453':'Base','10':'Optimism',tron:'Tron' }

export default function PoolForm({ pools }: { pools: any[] }) {
  const [chain, setChain] = useState('1')
  const [address, setAddress] = useState('')
  const [msg, setMsg] = useState('')

  async function add() {
    setMsg('')
    const r = await fetch('/api/admin/pools', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chain, address }) })
    const j = await r.json()
    setMsg(r.ok ? 'Added' : j.error)
    if (r.ok) location.reload()
  }

  return (
    <>
      <div className="panel">
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={chain} onChange={e => setChain(e.target.value)} style={{ width: 150, padding: 10, background: '#0B0E11', color: '#fff', border: '1px solid #2B3139', borderRadius: 8 }}>
            {CH.map(c => <option key={c} value={c}>{NAME[c]}</option>)}
          </select>
          <input value={address} onChange={e => setAddress(e.target.value)}
            placeholder={chain === 'tron' ? 'T…' : '0x…'}
            style={{ flex: 1, padding: 10, background: '#0B0E11', color: '#fff', border: '1px solid #2B3139', borderRadius: 8 }} />
          <button className="btn" style={{ width: 90 }} onClick={add}>Add</button>
        </div>
        {msg && <div className="warn">{msg}</div>}
      </div>

      <table><thead><tr><th>Chain</th><th>Address</th><th>Hits</th><th></th></tr></thead>
        <tbody>{pools.map(p => (
          <tr key={p.id}><td>{NAME[p.chain] ?? p.chain}</td><td className="addr">{p.address}</td><td>{p.hits}</td>
            <td><button className="btn ghost" style={{ padding: '4px 10px', width: 'auto', margin: 0 }}
              onClick={async () => { await fetch(`/api/admin/pools?id=${p.id}`, { method: 'DELETE' }); location.reload() }}>×</button></td></tr>
        ))}</tbody></table>
    </>
  )
}
