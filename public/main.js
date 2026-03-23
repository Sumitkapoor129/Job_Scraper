const state = {
  lastPayload: null,
  jobs: [],
};

const els = {
  form: document.getElementById("searchForm"),
  q: document.getElementById("q"),
  where: document.getElementById("where"),
  page: document.getElementById("page"),
  perPage: document.getElementById("per_page"),
  searchBtn: document.getElementById("searchBtn"),
  status: document.getElementById("status"),
  body: document.getElementById("jobsBody"),
  count: document.getElementById("count"),
  totalAvailable: document.getElementById("totalAvailable"),
  source: document.getElementById("source"),
  fetchedAt: document.getElementById("fetchedAt"),
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
}

function updateStats(payload) {
  els.count.textContent = String(payload.count ?? 0);
  els.totalAvailable.textContent = payload.totalAvailable == null ? "-" : Number(payload.totalAvailable).toLocaleString();
  els.source.textContent = payload.source || "-";
  els.fetchedAt.textContent = formatDate(payload.fetchedAt);
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

async function fetchJobs() {
  const params = new URLSearchParams({
    q: els.q.value.trim(),
    where: els.where.value.trim(),
    page: els.page.value || "1",
    per_page: els.perPage.value || "20",
  });

  setStatus("Scraping jobs...");
  els.searchBtn.disabled = true;

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
    setStatus(`Loaded ${payload.count} jobs.`);
  } catch (error) {
    setStatus(`Error: ${error.message}`);
  } finally {
    els.searchBtn.disabled = false;
  }
}

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await fetchJobs();
});

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
