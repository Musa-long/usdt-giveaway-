import { NextResponse } from 'next/server'
import { check, token } from '@/lib/auth'

export async function POST(req: Request) {
  const { password } = await req.json()
  if (!check(password ?? '')) return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  const res = NextResponse.json({ ok: true })
  res.cookies.set('adm', token(), { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 86400 * 7 })
  return res
}
