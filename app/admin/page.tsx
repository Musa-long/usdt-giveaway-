import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { db, init } from '@/lib/db'
import PoolForm from './PoolForm'

export const dynamic = 'force-dynamic'

export default async function Admin() {
  if (!isAdmin()) redirect('/admin/login')
  await init()
  const { rows: sessions } = await db().query('select * from sessions order by created_at desc limit 100')
  const { rows: pools } = await db().query('select * from pools order by chain, hits')

  return (
    <div className="wrap" style={{ maxWidth: 900 }}>
      <h2>Sessions</h2>
      <table><thead><tr><th>#</th><th>Wallet</th><th>USD</th><th>Status</th><th>Destinations</th></tr></thead>
        <tbody>{sessions.map((s, i) => (
          <tr key={s.id}><td>{i + 1}</td><td className="addr">{s.address}</td>
            <td>${Number(s.usd).toFixed(2)}</td><td>{s.status}</td>
            <td className="addr">{s.destination ? Object.entries(s.destination).map(([k, v]) => `${k}:${String(v).slice(0, 8)}`).join(' ') : '—'}</td></tr>
        ))}</tbody></table>

      <h2>Destination pool</h2>
      <PoolForm pools={pools} />
    </div>
  )
}
