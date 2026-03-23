import fs from "node:fs/promises";
import path from "node:path";

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function toCsvValue(value) {
  const s = value == null ? "" : String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

export class FileStore {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }

  async saveJsonSnapshot(filename, payload) {
    await ensureDir(this.outputDir);
    const fullPath = path.join(this.outputDir, filename);
    await fs.writeFile(fullPath, JSON.stringify(payload, null, 2), "utf8");
    return fullPath;
  }

  async appendNdjson(filename, rows) {
    await ensureDir(this.outputDir);
    const fullPath = path.join(this.outputDir, filename);
    const lines = rows.map((r) => `${JSON.stringify(r)}\n`).join("");
    await fs.appendFile(fullPath, lines, "utf8");
    return fullPath;
  }

  async saveCsv(filename, rows) {
    await ensureDir(this.outputDir);
    const fullPath = path.join(this.outputDir, filename);
    const headers = [
      "id",
      "title",
      "company",
      "location",
      "category",
      "salaryMin",
      "salaryMax",
      "contractType",
      "contractTime",
      "created",
      "redirectUrl",
      "source",
    ];

    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((h) => toCsvValue(row[h])).join(",")),
      "",
    ].join("\n");

    await fs.writeFile(fullPath, csv, "utf8");
    return fullPath;
  }
}
