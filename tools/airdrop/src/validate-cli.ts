import { parseCommonArgs } from './args.js';
import {
  DEFAULT_RPC_URL,
  EXPECTED_CHAIN_ID,
  MAX_DISTRIBUTE_MARS,
  TREASURY_ADDRESS,
} from './constants.js';
import { formatMars, loadAndValidateAllocations } from './validate.js';
import { logError, logInfo } from './logger.js';

async function main(): Promise<void> {
  const cli = parseCommonArgs(process.argv);

  try {
    const envExpected = process.env.EXPECTED_ROW_COUNT
      ? Number(process.env.EXPECTED_ROW_COUNT)
      : undefined;

    const result = await loadAndValidateAllocations(cli.csv, {
      defaultAmountMars: cli.amountMars,
      allowPartial: cli.allowPartial,
      expectedRowCount: cli.allowPartial ? undefined : envExpected,
      maxDistributeMars: Number(process.env.MAX_DISTRIBUTE_MARS ?? MAX_DISTRIBUTE_MARS),
      treasuryAddress: process.env.TREASURY_ADDRESS ?? TREASURY_ADDRESS,
      rpcUrl: process.env.RPC_URL ?? DEFAULT_RPC_URL,
      expectedChainId: Number(process.env.EXPECTED_CHAIN_ID ?? EXPECTED_CHAIN_ID),
    });

    logInfo('Validation passed', {
      csv: cli.csv,
      rows: result.rows.length,
      totalMars: result.totalMars.toString(),
      treasury: process.env.TREASURY_ADDRESS ?? TREASURY_ADDRESS,
      treasuryBalanceMars: result.treasuryBalanceWei
        ? formatMars(result.treasuryBalanceWei)
        : undefined,
      chainId: result.chainId,
      dryRun: cli.dryRun,
    });
  } catch (err) {
    logError('Validation failed', {
      message: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
}

main();
