import { readFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";

async function globalTeardown() {
  const credFile = join(__dirname, ".pw-project.json");
  if (!existsSync(credFile)) return;
  const { projectId, baseUrl } = JSON.parse(readFileSync(credFile, "utf8"));
  const endpoint = `${baseUrl}/api/v1/test/project`;
  try {
    await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    console.log(`[Playwright Teardown] Cleaned up project: ${projectId}`);
  } catch (e) {
    console.warn(`[Playwright Teardown] Cleanup failed: ${e}`);
  } finally {
    try { unlinkSync(credFile); } catch { /* already gone */ }
  }
}

export default globalTeardown;
