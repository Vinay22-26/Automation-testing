const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { analyzeAndTest } = require("./testOrchestrator");

const app = express();
app.use(cors());
app.use(express.json());

// In-memory job store (Spring Boot will poll this)
const jobs = {};

// POST /test — Spring Boot submits a URL to test
app.post("/test", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const jobId = uuidv4();
  jobs[jobId] = { status: "queued", progress: [], result: null };

  res.json({ jobId, status: "queued" });

  // Run async — don't await here so response returns immediately
  runJob(jobId, url);
});

// GET /test/:jobId — Spring Boot polls for progress & results
app.get("/test/:jobId", (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

// GET /health
app.get("/health", (_, res) => res.json({ status: "ok" }));

async function runJob(jobId, url) {
  const pushProgress = (message) => {
    jobs[jobId].progress.push({ time: new Date().toISOString(), message });
    console.log(`[${jobId}] ${message}`);
  };

  try {
    jobs[jobId].status = "running";
    pushProgress(`Starting analysis of: ${url}`);
    const result = await analyzeAndTest(url, pushProgress);
    jobs[jobId].status = "completed";
    jobs[jobId].result = result;
    pushProgress("All tests completed.");
  } catch (err) {
    jobs[jobId].status = "failed";
    jobs[jobId].error = err.message;
    console.error(`Job ${jobId} failed:`, err);
  }
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Playwright Engine running on port ${PORT}`));