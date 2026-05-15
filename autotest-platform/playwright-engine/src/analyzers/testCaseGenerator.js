/**
 * Stage 2 — Generates test cases based on what the page analyzer found.
 * Each test case is a structured object that the test runner can execute.
 */
async function generateTestCases(pageData, pushProgress) {
  const cases = [];

  switch (pageData.pageType) {
    case "LOGIN":
      pushProgress("Generating login test cases...");
      cases.push(...loginTestCases(pageData));
      break;
    case "REGISTRATION":
      pushProgress("Generating registration test cases...");
      cases.push(...registrationTestCases(pageData));
      break;
    case "SEARCH":
      pushProgress("Generating search test cases...");
      cases.push(...searchTestCases(pageData));
      break;
    case "GENERIC_FORM":
      pushProgress("Generating generic form test cases...");
      cases.push(...genericFormTestCases(pageData));
      break;
    case "STATIC":
      pushProgress("Generating static page test cases...");
      cases.push(...staticPageTestCases(pageData));
      break;
    default:
      cases.push(...genericFormTestCases(pageData));
  }

  // Always add universal tests regardless of page type
  cases.push(...universalTestCases(pageData));

  return cases;
}

// ── LOGIN TEST CASES ────────────────────────────────────────────────────────
function loginTestCases(pageData) {
  return [
    {
      id: "login_empty_fields",
      name: "Submit with empty fields",
      description: "Click login with no input — should show validation error",
      category: "VALIDATION",
      actions: [{ type: "SUBMIT_EMPTY" }],
      expectation: "VALIDATION_ERROR",
    },
    {
      id: "login_invalid_email_format",
      name: "Invalid email format",
      description: "Enter badly formatted email (notanemail) with any password",
      category: "VALIDATION",
      actions: [
        { type: "FILL_EMAIL", value: "notanemail" },
        { type: "FILL_PASSWORD", value: "SomePassword123" },
        { type: "SUBMIT" },
      ],
      expectation: "VALIDATION_ERROR",
    },
    {
      id: "login_wrong_credentials",
      name: "Wrong email + wrong password",
      description: "Both credentials are wrong — should show auth error",
      category: "AUTH",
      actions: [
        { type: "FILL_EMAIL", value: "wrong@example.com" },
        { type: "FILL_PASSWORD", value: "WrongPassword999" },
        { type: "SUBMIT" },
      ],
      expectation: "AUTH_ERROR",
    },
    {
      id: "login_correct_email_wrong_password",
      name: "Correct email format + wrong password",
      description: "Valid email format but wrong password",
      category: "AUTH",
      actions: [
        { type: "FILL_EMAIL", value: "test@gmail.com" },
        { type: "FILL_PASSWORD", value: "DefinitelyWrongPass!" },
        { type: "SUBMIT" },
      ],
      expectation: "AUTH_ERROR",
    },
    {
      id: "login_sql_injection",
      name: "SQL Injection in email field",
      description: "Security test — inject SQL in email field",
      category: "SECURITY",
      actions: [
        { type: "FILL_EMAIL", value: "' OR '1'='1'; --" },
        { type: "FILL_PASSWORD", value: "anything" },
        { type: "SUBMIT" },
      ],
      expectation: "AUTH_ERROR", // Should NOT succeed
    },
    {
      id: "login_xss_attempt",
      name: "XSS attempt in email field",
      description: "Security test — inject script tag in email field",
      category: "SECURITY",
      actions: [
        { type: "FILL_EMAIL", value: "<script>alert('xss')</script>" },
        { type: "FILL_PASSWORD", value: "anything" },
        { type: "SUBMIT" },
      ],
      expectation: "AUTH_ERROR",
    },
    {
      id: "login_password_only",
      name: "Password only — empty email",
      description: "Fill password but leave email empty",
      category: "VALIDATION",
      actions: [
        { type: "FILL_EMAIL", value: "" },
        { type: "FILL_PASSWORD", value: "SomePassword123" },
        { type: "SUBMIT" },
      ],
      expectation: "VALIDATION_ERROR",
    },
    {
      id: "login_email_only",
      name: "Email only — empty password",
      description: "Fill email but leave password empty",
      category: "VALIDATION",
      actions: [
        { type: "FILL_EMAIL", value: "test@example.com" },
        { type: "FILL_PASSWORD", value: "" },
        { type: "SUBMIT" },
      ],
      expectation: "VALIDATION_ERROR",
    },
    {
      id: "login_session_auth_check",
      name: "Protected URL access without login",
      description: "Try to access dashboard/protected URL in a new browser context without logging in",
      category: "SESSION",
      actions: [{ type: "CHECK_AUTH_ROUTE", targetUrl: pageData.url }],
      expectation: "REDIRECT_TO_LOGIN",
    },
  ];
}

