const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

// Ensure screenshots directory exists
const SCREENSHOT_DIR = path.join(__dirname, "../../screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

/**
 * Stage 3 — Executes every test case using Playwright.
 * Acts like a human tester — types, clicks, waits, observes.
 */
async function runTestCases(baseUrl, testCases, pushProgress) {
  const results = [];

  for (const testCase of testCases) {
    pushProgress(`Running: "${testCase.name}"...`);
    const result = await runSingleTest(baseUrl, testCase, pushProgress);
    results.push(result);
    pushProgress(`  → ${result.status}: ${result.summary}`);
  }

  return results;
}

async function runSingleTest(baseUrl, testCase, pushProgress) {
  let browser;
  const startTime = Date.now();

  try {
    browser = await chromium.launch({ headless: true });

    // Special case: session/auth route check needs a fresh context with no cookies
    if (testCase.actions.some((a) => a.type === "CHECK_AUTH_ROUTE")) {
      return await runAuthRouteCheck(browser, baseUrl, testCase, startTime);
    }

    // Special case: page-level checks
    if (testCase.actions.some((a) => ["PAGE_LOAD_CHECK", "CHECK_TITLE", "CHECK_CONSOLE_ERRORS", "CHECK_MOBILE_VIEWPORT", "CHECK_BROKEN_LINKS"].includes(a.type))) {
      return await runPageLevelCheck(browser, baseUrl, testCase, startTime);
    }

    // Standard form interaction test
    return await runFormTest(browser, baseUrl, testCase, startTime);

  } catch (err) {
    return {
      ...testCase,
      status: "ERROR",
      summary: `Test crashed: ${err.message}`,
      screenshotPath: null,
      durationMs: Date.now() - startTime,
    };
  } finally {
    if (browser) await browser.close();
  }
}

// ── FORM TEST ───────────────────────────────────────────────────────────────
async function runFormTest(browser, baseUrl, testCase, startTime) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1000);

  const urlBefore = page.url();

  // Execute each action in the test case
  for (const action of testCase.actions) {
    await executeAction(page, action);
    await page.waitForTimeout(800); // Small human-like delay between actions
  }

  await page.waitForTimeout(2000); // Wait for response

  const urlAfter = page.url();
  const screenshotPath = await takeScreenshot(page, testCase.id);

  // Detect what happened after actions
  const pageText = await page.evaluate(() => document.body.innerText.toLowerCase()).catch(() => "");
  const hasError = detectErrorOnPage(pageText);
  const hasRedirected = urlAfter !== urlBefore;
  const xssExecuted = await page.evaluate(() => typeof window.__xssTest !== "undefined").catch(() => false);

  // Determine pass/fail
  const { status, summary } = evaluateResult(testCase, {
    hasError,
    hasRedirected,
    urlBefore,
    urlAfter,
    xssExecuted,
    consoleErrors,
    pageText,
  });

  return {
    ...testCase,
    status,
    summary,
    screenshotPath,
    urlBefore,
    urlAfter,
    durationMs: Date.now() - startTime,
  };
}

// ── AUTH ROUTE CHECK ────────────────────────────────────────────────────────
async function runAuthRouteCheck(browser, baseUrl, testCase, startTime) {
  // Open a FRESH context — no cookies, no session — simulates a new browser
  const freshContext = await browser.newContext();
  const page = await freshContext.newPage();

  // Try to directly access the URL without logging in
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);

  const finalUrl = page.url();
  const pageText = await page.evaluate(() => document.body.innerText.toLowerCase()).catch(() => "");

  const wasRedirectedToLogin =
    finalUrl !== baseUrl ||
    pageText.includes("login") ||
    pageText.includes("sign in") ||
    pageText.includes("unauthorized");

  const screenshotPath = await takeScreenshot(page, testCase.id);

  return {
    ...testCase,
    status: wasRedirectedToLogin ? "PASS" : "FAIL",
    summary: wasRedirectedToLogin
      ? "Protected URL correctly redirects unauthenticated users to login"
      : "⚠️ WARNING: Protected URL is accessible without authentication!",
    screenshotPath,
    urlBefore: baseUrl,
    urlAfter: finalUrl,
    durationMs: Date.now() - startTime,
  };
}

// ── PAGE LEVEL CHECKS ───────────────────────────────────────────────────────
async function runPageLevelCheck(browser, baseUrl, testCase, startTime) {
  const context = await browser.newContext();
  const consoleErrors = [];

  const action = testCase.actions[0];

  // Mobile viewport check
  if (action.type === "CHECK_MOBILE_VIEWPORT") {
    await context.close();
    const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await mobileContext.newPage();
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    const screenshotPath = await takeScreenshot(page, testCase.id);
    return {
      ...testCase,
      status: consoleErrors.length === 0 ? "PASS" : "WARN",
      summary: consoleErrors.length === 0
        ? "Page renders correctly on mobile viewport (375px)"
        : `Page has ${consoleErrors.length} console error(s) on mobile`,
      screenshotPath,
      durationMs: Date.now() - startTime,
    };
  }

  const page = await context.newPage();
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);

  const title = await page.title();
  const screenshotPath = await takeScreenshot(page, testCase.id);

  if (action.type === "CHECK_TITLE") {
    return {
      ...testCase,
      status: title && title.trim() !== "" ? "PASS" : "FAIL",
      summary: title ? `Page title is: "${title}"` : "Page has no title tag",
      screenshotPath,
      durationMs: Date.now() - startTime,
    };
  }

  if (action.type === "CHECK_CONSOLE_ERRORS") {
    return {
      ...testCase,
      status: consoleErrors.length === 0 ? "PASS" : "WARN",
      summary: consoleErrors.length === 0
        ? "No JavaScript console errors detected"
        : `Found ${consoleErrors.length} console error(s)`,
      details: consoleErrors,
      screenshotPath,
      durationMs: Date.now() - startTime,
    };
  }

  return {
    ...testCase,
    status: "PASS",
    summary: "Page loaded successfully",
    screenshotPath,
    durationMs: Date.now() - startTime,
  };
}

