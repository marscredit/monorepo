/**
 * NetworkService: JSON-RPC client for Mars Credit / Geth node.
 * Local (miner's Geth) and optional remote (rpc.marscredit.xyz) for balance/sync status.
 */

const REMOTE_RPC = 'https://rpc.marscredit.xyz';

let rpcId = 0;

async function rpc<T>(url: string, method: string, params: unknown[] = []): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: ++rpcId,
    }),
  });
  if (!res.ok) {
    throw new Error(`RPC HTTP ${res.status}: ${res.statusText}`);
  }
  const data = (await res.json()) as { result?: T; error?: { message: string } };
  if (data.error) {
    throw new Error(data.error.message || 'RPC error');
  }
  return data.result as T;
}

/** Set mining reward address (etherbase). */
export async function minerSetEtherbase(rpcUrl: string, address: string): Promise<boolean> {
  return rpc<boolean>(rpcUrl, 'miner_setEtherbase', [address]);
}

/** Start mining with N threads. */
export async function minerStart(rpcUrl: string, threads: number = 1): Promise<void> {
  await rpc(rpcUrl, 'miner_start', [threads]);
}

/** Stop mining. */
export async function minerStop(rpcUrl: string): Promise<void> {
  await rpc(rpcUrl, 'miner_stop');
}

/** Check if node is mining. */
export async function ethMining(rpcUrl: string): Promise<boolean> {
  return rpc<boolean>(rpcUrl, 'eth_mining');
}

/** Get current hashrate (hex). */
export async function ethHashrate(rpcUrl: string): Promise<string> {
  return rpc<string>(rpcUrl, 'eth_hashrate');
}

/** Get latest block number (hex). */
export async function ethBlockNumber(rpcUrl: string): Promise<string> {
  return rpc<string>(rpcUrl, 'eth_blockNumber');
}

/** Get sync status: false if synced, or { currentBlock, highestBlock, ... }. */
export async function ethSyncing(rpcUrl: string): Promise<false | { currentBlock: string; highestBlock: string }> {
  return rpc<false | { currentBlock: string; highestBlock: string }>(rpcUrl, 'eth_syncing');
}

/** Get balance in wei (hex). */
export async function ethGetBalance(rpcUrl: string, address: string): Promise<string> {
  return rpc<string>(rpcUrl, 'eth_getBalance', [address, 'latest']);
}

/** Get peer count (hex). */
export async function netPeerCount(rpcUrl: string): Promise<string> {
  return rpc<string>(rpcUrl, 'net_peerCount');
}

/** Get network/chain ID (hex). */
export async function netVersion(rpcUrl: string): Promise<string> {
  return rpc<string>(rpcUrl, 'net_version');
}

/** Format wei (hex) to MARS (human). 18 decimals. */
export function weiToMars(weiHex: string): string {
  const wei = BigInt(weiHex);
  const divisor = BigInt(10 ** 18);
  const whole = wei / divisor;
  const frac = wei % divisor;
  const fracStr = frac.toString().padStart( 18, '0').slice(0, 6).replace(/0+$/, '') || '0';
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}

/** Use remote RPC for balance when local is syncing. */
export function getRemoteRpcUrl(): string {
  return REMOTE_RPC;
}

/** Prefer local RPC; if it fails, use remote for read-only calls. */
export async function getBalancePreferLocal(localRpcUrl: string | null, address: string): Promise<string> {
  if (localRpcUrl) {
    try {
      return await ethGetBalance(localRpcUrl, address);
    } catch {
      // fallback to remote
    }
  }
  return ethGetBalance(REMOTE_RPC, address);
}
