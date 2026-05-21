export type CommonCliArgs = {
  csv: string;
  dryRun: boolean;
  allowPartial: boolean;
  limit?: number;
  startIndex: number;
  amountMars?: string;
  delayMs: number;
  logFile: string;
};

export function parseCommonArgs(argv: string[]): CommonCliArgs {
  const args = argv.slice(2);
  let csv = 'data/allocations.csv';
  let dryRun = false;
  let allowPartial = false;
  let limit: number | undefined;
  let startIndex = 0;
  let amountMars: string | undefined;
  let delayMs = 500;
  let logFile = 'transfers.jsonl';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--csv':
        csv = args[++i] ?? csv;
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--allow-partial':
        allowPartial = true;
        break;
      case '--limit': {
        const n = Number(args[++i]);
        if (!Number.isFinite(n) || n < 1) throw new Error('--limit requires a positive number');
        limit = n;
        break;
      }
      case '--start-index': {
        const n = Number(args[++i]);
        if (!Number.isFinite(n) || n < 0) throw new Error('--start-index requires a non-negative number');
        startIndex = n;
        break;
      }
      case '--amount-mars':
        amountMars = args[++i];
        break;
      case '--delay-ms': {
        const n = Number(args[++i]);
        if (!Number.isFinite(n) || n < 0) throw new Error('--delay-ms requires a non-negative number');
        delayMs = n;
        break;
      }
      case '--log-file':
        logFile = args[++i] ?? logFile;
        break;
      case '--stop-on-error':
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('-')) throw new Error(`Unknown flag: ${ arg }`);
    }
  }

  return {
    csv,
    dryRun,
    allowPartial,
    limit,
    startIndex,
    amountMars,
    delayMs,
    logFile,
  };
}

function printHelp(): void {
  console.log(`
Mars Credit airdrop CLI

  npm run validate -- [options]
  npm run send -- [options]

Options:
  --csv <path>           Allocations CSV (default: data/allocations.csv)
  --dry-run              Validate only; send prints plan without broadcasting
  --allow-partial        Allow row count != 25000
  --limit <n>            Process at most n rows (from start-index)
  --start-index <n>      Resume from row index (0-based)
  --amount-mars <n>      Default MARS per row if CSV has address-only column
  --delay-ms <n>         Pause between sends (default: 500)
  --log-file <path>      JSONL log (default: transfers.jsonl)
  --stop-on-error        Abort send on first failure (send only)
`);
}

export function hasStopOnError(argv: string[]): boolean {
  return argv.includes('--stop-on-error');
}
