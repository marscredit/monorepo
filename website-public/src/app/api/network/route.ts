import { fetchNetworkStatus, type NetworkStatus } from "@/lib/network"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const CACHE_CONTROL = "public, max-age=0, s-maxage=5, stale-while-revalidate=10"

export async function GET() {
  const status: NetworkStatus = await fetchNetworkStatus({ cache: "no-store" })

  return Response.json(status, {
    status: 200,
    headers: {
      "Cache-Control": CACHE_CONTROL,
    },
  })
}
