// Node script to enrich mapped Archanova accounts with on-chain deployment status and Mobula portfolio data
// Usage:
//   ETH_RPC_URL=<https_rpc> MOBULA_API_KEY=<key?> node scripts/enrich_archanova_accounts.js
// Optional env:
//   START_INDEX, LIMIT, CONCURRENCY (default 3), RETRIES (default 3)

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.resolve(projectRoot, 'src/electron/data/mapped_archanova_accounts.json');
const outputPath = path.resolve(projectRoot, 'src/electron/data/enriched_mapped_archanova_accounts.json');

const ETH_RPC_URL = process.env.ETH_RPC_URL || 'https://ethereum.publicnode.com';
const MOBULA_API_KEY = process.env.MOBULA_API_KEY || '';
const START_INDEX = parseInt(process.env.START_INDEX || '0', 10);
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : undefined;
const CONCURRENCY = Math.max(1, parseInt(process.env.CONCURRENCY || '3', 10));
const RETRIES = Math.max(0, parseInt(process.env.RETRIES || '3', 10));

const client = createPublicClient({
  chain: mainnet,
  transport: http(ETH_RPC_URL),
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetries(fn, description, retries = RETRIES) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > retries) {
        throw new Error(`${description} failed after ${retries} retries: ${err?.message || err}`);
      }
      const backoffMs = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 200);
      await sleep(backoffMs);
    }
  }
}

async function getIsDeployed(address) {
  const bytecode = await withRetries(
    () => client.getCode({ address }),
    `getCode(${address})`
  );
  return Boolean(bytecode && bytecode !== '0x');
}

async function getMobulaPortfolio(address) {
  const url = new URL('https://explorer-api.mobula.io/api/1/wallet/portfolio');
  url.searchParams.set('wallet', address);
  url.searchParams.set('cache', 'true');
  url.searchParams.set('stale', '3600');
  url.searchParams.set('filterSpam', 'true');
  const headers = { 'accept': 'application/json' };
  if (MOBULA_API_KEY) headers['x-api-key'] = MOBULA_API_KEY;

  return await withRetries(async () => {
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Mobula ${res.status}: ${text}`);
    }
    return await res.json();
  }, `mobula(${address})`);
}

async function readJsonArray(filePath) {
  const raw = await fs.promises.readFile(filePath, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('Input JSON is not an array');
  return data;
}

async function writeJson(filePath, data) {
  const json = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(filePath, json + '\n', 'utf8');
}

async function run() {
  console.log('Reading source:', sourcePath);
  const entries = await readJsonArray(sourcePath);
  const sliceEnd = LIMIT ? START_INDEX + LIMIT : entries.length;
  const work = entries.slice(START_INDEX, sliceEnd);
  console.log(`Total entries: ${entries.length}; processing ${work.length} starting at index ${START_INDEX}`);

  // If output exists, support resume by merging existing enriched entries by archanovaAddress
  let existingMap = new Map();
  if (fs.existsSync(outputPath)) {
    try {
      const existing = await readJsonArray(outputPath);
      for (const item of existing) {
        if (item && item.archanovaAddress) existingMap.set(item.archanovaAddress.toLowerCase(), item);
      }
      console.log(`Loaded ${existingMap.size} existing enriched entries (will be preserved/updated).`);
    } catch {
      // ignore if corrupt
    }
  }

  const results = [];
  const queue = [...work.entries()];
  let active = 0;
  let processed = 0;

  async function next() {
    const item = queue.shift();
    if (!item) return;
    active += 1;
    const [offset, entry] = item;
    const addr = String(entry.archanovaAddress || '').trim();
    const key = addr.toLowerCase();
    try {
      const [isDeployed, portfolioData] = await Promise.all([
        addr ? getIsDeployed(addr) : Promise.resolve(false),
        addr ? getMobulaPortfolio(addr) : Promise.resolve(null),
      ]);

      const enriched = { ...entry, isDeployed, portfolioData };
      existingMap.set(key, enriched);
    } catch (err) {
      // On failure, still include entry with error info
      const enriched = { ...entry, isDeployed: false, portfolioData: null, error: String(err?.message || err) };
      existingMap.set(key, enriched);
    } finally {
      processed += 1;
      if (processed % 25 === 0 || processed === work.length) {
        // Periodically persist to avoid losing work
        results.length = 0;
        for (const original of entries) {
          const a = String(original.archanovaAddress || '').toLowerCase();
          results.push(existingMap.get(a) || original);
        }
        await writeJson(outputPath, results);
        console.log(`Progress: ${processed}/${work.length} saved → ${outputPath}`);
      }
      active -= 1;
      await next();
    }
  }

  const starters = new Array(Math.min(CONCURRENCY, queue.length)).fill(0).map(() => next());
  await Promise.all(starters);

  // Final write to ensure completion
  results.length = 0;
  for (const original of entries) {
    const a = String(original.archanovaAddress || '').toLowerCase();
    results.push(existingMap.get(a) || original);
  }
  await writeJson(outputPath, results);
  console.log('Done. Wrote:', outputPath);
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


