const { chromium } = require("playwright");

/**
 * Stage 1 — Opens the page, scans its structure, classifies page type
 */
async function analyzePage(url, pushProgress) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    pushProgress("Opening page in headless browser...");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000); // Let JS-rendered content settle

    pushProgress("Scanning page structure...");

    // ── Extract all input fields ────────────────────────────────────────────
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("input, textarea, select")).map((el) => ({
        type: el.type || el.tagName.toLowerCase(),
        name: el.name || "",
        id: el.id || "",
        placeholder: el.placeholder || "",
        required: el.required,
        autocomplete: el.autocomplete || "",
      }));
    });

    // ── Extract all forms ───────────────────────────────────────────────────
    const forms = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("form")).map((form, i) => ({
        index: i,
        action: form.action || "",
        method: form.method || "GET",
        inputCount: form.querySelectorAll("input").length,
        hasSubmitButton: !!form.querySelector('[type="submit"], button[type="submit"], button'),
      }));
    });

    // ── Extract buttons ─────────────────────────────────────────────────────
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("button, [type='submit'], [role='button']")).map((btn) => ({
        text: btn.innerText?.trim() || btn.value || "",
        type: btn.type || "button",
      }));
    });

    // ── Extract internal links ──────────────────────────────────────────────
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[href]"))
        .map((a) => ({ href: a.href, text: a.innerText?.trim() || "" }))
        .filter((l) => l.href.startsWith("http"))
        .slice(0, 20); // Limit to 20 links
    });

    // ── Page metadata ───────────────────────────────────────────────────────
    const title = await page.title();
    const currentUrl = page.url();

    // ── Classify page type using heuristics ────────────────────────────────
    const pageType = classifyPage(inputs, buttons, title, currentUrl);

    // ── Check if page requires auth (protected route test) ─────────────────
    const hasAuthIndicators = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return (
        text.includes("dashboard") ||
        text.includes("welcome") ||
        text.includes("logout") ||
        text.includes("sign out") ||
        !!document.querySelector("[class*='dashboard'], [id*='dashboard']")
      );
    });

    return {
      url,
      currentUrl,
      title,
      pageType,
      inputs,
      forms,
      buttons,
      links,
      hasAuthIndicators,
      isRedirected: url !== currentUrl,
    };
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Classify the page type based on inputs and content
 */
function classifyPage(inputs, buttons, title, url) {
  const inputTypes = inputs.map((i) => i.type.toLowerCase());
  const inputNames = inputs.map((i) => (i.name + i.id + i.placeholder).toLowerCase());
  const titleLower = title.toLowerCase();
  const urlLower = url.toLowerCase();

  const hasPassword = inputTypes.includes("password");
  const hasEmail = inputTypes.includes("email") || inputNames.some((n) => n.includes("email") || n.includes("user"));
  const hasUsername = inputNames.some((n) => n.includes("user") || n.includes("login"));
  const hasSearch = inputTypes.includes("search") || inputNames.some((n) => n.includes("search"));

  const loginKeywords = ["login", "sign in", "signin", "log in"];
  const registerKeywords = ["register", "sign up", "signup", "create account"];

  const isLoginPage =
    hasPassword &&
    (hasEmail || hasUsername) &&
    (loginKeywords.some((k) => titleLower.includes(k) || urlLower.includes(k)) || inputs.length <= 3);

  const isRegisterPage =
    hasPassword &&
    (hasEmail || hasUsername) &&
    registerKeywords.some((k) => titleLower.includes(k) || urlLower.includes(k));

  const isSearchPage = hasSearch && !hasPassword;

  if (isRegisterPage) return "REGISTRATION";
  if (isLoginPage) return "LOGIN";
  if (hasPassword && hasEmail) return "LOGIN"; // Fallback for login-like pages
  if (isSearchPage) return "SEARCH";
  if (inputs.length === 0) return "STATIC";
  return "GENERIC_FORM";
}

module.exports = { analyzePage };