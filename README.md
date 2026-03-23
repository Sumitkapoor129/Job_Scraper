# job-scraper

Production-ready starter for scraping job listings with:

- Web frontend for searching + exporting jobs
- Express API (`GET /api/jobs`)
- CLI scraper command (`npm run scrape`)
- Adzuna provider integration
- Job normalization + de-duplication
- JSON/CSV/NDJSON outputs for downstream processing

## 1) Setup

```bash
npm install
cp .env.example .env
```

Fill in your Adzuna credentials in `.env`:

```env
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
```

## 2) Run App (Frontend + API)

```bash
npm run dev
```

Open:

- `http://localhost:3000/` (frontend dashboard)

API endpoints:

- `GET /health`
- `GET /api/jobs?q=frontend&where=delhi&per_page=20&page=1`
- `GET /api` (quick docs)

## 3) Run CLI Scrape

```bash
npm run scrape -- --q "nodejs" --where "bengaluru" --page 1 --per_page 20 --out my-jobs
```

Generated files (default `data/`):

- `my-jobs.json` (full payload)
- `my-jobs.csv` (tabular jobs export)
- `jobs.ndjson` (append-only stream for history)

## Project Structure

```text
src/
  app.js                   # Express app + routes
  server.js                # API boot entrypoint
  cli/scrape.js            # CLI entrypoint
  config/env.js            # Environment loading/validation
  providers/adzunaProvider.js
  services/jobScraperService.js
  storage/fileStore.js
  utils/jobNormalize.js
  utils/numbers.js
public/
  index.html               # Frontend dashboard
  styles.css               # UI styles
  main.js                  # Frontend logic
test/
  run-tests.js
```

## Scripts

- `npm run dev` - start API with watch mode
- `npm start` - start API
- `npm run scrape -- --q ...` - fetch jobs and save files
- `npm test` - run unit tests

## Vercel

The project includes:

- [vercel.json](C:/Users/91983/Desktop/VibeCoded/job-scraper/vercel.json) for routing
- [api/index.js](C:/Users/91983/Desktop/VibeCoded/job-scraper/api/index.js) as the Vercel serverless entrypoint

This keeps the frontend on `/` and routes `/api/*` and `/health` through the Express app.

## Notes

- Use `STRICT_ENV=true` in production to enforce required environment variables at boot.
- `ADZUNA_COUNTRY` defaults to `in` and can be changed (for example `gb`, `us`) based on your account permissions.
