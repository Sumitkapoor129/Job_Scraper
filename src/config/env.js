import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function optional(name, fallback = "") {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

function toInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export function loadConfig() {
  const strict = optional("STRICT_ENV", "false").toLowerCase() === "true";
  const appId = strict ? required("ADZUNA_APP_ID") : optional("ADZUNA_APP_ID");
  const appKey = strict ? required("ADZUNA_APP_KEY") : optional("ADZUNA_APP_KEY");

  return {
    nodeEnv: optional("NODE_ENV", "development"),
    port: toInt(optional("PORT", "3000"), 3000),
    adzuna: {
      appId,
      appKey,
      country: optional("ADZUNA_COUNTRY", "in"),
      baseUrl: optional("ADZUNA_BASE_URL", "https://api.adzuna.com/v1/api/jobs"),
      timeoutMs: toInt(optional("HTTP_TIMEOUT_MS", "20000"), 20000),
    },
    storage: {
      outputDir: optional("OUTPUT_DIR", "data"),
    },
  };
}
