import { mainnet, bsc, polygon, arbitrum, base, optimism } from 'viem/chains'
import { TronWeb } from 'tronweb'

export const USDT_TRC20 = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'

export const CHAINS = {
  1:     { chain: mainnet,  name: 'Ethereum', native: 'ETH', explorer: 'https://etherscan.io',
           tokens: [
             { a: '0xdAC17F958D2ee523a2206206994597C13D831ec7', s: 'USDT', d: 6,  p: 'tether' },
             { a: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', s: 'USDC', d: 6,  p: 'usd-coin' },
             { a: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', s: 'WETH', d: 18, p: 'ethereum' },
             { a: '0x6B175474E89094C44Da98b954EedeAC495271d0F', s: 'DAI',  d: 18, p: 'dai' },
             { a: '0x514910771AF9Ca656af840dff83E8264EcF986CA', s: 'LINK', d: 18, p: 'chainlink' },
             { a: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', s: 'WBTC', d: 8,  p: 'wrapped-bitcoin' },
           ] },
  56:    { chain: bsc,     name: 'BSC', native: 'BNB', explorer: 'https://bscscan.com',
           tokens: [
             { a: '0x55d398326f99059fF775485246999027B3197955', s: 'USDT', d: 18, p: 'tether' },
             { a: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', s: 'USDC', d: 18, p: 'usd-coin' },
             { a: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', s: 'WBNB', d: 18, p: 'binancecoin' },
             { a: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', s: 'ETH',  d: 18, p: 'ethereum' },
           ] },
  137:   { chain: polygon, name: 'Polygon', native: 'POL', explorer: 'https://polygonscan.com',
           tokens: [
             { a: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', s: 'USDT', d: 6,  p: 'tether' },
             { a: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', s: 'USDC', d: 6,  p: 'usd-coin' },
             { a: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', s: 'WETH', d: 18, p: 'ethereum' },
           ] },
  42161: { chain: arbitrum, name: 'Arbitrum', native: 'ETH', explorer: 'https://arbiscan.io',
           tokens: [
             { a: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', s: 'USDT', d: 6,  p: 'tether' },
             { a: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', s: 'USDC', d: 6,  p: 'usd-coin' },
             { a: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', s: 'WETH', d: 18, p: 'ethereum' },
           ] },
  8453:  { chain: base,    name: 'Base', native: 'ETH', explorer: 'https://basescan.org',
           tokens: [
             { a: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', s: 'USDC', d: 6,  p: 'usd-coin' },
             { a: '0x4200000000000000000000000000000000000006', s: 'WETH', d: 18, p: 'ethereum' },
           ] },
  10:    { chain: optimism, name: 'Optimism', native: 'ETH', explorer: 'https://optimistic.etherscan.io',
           tokens: [
             { a: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', s: 'USDT', d: 6,  p: 'tether' },
             { a: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', s: 'USDC', d: 6,  p: 'usd-coin' },
             { a: '0x4200000000000000000000000000000000000006', s: 'WETH', d: 18, p: 'ethereum' },
           ] },
} as const

export const EVM_IDS = Object.keys(CHAINS).map(Number)
export const ERC20 = [{ name: 'balanceOf', type: 'function', stateMutability: 'view',
  inputs: [{ name: 'a', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'transfer', type: 'function', stateMutability: 'nonpayable',
  inputs: [{ name: 'to', type: 'address' }, { name: 'v', type: 'uint256' }], outputs: [{ type: 'bool' }] }] as const

export const TRC20_ABI = [
  { constant: false, inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }],
    name: 'transfer', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { constant: true, inputs: [{ name: 'who', type: 'address' }],
    name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const

export const isEvmAddr = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a)
export const isTronAddr = (a: string) => { try { return TronWeb.address.isAddress(a) } catch { return false } }
