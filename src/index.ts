import { AIAgent } from "./agent/aiAgent.js";
import { AllureReporter } from "./utils/allureReporter.js";
import readline from "readline";

async function askPrompt(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    console.log("\n╔══════════════════════════════════════════╗");
    console.log(  "║       🤖 AI-QA-AGENT (MCP-Powered)       ║");
    console.log(  "╚══════════════════════════════════════════╝");
    console.log("Example: Go to https://playwright.dev and click GET STARTED\n");
    rl.question("📝 Enter your test prompt: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const prompt = process.argv[2] ?? (await askPrompt());

  if (!prompt) {
    console.error("❌ No prompt provided.");
    process.exit(1);
  }

  console.log(`\n🚀 Running: "${prompt}"\n`);

  // ── Allure setup ──────────────────────────────────────────────────────────
  const allure = new AllureReporter("allure-results");

  allure.writeEnvironment({
    "Browser":    "Chromium",
    "AI Model":   process.env.GEMINI_MODEL        ?? "gemini-2.0-flash",
    "Base URL":   process.env.BASE_URL             ?? "N/A",
    "Headless":   "false",
    "Recorded":   "true",
  });

  const testName = prompt.slice(0, 80); // use prompt as test name (truncated)
  allure.startTest(testName, "AI QA Agent");

  // ── Run agent ─────────────────────────────────────────────────────────────
  const agent = new AIAgent(allure);

  try {
    await agent.run(prompt);
    allure.endTest("passed");
    console.log("\n✅ Test passed");
  } catch (err: any) {
    allure.failTest(err);
    allure.endTest("failed");
    console.error("\n❌ Test failed:", err.message);
  }

  console.log('\n📊 Generate report: npm run report');
}

main();