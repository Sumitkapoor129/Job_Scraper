export function normalizeAdzunaJob(raw) {
  return {
    id: `adzuna:${raw.id}`,
    title: raw.title || null,
    company: raw.company?.display_name || null,
    location: raw.location?.display_name || null,
    category: raw.category?.label || null,
    salaryMin: raw.salary_min ?? null,
    salaryMax: raw.salary_max ?? null,
    contractType: raw.contract_type || null,
    contractTime: raw.contract_time || null,
    created: raw.created || null,
    redirectUrl: raw.redirect_url || null,
    description: raw.description || null,
    source: "Adzuna",
  };
}

export function dedupeById(jobs) {
  const seen = new Set();
  const out = [];
  for (const job of jobs) {
    if (!job?.id || seen.has(job.id)) continue;
    seen.add(job.id);
    out.push(job);
  }
  return out;
}
