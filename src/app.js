import express from "express";
import cors from "cors";
import path from "node:path";
import { loadConfig } from "./config/env.js";
import { AdzunaProvider } from "./providers/adzunaProvider.js";
import { JobScraperService } from "./services/jobScraperService.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const config = loadConfig();
  const provider = new AdzunaProvider(config.adzuna);
  const scraper = new JobScraperService(provider);
  const publicDir = path.resolve(process.cwd(), "public");

  if (!provider.isConfigured()) {
    // Keep the API bootable for local setup while making it explicit why scraping fails.
    // This also helps health-check endpoints succeed before credentials are provisioned.
    console.warn("Missing ADZUNA_APP_ID / ADZUNA_APP_KEY in .env");
  }

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "job-scraper",
      providerConfigured: provider.isConfigured(),
      env: config.nodeEnv,
      time: new Date().toISOString(),
    });
  });

  app.get("/api/jobs", async (req, res) => {
    try {
      const payload = await scraper.scrape({
        q: req.query.q,
        where: req.query.where,
        page: req.query.page,
        perPage: req.query.per_page,
      });
      res.json(payload);
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: "FETCH_FAILED",
        message: err?.response?.data || err?.message || "Unknown error",
      });
    }
  });

  app.get("/api", (_req, res) => {
    res.json({
      ok: true,
      service: "job-scraper",
      docs: {
        health: "/health",
        jobs: "/api/jobs?q=frontend&where=delhi&per_page=20&page=1",
      },
    });
  });

  app.use(express.static(publicDir));

  return app;
}
