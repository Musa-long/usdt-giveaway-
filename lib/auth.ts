import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const secret = () => process.env.ADMIN_PASSWORD ?? 'dev'
export const token = () => createHmac('sha256', secret()).update('admin').digest('hex')

export function check(pw: string) {
  const a = Buffer.from(pw); const b = Buffer.from(secret())
  return a.length === b.length && timingSafeEqual(a, b)
}
export const isAdmin = () => cookies().get('adm')?.value === token()
