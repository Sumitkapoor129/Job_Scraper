import axios from "axios";
import { normalizeAdzunaJob } from "../utils/jobNormalize.js";

export class AdzunaProvider {
  constructor(config) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeoutMs,
    });
  }

  isConfigured() {
    return Boolean(this.config.appId && this.config.appKey);
  }

  async fetchJobs({ q = "", where = "", page = 1, perPage = 20 } = {}) {
    if (!this.isConfigured()) {
      throw new Error("Adzuna provider is not configured. Missing ADZUNA_APP_ID or ADZUNA_APP_KEY.");
    }

    const path = `/${this.config.country}/search/${page}`;
    const params = {
      app_id: this.config.appId,
      app_key: this.config.appKey,
      results_per_page: perPage,
    };

    if (q) params.what = q;
    if (where) params.where = where;

    const { data } = await this.client.get(path, { params });
    const jobs = (data.results || []).map(normalizeAdzunaJob);

    return {
      source: `Adzuna ${this.config.country.toUpperCase()}`,
      totalAvailable: data.count ?? null,
      jobs,
    };
  }
}
