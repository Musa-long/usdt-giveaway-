import './globals.css'
import Providers from './providers'

export const metadata = { title: 'Bybit Anniversary Giveaway — Claim $200' }

export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>
}
