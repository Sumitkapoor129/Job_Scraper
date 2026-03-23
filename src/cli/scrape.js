import { loadConfig } from "../config/env.js";
import { AdzunaProvider } from "../providers/adzunaProvider.js";
import { JobScraperService } from "../services/jobScraperService.js";
import { FileStore } from "../storage/fileStore.js";

function getArg(name, fallback = "") {
  const idx = process.argv.findIndex((arg) => arg === `--${name}`);
  if (idx === -1 || idx + 1 >= process.argv.length) return fallback;
  return process.argv[idx + 1];
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function main() {
  const config = loadConfig();
  const provider = new AdzunaProvider(config.adzuna);
  const scraper = new JobScraperService(provider);
  const store = new FileStore(config.storage.outputDir);

  const q = getArg("q", "");
  const where = getArg("where", "");
  const page = getArg("page", "1");
  const perPage = getArg("per_page", "20");
  const baseName = getArg("out", `jobs-${nowStamp()}`);

  const payload = await scraper.scrape({ q, where, page, perPage });
  const jsonPath = await store.saveJsonSnapshot(`${baseName}.json`, payload);
  const csvPath = await store.saveCsv(`${baseName}.csv`, payload.jobs);
  const ndjsonPath = await store.appendNdjson("jobs.ndjson", payload.jobs);

  console.log(`Scraped ${payload.count} jobs`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`CSV: ${csvPath}`);
  console.log(`NDJSON append: ${ndjsonPath}`);
}

main().catch((err) => {
  console.error("Scrape failed:", err?.response?.data || err?.message || err);
  process.exitCode = 1;
});