// ── REGISTRATION TEST CASES ─────────────────────────────────────────────────
function registrationTestCases(pageData) {
  return [
    {
      id: "reg_empty_submit",
      name: "Submit empty registration form",
      category: "VALIDATION",
      actions: [{ type: "SUBMIT_EMPTY" }],
      expectation: "VALIDATION_ERROR",
    },
    {
      id: "reg_invalid_email",
      name: "Invalid email format on registration",
      category: "VALIDATION",
      actions: [
        { type: "FILL_EMAIL", value: "bademail@" },
        { type: "FILL_PASSWORD", value: "ValidPass123!" },
        { type: "SUBMIT" },
      ],
      expectation: "VALIDATION_ERROR",
    },
    {
      id: "reg_weak_password",
      name: "Very short/weak password",
      category: "VALIDATION",
      actions: [
        { type: "FILL_EMAIL", value: "test@example.com" },
        { type: "FILL_PASSWORD", value: "123" },
        { type: "SUBMIT" },
      ],
      expectation: "VALIDATION_ERROR",
    },
    {
      id: "reg_duplicate_email",
      name: "Register with already-used email",
      category: "BUSINESS_LOGIC",
      actions: [
        { type: "FILL_EMAIL", value: "existing@example.com" },
        { type: "FILL_PASSWORD", value: "ValidPass123!" },
        { type: "SUBMIT" },
      ],
      expectation: "ERROR_MESSAGE",
    },
  ];
}

// ── SEARCH TEST CASES ───────────────────────────────────────────────────────
function searchTestCases(pageData) {
  return [
    {
      id: "search_empty",
      name: "Submit empty search",
      category: "VALIDATION",
      actions: [{ type: "SUBMIT_EMPTY" }],
      expectation: "ANY_RESPONSE",
    },
    {
      id: "search_special_chars",
      name: "Search with special characters",
      category: "SECURITY",
      actions: [{ type: "FILL_FIRST_INPUT", value: "<script>alert(1)</script>" }, { type: "SUBMIT" }],
      expectation: "NO_SCRIPT_EXECUTION",
    },
    {
      id: "search_long_string",
      name: "Very long search string",
      category: "EDGE_CASE",
      actions: [{ type: "FILL_FIRST_INPUT", value: "a".repeat(500) }, { type: "SUBMIT" }],
      expectation: "NO_CRASH",
    },
  ];
}

// ── GENERIC FORM TEST CASES ─────────────────────────────────────────────────
function genericFormTestCases(pageData) {
  return [
    {
      id: "form_empty_submit",
      name: "Submit form with all fields empty",
      category: "VALIDATION",
      actions: [{ type: "SUBMIT_EMPTY" }],
      expectation: "VALIDATION_ERROR",
    },
    {
      id: "form_xss_in_inputs",
      name: "XSS injection across all inputs",
      category: "SECURITY",
      actions: [{ type: "FILL_ALL_INPUTS", value: "<script>alert('xss')</script>" }, { type: "SUBMIT" }],
      expectation: "NO_SCRIPT_EXECUTION",
    },
  ];
}

// ── STATIC PAGE TEST CASES ──────────────────────────────────────────────────
function staticPageTestCases(pageData) {
  return [
    {
      id: "static_load_check",
      name: "Page loads without errors",
      category: "BASIC",
      actions: [{ type: "PAGE_LOAD_CHECK" }],
      expectation: "NO_CONSOLE_ERRORS",
    },
    {
      id: "static_broken_links",
      name: "Check for broken links",
      category: "QUALITY",
      actions: [{ type: "CHECK_BROKEN_LINKS" }],
      expectation: "NO_BROKEN_LINKS",
    },
  ];
}

// ── UNIVERSAL TEST CASES (run on every page) ────────────────────────────────
function universalTestCases(pageData) {
  return [
    {
      id: "universal_page_title",
      name: "Page has a title",
      category: "BASIC",
      actions: [{ type: "CHECK_TITLE" }],
      expectation: "HAS_TITLE",
    },
    {
      id: "universal_console_errors",
      name: "No JavaScript console errors",
      category: "QUALITY",
      actions: [{ type: "CHECK_CONSOLE_ERRORS" }],
      expectation: "NO_CONSOLE_ERRORS",
    },
    {
      id: "universal_mobile_viewport",
      name: "Page works on mobile viewport",
      category: "RESPONSIVE",
      actions: [{ type: "CHECK_MOBILE_VIEWPORT" }],
      expectation: "NO_CRASH",
    },
  ];
}

module.exports = { generateTestCases };