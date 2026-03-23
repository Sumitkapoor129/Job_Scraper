import { dedupeById } from "../utils/jobNormalize.js";
import { clampInt } from "../utils/numbers.js";

export class JobScraperService {
  constructor(provider) {
    this.provider = provider;
  }

  async scrape({ q = "", where = "", page = 1, perPage = 20 } = {}) {
    const safePage = clampInt(page, 1, 50, 1);
    const safePerPage = clampInt(perPage, 1, 50, 20);
    const searchQuery = String(q || "").trim();
    const searchWhere = String(where || "").trim();

    const result = await this.provider.fetchJobs({
      q: searchQuery,
      where: searchWhere,
      page: safePage,
      perPage: safePerPage,
    });

    const dedupedJobs = dedupeById(result.jobs);
    return {
      ok: true,
      fetchedAt: new Date().toISOString(),
      source: result.source,
      totalAvailable: result.totalAvailable,
      page: safePage,
      perPage: safePerPage,
      count: dedupedJobs.length,
      jobs: dedupedJobs,
    };
  }
}
