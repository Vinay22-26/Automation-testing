const { analyzePage } = require("./analyzers/pageAnalyzer");
const { generateTestCases } = require("./analyzers/testCaseGenerator");
const { runTestCases } = require("./runners/testRunner");
const { buildReport } = require("./reporters/reportBuilder");

/**
 * Master orchestrator — runs all 4 stages for a given URL
 * @param {string} url - The URL to test
 * @param {Function} pushProgress - Callback to stream progress messages
 * @returns {Object} - Final test report
 */
async function analyzeAndTest(url, pushProgress) {
  // ── STAGE 1: Understand the page ──────────────────────────────────────────
  pushProgress("Stage 1 — Opening page and scanning structure...");
  const pageData = await analyzePage(url, pushProgress);
  pushProgress(`Page type detected: ${pageData.pageType}`);
  pushProgress(`Found ${pageData.forms.length} form(s), ${pageData.inputs.length} input(s), ${pageData.links.length} link(s)`);

  // ── STAGE 2: Generate test cases ──────────────────────────────────────────
  pushProgress("Stage 2 — Generating test cases based on page structure...");
  const testCases = await generateTestCases(pageData, pushProgress);
  pushProgress(`Generated ${testCases.length} test cases`);

  // ── STAGE 3: Execute tests ─────────────────────────────────────────────────
  pushProgress("Stage 3 — Executing tests like a human tester...");
  const testResults = await runTestCases(url, testCases, pushProgress);

  // ── STAGE 4: Build report ─────────────────────────────────────────────────
  pushProgress("Stage 4 — Building human-readable report...");
  const report = buildReport(url, pageData, testResults);

  return report;
}

module.exports = { analyzeAndTest };