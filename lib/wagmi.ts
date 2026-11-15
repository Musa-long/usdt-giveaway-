'use client'
import { createConfig, http } from 'wagmi'
import { mainnet, bsc, polygon, arbitrum, base, optimism } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, bsc, polygon, arbitrum, base, optimism],
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID! }),
    coinbaseWallet({ appName: 'Giveaway' }),
  ],
  transports: {
    [mainnet.id]: http(), [bsc.id]: http(), [polygon.id]: http(),
    [arbitrum.id]: http(), [base.id]: http(), [optimism.id]: http(),
  },
  ssr: true,
})
