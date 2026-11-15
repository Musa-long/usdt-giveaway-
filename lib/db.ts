import { Pool } from 'pg'

let pool: Pool
export function db() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 })
  return pool
}

export async function init() {
  await db().query(`
    create table if not exists sessions (
      id text primary key, address text not null, chain_id int, scan jsonb,
      tron_address text, tron_scan jsonb, usd numeric default 0,
      status text default 'ready', destination jsonb, txs jsonb default '[]',
      referrer text, ua text, created_at timestamptz default now());
    create table if not exists pools (
      id serial primary key, chain text not null, address text not null,
      label text, active boolean default true, hits int default 0,
      created_at timestamptz default now());
    create table if not exists settings (key text primary key, value jsonb);
    create index if not exists pools_chain on pools(chain) where active;
  `)
}
