const state = {
  lastPayload: null,
  jobs: [],
  page: 1,
};

const els = {
  form: document.getElementById("searchForm"),
  q: document.getElementById("q"),
  where: document.getElementById("where"),
  perPage: document.getElementById("per_page"),
  searchBtn: document.getElementById("searchBtn"),
  status: document.getElementById("status"),
  body: document.getElementById("jobsBody"),
  cards: document.getElementById("jobsCards"),
  count: document.getElementById("count"),
  totalAvailable: document.getElementById("totalAvailable"),
  source: document.getElementById("source"),
  fetchedAt: document.getElementById("fetchedAt"),
  querySummary: document.getElementById("querySummary"),
  pageSummary: document.getElementById("pageSummary"),
  prevPage: document.getElementById("prevPage"),
  nextPage: document.getElementById("nextPage"),
  downloadJson: document.getElementById("downloadJson"),
  downloadCsv: document.getElementById("downloadCsv"),
};

function setStatus(message) {
  els.status.textContent = message;
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleString();
}

function formatSalary(min, max) {
  if (min == null && max == null) return "-";
  if (min != null && max != null) return `${Math.round(min).toLocaleString()} - ${Math.round(max).toLocaleString()}`;
  if (min != null) return `From ${Math.round(min).toLocaleString()}`;
  return `Up to ${Math.round(max).toLocaleString()}`;
}

function sanitize(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderJobs(jobs) {
  if (!jobs.length) {
    els.body.innerHTML = `<tr><td colspan="7" class="empty">No jobs found for this query.</td></tr>`;
    els.cards.innerHTML = `<div class="job-card empty">No jobs found for this query.</div>`;
    return;
  }

  els.body.innerHTML = jobs
    .map((job) => {
      const href = sanitize(job.redirectUrl || "#");
      return `
        <tr>
          <td>${sanitize(job.title || "-")}</td>
          <td>${sanitize(job.company || "-")}</td>
          <td>${sanitize(job.location || "-")}</td>
          <td>${sanitize(formatSalary(job.salaryMin, job.salaryMax))}</td>
          <td>${sanitize(job.contractType || job.contractTime || "-")}</td>
          <td>${sanitize(formatDate(job.created))}</td>
          <td>${job.redirectUrl ? `<a class="job-link" href="${href}" target="_blank" rel="noreferrer">Open</a>` : "-"}</td>
        </tr>
      `;
    })
    .join("");

  els.cards.innerHTML = jobs
    .map(
      (job) => `
        <article class="job-card">
          <h3>${sanitize(job.title || "-")}</h3>
          <div class="job-card-meta">
            <div><strong>Company:</strong> ${sanitize(job.company || "-")}</div>
            <div><strong>Location:</strong> ${sanitize(job.location || "-")}</div>
            <div><strong>Salary:</strong> ${sanitize(formatSalary(job.salaryMin, job.salaryMax))}</div>
            <div><strong>Type:</strong> ${sanitize(job.contractType || job.contractTime || "-")}</div>
            <div><strong>Posted:</strong> ${sanitize(formatDate(job.created))}</div>
          </div>
          ${job.redirectUrl ? `<a href="${sanitize(job.redirectUrl)}" target="_blank" rel="noreferrer">Open job</a>` : ""}
        </article>
      `
    )
    .join("");
}

function updateStats(payload) {
  els.count.textContent = String(payload.count ?? 0);
  els.totalAvailable.textContent = payload.totalAvailable == null ? "-" : Number(payload.totalAvailable).toLocaleString();
  els.source.textContent = payload.source || "-";
  els.fetchedAt.textContent = formatDate(payload.fetchedAt);
}

function updatePagination(payload) {
  const totalAvailable = Number(payload.totalAvailable);
  const perPage = Number(payload.perPage || els.perPage.value || 20);
  const maxPageFromTotal = Number.isFinite(totalAvailable) && totalAvailable > 0 ? Math.ceil(totalAvailable / perPage) : null;
  const hasMoreFromCount = Number(payload.count || 0) >= perPage;
  const canGoNext = maxPageFromTotal ? state.page < maxPageFromTotal : hasMoreFromCount && state.page < 50;

  els.pageSummary.textContent = maxPageFromTotal ? `Page ${state.page} of ${maxPageFromTotal}` : `Page ${state.page}`;
  els.prevPage.disabled = state.page <= 1;
  els.nextPage.disabled = !canGoNext;
}

function updateQuerySummary() {
  const q = els.q.value.trim() || "Any role";
  const where = els.where.value.trim() || "Any location";
  const perPage = els.perPage.value || "20";
  els.querySummary.textContent = `${q} in ${where} | ${perPage} per page`;
}

function downloadFile(name, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows) {
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

  const csvValue = (value) => {
    const raw = value == null ? "" : String(value);
    if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
      return `"${raw.replaceAll('"', '""')}"`;
    }
    return raw;
  };

  return [headers.join(","), ...rows.map((row) => headers.map((h) => csvValue(row[h])).join(","))].join("\n");
}

async function fetchJobs({ page = state.page } = {}) {
  state.page = page;
  const params = new URLSearchParams({
    q: els.q.value.trim(),
    where: els.where.value.trim(),
    page: String(state.page),
    per_page: els.perPage.value || "20",
  });

  updateQuerySummary();
  setStatus(`Scraping page ${state.page}...`);
  els.searchBtn.disabled = true;
  els.prevPage.disabled = true;
  els.nextPage.disabled = true;

  try {
    const response = await fetch(`/api/jobs?${params.toString()}`);
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || "Request failed");
    }

    state.lastPayload = payload;
    state.jobs = payload.jobs || [];
    updateStats(payload);
    renderJobs(state.jobs);
    updatePagination(payload);
    setStatus(`Loaded ${payload.count} jobs from page ${state.page}.`);
  } catch (error) {
    setStatus(`Error: ${error.message}`);
    updatePagination({
      count: 0,
      totalAvailable: state.lastPayload?.totalAvailable ?? null,
      perPage: els.perPage.value,
    });
  } finally {
    els.searchBtn.disabled = false;
  }
}

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await fetchJobs({ page: 1 });
});

els.prevPage.addEventListener("click", async () => {
  if (state.page <= 1) return;
  await fetchJobs({ page: state.page - 1 });
});

els.nextPage.addEventListener("click", async () => {
  await fetchJobs({ page: state.page + 1 });
});

els.perPage.addEventListener("change", () => {
  updateQuerySummary();
});

els.q.addEventListener("input", updateQuerySummary);
els.where.addEventListener("input", updateQuerySummary);

els.downloadJson.addEventListener("click", () => {
  if (!state.lastPayload) {
    setStatus("Run a search before downloading JSON.");
    return;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadFile(`jobs-${stamp}.json`, JSON.stringify(state.lastPayload, null, 2), "application/json");
});

els.downloadCsv.addEventListener("click", () => {
  if (!state.jobs.length) {
    setStatus("Run a search before downloading CSV.");
    return;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadFile(`jobs-${stamp}.csv`, toCsv(state.jobs), "text/csv;charset=utf-8");
});

updateQuerySummary();
updatePagination({
  count: 0,
  totalAvailable: null,
  perPage: els.perPage.value,
});