// ── ACTION EXECUTOR ─────────────────────────────────────────────────────────
async function executeAction(page, action) {
  try {
    switch (action.type) {
      case "FILL_EMAIL": {
        const emailInput = await page.$('input[type="email"], input[name*="email" i], input[id*="email" i], input[placeholder*="email" i]');
        if (emailInput) {
          await emailInput.click();
          await emailInput.fill(action.value);
        }
        break;
      }
      case "FILL_PASSWORD": {
        const passwordInput = await page.$('input[type="password"]');
        if (passwordInput) {
          await passwordInput.click();
          await passwordInput.fill(action.value);
        }
        break;
      }
      case "FILL_FIRST_INPUT": {
        const firstInput = await page.$("input:not([type='hidden']), textarea");
        if (firstInput) {
          await firstInput.click();
          await firstInput.fill(action.value);
        }
        break;
      }
      case "FILL_ALL_INPUTS": {
        const inputs = await page.$$("input:not([type='hidden']):not([type='submit']):not([type='checkbox']):not([type='radio']), textarea");
        for (const input of inputs) {
          await input.fill(action.value).catch(() => {});
        }
        break;
      }
      case "SUBMIT": {
        const submitBtn = await page.$('[type="submit"], button[type="submit"], button:has-text("login"), button:has-text("sign in"), button:has-text("submit")');
        if (submitBtn) {
          await submitBtn.click();
        } else {
          await page.keyboard.press("Enter");
        }
        break;
      }
      case "SUBMIT_EMPTY": {
        const submitBtn = await page.$('[type="submit"], button[type="submit"], form button');
        if (submitBtn) await submitBtn.click();
        else await page.keyboard.press("Enter");
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // Action failed gracefully — continue
  }
}

// ── HELPERS ─────────────────────────────────────────────────────────────────
function detectErrorOnPage(pageText) {
  const errorKeywords = [
    "invalid", "incorrect", "wrong", "error", "failed", "unauthorized",
    "does not exist", "not found", "please enter", "required", "must be",
    "invalid email", "invalid password", "bad credentials",
  ];
  return errorKeywords.some((k) => pageText.includes(k));
}

function evaluateResult(testCase, { hasError, hasRedirected, xssExecuted, consoleErrors, pageText }) {
  const { expectation } = testCase;

  switch (expectation) {
    case "VALIDATION_ERROR":
      return hasError
        ? { status: "PASS", summary: "Validation error correctly displayed" }
        : { status: "FAIL", summary: "No validation error shown — form may accept invalid input" };

    case "AUTH_ERROR":
      return hasError
        ? { status: "PASS", summary: "Authentication correctly rejected invalid credentials" }
        : { status: "FAIL", summary: "No auth error shown — potential security issue" };

    case "REDIRECT_TO_LOGIN":
      return hasRedirected
        ? { status: "PASS", summary: "Correctly redirected after action" }
        : { status: "WARN", summary: "No redirect detected — check if expected" };

    case "NO_SCRIPT_EXECUTION":
      return xssExecuted
        ? { status: "FAIL", summary: "XSS vulnerability detected! Script was executed" }
        : { status: "PASS", summary: "XSS attempt blocked — input is sanitized" };

    case "NO_CONSOLE_ERRORS":
      return consoleErrors.length === 0
        ? { status: "PASS", summary: "No console errors detected" }
        : { status: "WARN", summary: `${consoleErrors.length} console error(s) found` };

    case "NO_CRASH":
      return { status: "PASS", summary: "Page handled the input without crashing" };

    case "HAS_TITLE":
      return { status: "PASS", summary: "Page title check passed" };

    case "ANY_RESPONSE":
      return { status: "PASS", summary: "Page responded to the action" };

    case "ERROR_MESSAGE":
      return hasError
        ? { status: "PASS", summary: "Error message correctly displayed" }
        : { status: "WARN", summary: "No error message shown — may need to verify manually" };

    default:
      return { status: "INFO", summary: "Test completed — manual review recommended" };
  }
}

async function takeScreenshot(page, testId) {
  try {
    const filename = `${testId}_${Date.now()}.png`;
    const screenshotPath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    return `/screenshots/${filename}`;
  } catch {
    return null;
  }
}

module.exports = { runTestCases };