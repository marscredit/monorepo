/**
 * WalletService: BIP39 wallet generation, keystore, import/export, address-only mode.
 * Uses ethers v6. Stores encrypted mnemonic in ~/.marscredit/wallet.enc (optional).
 */

import * as fs from 'fs';
import * as path from 'path';
import { Wallet } from 'ethers';
import { getMarsCreditDir, getWalletEncPath, getMinerKeystoreDir } from '../utils/paths';
import { logger } from '../utils/logger';

export type WalletMode = 'full' | 'address_only';

export interface WalletInfo {
  address: string;
  mode: WalletMode;
  hasMnemonic: boolean;
  hasPrivateKey: boolean;
}

const WALLET_ENC_FILE = 'wallet.enc';

/** Simple XOR obfuscation for mnemonic at rest (not cryptographically strong; user should set app password later). */
function simpleObfuscate(data: string, password: string): string {
  const buf = Buffer.from(data, 'utf8');
  const key = Buffer.from(password, 'utf8');
  for (let i = 0; i < buf.length; i++) {
    buf[i] ^= key[i % key.length];
  }
  return buf.toString('base64');
}

function simpleDeobfuscate(encoded: string, password: string): string {
  const buf = Buffer.from(encoded, 'base64');
  const key = Buffer.from(password, 'utf8');
  for (let i = 0; i < buf.length; i++) {
    buf[i] ^= key[i % key.length];
  }
  return buf.toString('utf8');
}

/** Generate a new random wallet (BIP39 mnemonic + address). */
export function generateWallet(): { address: string; mnemonic: string; privateKey: string } {
  const wallet = Wallet.createRandom();
  const mnemonic = wallet.mnemonic?.phrase;
  if (!mnemonic) {
    throw new Error('Wallet.createRandom() did not return mnemonic');
  }
  return {
    address: wallet.address,
    mnemonic,
    privateKey: wallet.privateKey,
  };
}

/** Import wallet from mnemonic phrase. */
export function importFromMnemonic(mnemonic: string): { address: string; privateKey: string } {
  const wallet = Wallet.fromPhrase(mnemonic.trim());
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/** Import wallet from private key (hex string with or without 0x). */
export function importFromPrivateKey(privateKeyHex: string): { address: string } {
  const key = privateKeyHex.startsWith('0x') ? privateKeyHex : '0x' + privateKeyHex;
  const wallet = new Wallet(key);
  return { address: wallet.address };
}

/** Validate an Ethereum address. */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/** Address-only: no keys stored, just the address for miner etherbase. */
export function setAddressOnly(address: string): void {
  if (!isValidAddress(address)) {
    throw new Error('Invalid address');
  }
  const dir = getMarsCreditDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'mining_address.txt');
  fs.writeFileSync(file, address, 'utf8');
  logger.info('Address-only mining address set', { address });
}

/** Get stored mining address (from address-only file or first keystore in a miner). */
export function getStoredMiningAddress(minerIndex?: number): string | null {
  const dir = getMarsCreditDir();
  const addressFile = path.join(dir, 'mining_address.txt');
  if (fs.existsSync(addressFile)) {
    return fs.readFileSync(addressFile, 'utf8').trim();
  }
  if (minerIndex != null) {
    const keystoreDir = getMinerKeystoreDir(minerIndex);
    if (fs.existsSync(keystoreDir)) {
      const files = fs.readdirSync(keystoreDir).filter((f) => f.startsWith('UTC--'));
      if (files.length > 0) {
        const content = fs.readFileSync(path.join(keystoreDir, files[0]), 'utf8');
        const parsed = JSON.parse(content);
        return parsed.address ? (parsed.address.startsWith('0x') ? parsed.address : '0x' + parsed.address) : null;
      }
    }
  }
  return null;
}

/** Save mnemonic to encrypted file (simple obfuscation with password). */
export function saveMnemonic(mnemonic: string, password: string): void {
  const encPath = getWalletEncPath();
  const dir = path.dirname(encPath);
  fs.mkdirSync(dir, { recursive: true });
  const encoded = simpleObfuscate(mnemonic, password);
  fs.writeFileSync(encPath, encoded, 'utf8');
  fs.chmodSync(encPath, 0o600);
  logger.info('Mnemonic saved to encrypted store');
}

/** Load mnemonic from encrypted file. */
export function loadMnemonic(password: string): string | null {
  const encPath = getWalletEncPath();
  if (!fs.existsSync(encPath)) return null;
  try {
    const encoded = fs.readFileSync(encPath, 'utf8');
    return simpleDeobfuscate(encoded, password);
  } catch {
    return null;
  }
}

/** Export keystore JSON (Geth-compatible) for a wallet. */
export async function exportKeystore(privateKeyHex: string, password: string): Promise<string> {
  const key = privateKeyHex.startsWith('0x') ? privateKeyHex : '0x' + privateKeyHex;
  const wallet = new Wallet(key);
  return wallet.encrypt(password);
}

/** Write keystore file to a miner's keystore dir (for Geth to use). */
export function writeKeystoreToMiner(
  minerIndex: number,
  privateKeyHex: string,
  password: string
): Promise<string> {
  const keystoreDir = getMinerKeystoreDir(minerIndex);
  fs.mkdirSync(keystoreDir, { recursive: true });
  return exportKeystore(privateKeyHex, password).then((json) => {
    const wallet = new Wallet(privateKeyHex.startsWith('0x') ? privateKeyHex : '0x' + privateKeyHex);
    const filename = `UTC--${new Date().toISOString().replace(/[:.-]/g, '')}--${wallet.address.slice(2)}`;
    const filepath = path.join(keystoreDir, filename);
    fs.writeFileSync(filepath, json, 'utf8');
    fs.chmodSync(filepath, 0o600);
    return wallet.address;
  });
}

/** Get wallet info for UI (address, mode, whether we have mnemonic/key). */
export function getWalletInfo(minerIndex?: number): WalletInfo | null {
  const address = getStoredMiningAddress(minerIndex);
  if (!address) return null;
  const encPath = getWalletEncPath();
  const hasMnemonic = fs.existsSync(encPath);
  const keystoreDir = minerIndex != null ? getMinerKeystoreDir(minerIndex) : null;
  const hasKeystore = keystoreDir != null && fs.existsSync(keystoreDir) && fs.readdirSync(keystoreDir).some((f) => f.startsWith('UTC--'));
  return {
    address,
    mode: hasKeystore || hasMnemonic ? 'full' : 'address_only',
    hasMnemonic,
    hasPrivateKey: hasKeystore,
  };
}
