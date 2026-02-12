export const runtime = 'edge'
export const revalidate = 30

export type PricePoint = { 
  usd: number
  source: 'geckoterminal' | 'coingecko' | 'none'
  updatedAt: string 
}

async function fetchGeckoTerminal(tokenPool: string): Promise<PricePoint> {
  const url = `${process.env.NEXT_PUBLIC_GECKOTERMINAL_API}/pools/${tokenPool}`
  const res = await fetch(url, { next: { revalidate: 15 } })
  if (!res.ok) throw new Error('GeckoTerminal bad response')
  
  const json = await res.json()
  const price = Number(json?.data?.attributes?.base_token_price_usd ?? 0)
  if (!price) throw new Error('GeckoTerminal no price')
  
  return { 
    usd: price, 
    source: 'geckoterminal',
    updatedAt: new Date().toISOString()
  }
}

async function fetchCoinGeckoOnchain(params: { chainId: number; address: string }): Promise<PricePoint> {
  const base = process.env.NEXT_PUBLIC_COINGECKO_API ?? 'https://api.coingecko.com/api/v3'
  const key = process.env.COINGECKO_API_KEY
  const url = new URL(`${base}/onchain/networks/${params.chainId}/tokens/${params.address}`)
  
  if (key) url.searchParams.set('x_cg_pro_api_key', key)
  
  const res = await fetch(url, { next: { revalidate: 20 } })
  if (!res.ok) throw new Error('CoinGecko bad response')
  
  const json = await res.json()
  const price = Number(json?.data?.attributes?.price_usd ?? 0)
  if (!price) throw new Error('CoinGecko no price')
  
  return { 
    usd: price, 
    source: 'coingecko',
    updatedAt: new Date().toISOString()
  }
}

export async function GET() {
  try {
    // Try GeckoTerminal first (replace with real pool address)
    const poolAddress = process.env.MARS_POOL_ADDRESS || 'placeholder-pool-address'
    const gt = await fetchGeckoTerminal(poolAddress)
    return Response.json(gt)
  } catch (e) {
    try {
      // Fallback to CoinGecko on-chain
      const cg = await fetchCoinGeckoOnchain({ 
        chainId: 1, 
        address: process.env.MARS_TOKEN_ADDRESS || 'placeholder-token-address'
      })
      return Response.json(cg)
    } catch {
      // Final fallback - return placeholder data
      return Response.json({ 
        usd: 0, 
        source: 'none', 
        updatedAt: new Date().toISOString() 
      } as PricePoint, { status: 200 })
    }
  }
}

