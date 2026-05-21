import { readFileSync } from 'node:fs';
import { Wallet, JsonRpcProvider } from 'ethers';
import { parseCommonArgs, hasStopOnError } from './args.js';
import {
  DEFAULT_AMOUNT_MARS,
  DEFAULT_DELAY_MS,
  DEFAULT_LOG_FILE,
  DEFAULT_RPC_URL,
  EXPECTED_CHAIN_ID,
  MAX_DISTRIBUTE_MARS,
  TREASURY_ADDRESS,
} from './constants.js';
import { appendJsonl, logError, logInfo, type TransferLogEntry } from './logger.js';
import {
  formatMars,
  marsToWei,
  parseAllocationsCsv,
  validateAllocationsStructure,
  validateOnChain,
} from './validate.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const cli = parseCommonArgs(process.argv);
  const stopOnError = hasStopOnError(process.argv);
  const privateKey = process.env.TREASURY_PRIVATE_KEY?.trim();

  const rpcUrl = process.env.RPC_URL ?? DEFAULT_RPC_URL;
  const treasuryAddress = process.env.TREASURY_ADDRESS ?? TREASURY_ADDRESS;
  const logFile = process.env.LOG_FILE ?? cli.logFile ?? DEFAULT_LOG_FILE;
  const delayMs = Number(process.env.DEFAULT_DELAY_MS ?? cli.delayMs ?? DEFAULT_DELAY_MS);

  const validateOptions = {
    defaultAmountMars: cli.amountMars,
    allowPartial: true,
    expectedRowCount: process.env.EXPECTED_ROW_COUNT
      ? Number(process.env.EXPECTED_ROW_COUNT)
      : undefined,
    maxDistributeMars: Number(process.env.MAX_DISTRIBUTE_MARS ?? MAX_DISTRIBUTE_MARS),
    treasuryAddress,
    rpcUrl,
    expectedChainId: Number(process.env.EXPECTED_CHAIN_ID ?? EXPECTED_CHAIN_ID),
    skipOnChainChecks: cli.dryRun,
  };

  let rows;
  try {
    const content = readFileSync(cli.csv, 'utf8');
    const parsed = parseAllocationsCsv(
      content,
      cli.amountMars ?? String(process.env.DEFAULT_AMOUNT_MARS ?? DEFAULT_AMOUNT_MARS),
    );
    const structural = validateAllocationsStructure(parsed, validateOptions);
    rows = structural.rows;

    if (!cli.dryRun) {
      await validateOnChain(structural.totalWei, validateOptions);
    }

    logInfo(cli.dryRun ? 'Dry-run validation passed' : 'Pre-send validation passed', {
      rows: rows.length,
      totalMars: structural.totalMars.toString(),
      startIndex: cli.startIndex,
      limit: cli.limit,
    });
  } catch (err) {
    logError('Validation failed', {
      message: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }

  const slice = rows.slice(cli.startIndex, cli.limit ? cli.startIndex + cli.limit : undefined);

  if (cli.dryRun) {
    logInfo('Dry-run complete (no transactions sent)', {
      wouldSend: slice.length,
      firstAddress: slice[0]?.address,
      lastAddress: slice[slice.length - 1]?.address,
    });
    return;
  }

  if (!privateKey) {
    logError('TREASURY_PRIVATE_KEY is required for send (set in .env)');
    process.exit(1);
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);

  if (wallet.address.toLowerCase() !== treasuryAddress.toLowerCase()) {
    logError('Private key does not match treasury address', {
      keyAddress: wallet.address,
      expectedTreasury: treasuryAddress,
    });
    process.exit(1);
  }

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < slice.length; i++) {
    const globalIndex = cli.startIndex + i;
    const row = slice[i];
    const value = marsToWei(row.amountMars);

    try {
      logInfo('Sending', {
        index: globalIndex,
        to: row.address,
        amountMars: row.amountMars,
      });

      const tx = await wallet.sendTransaction({
        to: row.address,
        value,
      });

      const receipt = await tx.wait(1);
      if (!receipt || receipt.status !== 1) {
        throw new Error(`Transaction reverted: ${ tx.hash }`);
      }

      const entry: TransferLogEntry = {
        index: globalIndex,
        to: row.address,
        amountMars: row.amountMars,
        txHash: tx.hash,
        status: 'confirmed',
        timestamp: new Date().toISOString(),
      };
      appendJsonl(logFile, entry);
      sent++;

      logInfo('Confirmed', { index: globalIndex, txHash: tx.hash });
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      appendJsonl(logFile, {
        index: globalIndex,
        to: row.address,
        amountMars: row.amountMars,
        status: 'failed',
        error: message,
        timestamp: new Date().toISOString(),
      });
      logError('Transfer failed', { index: globalIndex, to: row.address, message });

      if (stopOnError) {
        process.exit(1);
      }
    }

    if (i < slice.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  const balance = await provider.getBalance(wallet.address);
  logInfo('Send batch finished', {
    sent,
    failed,
    remainingTreasuryMars: formatMars(balance),
    logFile,
    resumeHint: failed > 0 ? `--start-index ${ cli.startIndex + sent + failed }` : undefined,
  });

  if (failed > 0) {
    process.exit(1);
  }
}

main();
