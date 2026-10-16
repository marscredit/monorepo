#!/usr/bin/env node
/**
 * Put the Mars geth fork (go-marscredit v1.10.18-mars-fast1, mars-fast-v1 @ 4d549c7f)
 * into resources/geth/<os>-<arch>/ for electron-builder, checking SHA-256.
 *
 *   node scripts/prepare-geth.mjs [source]
 *
 * source: a local directory holding the release assets (geth-darwin-amd64,
 * geth-darwin-arm64, geth-windows-amd64.zip), or omitted to download them from
 * the go-marscredit GitHub release.
 */
import { createHash } from "crypto";
import { mkdirSync, readFileSync, writeFileSync, chmodSync, existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const outRoot = resolve(__dirname, "..", "resources", "geth");
const TAG = "v1.10.18-mars-fast1";
const BASE = `https://github.com/marscredit/go-marscredit/releases/download/${TAG}`;

const ASSETS = [
  { name: "geth-darwin-arm64", sha256: "3b8918502b6beaf8952c8e06822ea1144bf4cccb7ef46024886b8db0dd62ad43", out: "darwin-arm64/geth" },
  { name: "geth-darwin-amd64", sha256: "0d8f8fc279c8a7211f0f6246a4c7268e043f3253ec80fca941262cd13ad73a3f", out: "darwin-x64/geth" },
  { name: "geth-windows-amd64.zip", sha256: "d7ebe8c61d15a6938467414811203233644257775e54a545b62e45c903578dab", out: "win-x64/geth.exe", zipEntry: "geth.exe" },
];

const source = process.argv[2];
const sha = (b) => createHash("sha256").update(b).digest("hex");

async function load(name) {
  if (source) return readFileSync(join(source, name));
  const res = await fetch(`${BASE}/${name}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${BASE}/${name}`);
  return Buffer.from(await res.arrayBuffer());
}

for (const a of ASSETS) {
  const buf = await load(a.name);
  const got = sha(buf);
  if (got !== a.sha256) throw new Error(`SHA-256 mismatch for ${a.name}: got ${got}, want ${a.sha256}`);
  let data = buf;
  if (a.zipEntry) {
    const AdmZip = require("adm-zip");
    const entry = new AdmZip(buf).getEntries().find((e) => e.entryName.split("/").pop() === a.zipEntry);
    if (!entry) throw new Error(`${a.zipEntry} not found in ${a.name}`);
    data = entry.getData();
  }
  const dest = join(outRoot, a.out);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, data);
  chmodSync(dest, 0o755);
  console.log(`${a.out}  ${sha(data)}  (from ${a.name})`);
}
