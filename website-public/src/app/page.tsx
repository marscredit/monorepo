import { fetchNetworkStatus, FALLBACK_BLOCK } from "@/lib/network"
import { HomePageClient } from "@/components/home-page"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function HomePage() {
  const status = await fetchNetworkStatus({ cache: "no-store" })
  const initialBlock = status.block > 0 ? status.block : FALLBACK_BLOCK
  return <HomePageClient initialBlock={initialBlock} />
}
