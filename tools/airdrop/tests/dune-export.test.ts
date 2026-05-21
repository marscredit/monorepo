import { describe, expect, it } from 'vitest';
import { readFileSync, writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

describe('dune-export-recipients', () => {
  it('filters CEX and contract labels from Dune JSON', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dune-export-test-'));
    const input = join(dir, 'in.json');
    const output = join(dir, 'out.csv');

    writeFileSync(
      input,
      JSON.stringify({
        data: {
          rows: [
            {
              address: '0x0000000000000000000000000000000000000001',
              label_type: 'wallet',
              label_subtype: 'user',
            },
            {
              address: '0x0000000000000000000000000000000000000002',
              label_type: 'cex',
              label_subtype: 'hot_wallet',
            },
          ],
        },
      }),
    );

    execSync(
      `npx tsx src/dune-export-recipients.ts --input "${ input }" --output "${ output }"`,
      { cwd: join(import.meta.dirname, '..'), stdio: 'pipe' },
    );

    const csv = readFileSync(output, 'utf8');
    expect(csv).toContain('0x0000000000000000000000000000000000000001');
    expect(csv).not.toContain('0x0000000000000000000000000000000000000002');

    unlinkSync(input);
    unlinkSync(output);
  });
});
