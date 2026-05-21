import { logError, logInfo } from './logger.js';
import { MAX_DISTRIBUTE_MARS } from './constants.js';
import { loadRecipientsAndGenerate } from './generate-allocations.js';

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  let input = 'data/recipients.csv';
  let output = 'data/allocations.csv';
  let amountMars: number | undefined;
  let totalMars: number | undefined = MAX_DISTRIBUTE_MARS;
  let expectedCount: number | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        input = args[++i] ?? input;
        break;
      case '--output':
        output = args[++i] ?? output;
        break;
      case '--amount-mars':
        amountMars = Number(args[++i]);
        break;
      case '--total-mars':
        totalMars = Number(args[++i]);
        break;
      case '--expected-count':
        expectedCount = Number(args[++i]);
        break;
      case '--help':
      case '-h':
        console.log(`
Generate allocations.csv from a recipient address list.

  npm run generate -- --input data/recipients.csv --output data/allocations.csv

Options:
  --input <path>         Recipient CSV (default: data/recipients.csv)
  --output <path>        Output allocations CSV (default: data/allocations.csv)
  --amount-mars <n>      Fixed MARS per wallet (overrides even split)
  --total-mars <n>       Total to split evenly (default: 270000000)
  --expected-count <n>   Optional: fail unless recipient row count matches exactly
`);
        process.exit(0);
        break;
      default:
        if (args[i].startsWith('-')) throw new Error(`Unknown flag: ${ args[i] }`);
    }
  }

  return { input, output, amountMars, totalMars, expectedCount };
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv);

  try {
    const { rows, amountMars } = loadRecipientsAndGenerate(cli.input, cli.output, {
      amountMars: cli.amountMars,
      totalMars: cli.totalMars,
      expectedCount: cli.expectedCount,
      treasuryAddress: process.env.TREASURY_ADDRESS,
    });

    const total = rows.reduce((sum, r) => sum + Number(r.amountMars), 0);
    logInfo('Generated allocations.csv', {
      input: cli.input,
      output: cli.output,
      rows: rows.length,
      amountMarsPerWallet: amountMars,
      totalMars: total,
    });
  } catch (err) {
    logError('Generate failed', {
      message: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
}

main();
