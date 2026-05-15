/**
 * Stage 4 — Builds a structured, human-readable report from test results
 */
function buildReport(url, pageData, testResults) {
  const totalTests = testResults.length;
  const passed = testResults.filter((r) => r.status === "PASS").length;
  const failed = testResults.filter((r) => r.status === "FAIL").length;
  const warned = testResults.filter((r) => r.status === "WARN").length;
  const errored = testResults.filter((r) => r.status === "ERROR").length;

  const score = Math.round((passed / totalTests) * 100);

  const overallHealth = score >= 80 ? "GOOD" : score >= 50 ? "AVERAGE" : "POOR";

  // Group results by category
  const byCategory = {};
  for (const result of testResults) {
    const cat = result.category || "GENERAL";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(result);
  }

  // Build key findings (notable issues)
  const keyFindings = [];
  for (const result of testResults) {
    if (result.status === "FAIL") {
      keyFindings.push({ severity: "HIGH", message: result.summary, test: result.name });
    } else if (result.status === "WARN") {
      keyFindings.push({ severity: "MEDIUM", message: result.summary, test: result.name });
    }
  }

  return {
    meta: {
      url,
      testedAt: new Date().toISOString(),
      pageType: pageData.pageType,
      pageTitle: pageData.title,
    },
    summary: {
      totalTests,
      passed,
      failed,
      warned,
      errored,
      score,
      overallHealth,
    },
    keyFindings,
    resultsByCategory: byCategory,
    allResults: testResults,
  };
}

module.exports = { buildReport };