import { writeFileSync } from "fs";
import { join } from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const PROJECT_ENDPOINT = `${BASE_URL}/api/v1/test/project`;

async function globalSetup() {
  const res = await fetch(PROJECT_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  if (!res.ok) throw new Error(`Failed to create Playwright test project: HTTP ${res.status} — ${await res.text()}`);
  const { projectId, publicKey } = await res.json();
  writeFileSync(join(__dirname, ".pw-project.json"), JSON.stringify({ projectId, publicKey, baseUrl: BASE_URL }));
  process.env.PW_PROJECT_ID = projectId;
  process.env.PW_PUBLIC_KEY = publicKey;
  console.log(`[Playwright Setup] Project: ${projectId}`);
}

export default globalSetup;
