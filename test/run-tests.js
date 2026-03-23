import assert from "node:assert/strict";
import { clampInt } from "../src/utils/numbers.js";
import { dedupeById, normalizeAdzunaJob } from "../src/utils/jobNormalize.js";

function run(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

run("clampInt should clamp and fallback correctly", () => {
  assert.equal(clampInt("10", 1, 5, 2), 5);
  assert.equal(clampInt("-2", 1, 5, 2), 1);
  assert.equal(clampInt("abc", 1, 5, 2), 2);
});

run("normalizeAdzunaJob maps fields", () => {
  const normalized = normalizeAdzunaJob({
    id: "123",
    title: "Frontend Engineer",
    company: { display_name: "Acme" },
    location: { display_name: "Delhi" },
    category: { label: "IT Jobs" },
    salary_min: 100,
    salary_max: 200,
    contract_type: "permanent",
    contract_time: "full_time",
    created: "2026-01-01T00:00:00Z",
    redirect_url: "https://example.com/job/123",
  });

  assert.deepEqual(normalized, {
    id: "adzuna:123",
    title: "Frontend Engineer",
    company: "Acme",
    location: "Delhi",
    category: "IT Jobs",
    salaryMin: 100,
    salaryMax: 200,
    contractType: "permanent",
    contractTime: "full_time",
    created: "2026-01-01T00:00:00Z",
    redirectUrl: "https://example.com/job/123",
    description: null,
    source: "Adzuna",
  });
});

run("dedupeById removes duplicate ids", () => {
  const out = dedupeById([
    { id: "1", title: "a" },
    { id: "2", title: "b" },
    { id: "1", title: "c" },
    { id: "", title: "ignored" },
  ]);

  assert.deepEqual(out, [
    { id: "1", title: "a" },
    { id: "2", title: "b" },
  ]);
});

if (process.exitCode === 1) {
  process.exit(1);
}
