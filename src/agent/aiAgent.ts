import { GeminiClient } from "../ai/geminiClient.js";
import { MCPBrowserClient } from "../mcp/mcpBrowserClient.js";
import { ScriptBuilder } from "../generator/scriptBuilder.js";
import { AllureReporter } from "../utils/allureReporter.js";
import fs from "fs";
import path from "path";

export class AIAgent {
  private gemini: GeminiClient;
  private mcp: MCPBrowserClient;
  private scriptBuilder: ScriptBuilder;
  private allure: AllureReporter | null;

  constructor(allure?: AllureReporter) {
    this.gemini        = new GeminiClient();
    this.mcp           = new MCPBrowserClient();
    this.scriptBuilder = new ScriptBuilder();
    this.allure        = allure ?? null;
  }

  async run(prompt: string) {
    const executedSteps: any[] = [];

    const flowName = prompt.split(",")[0] || "default-flow";

    const safeFlowName = flowName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "")
      .slice(0, 40);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const runFolder = path.join("tests", `${safeFlowName}-${timestamp}`);
    fs.mkdirSync(runFolder, { recursive: true });

    const scriptFile     = path.join(runFolder, "test.spec.ts");
    const auditFile      = path.join(runFolder, "audit.json");
    const screenshotFile = path.join(runFolder, "report.png");
    const finalVideoPath = path.join(runFolder, "recording.webm");

    const auditLog: any = {
      timestamp,
      flowName,
      prompt,
      geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      runFolder,
      scriptFile,
      screenshotFile,
      videoFile: finalVideoPath,
      steps: [],
    };

    let executionError: any = null;

    try {
      // ── 1. Launch browser ────────────────────────────────────────────────
      console.log("🌐 Launching browser...");
      this.allure?.startStep("🌐 Launch browser");
      await this.mcp.launch();
      this.allure?.endStep("passed");

      // ── 2. AI plans steps ────────────────────────────────────────────────
      console.log("\n🧠 AI is planning steps...");
      this.allure?.startStep("🧠 AI planning steps");

      const { steps, rawResponse: planRaw } = await this.gemini.planSteps(prompt);

      auditLog.stepPlanningRawResponse = planRaw;
      auditLog.plannedSteps = steps;

      this.allure?.attachText(planRaw, "AI Plan Raw");
      this.allure?.attachText(JSON.stringify(steps, null, 2), "Parsed Steps");

      this.allure?.endStep("passed");

      // ── 3. Execute steps ─────────────────────────────────────────────────
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepLabel = `Step ${i + 1}: ${step.description}`;

        console.log(`\n▶️ ${stepLabel}`);
        this.allure?.startStep(stepLabel);

        try {
          const dom = await this.mcp.getPageSnapshot();

          const { toolCall, rawResponse: toolRaw } =
            await this.gemini.decideToolCall(step, dom);

          this.allure?.attachText(
            `Tool: ${toolCall.tool}\nParams: ${JSON.stringify(toolCall.params, null, 2)}\n\nAI:\n${toolRaw}`,
            "AI Decision"
          );

          const result = await this.mcp.executeTool(toolCall.tool, toolCall.params);

          const stepScreenshot = path.join(runFolder, `step-${i + 1}.png`);
          await this.mcp.screenshot(stepScreenshot);
          this.allure?.attachScreenshot(stepScreenshot, stepLabel);

          executedSteps.push({ step, toolCall });

          auditLog.steps.push({
            stepNumber: i + 1,
            description: step.description,
            tool: toolCall.tool,
            params: toolCall.params,
            result,
          });

          this.allure?.endStep("passed");

        } catch (err: any) {
          executionError = err;

          const failShot = path.join(runFolder, `fail-step-${i + 1}.png`);
          await this.mcp.screenshot(failShot);

          this.allure?.attachScreenshot(failShot, "Failure Screenshot");
          this.allure?.attachText(err.stack ?? err.message, "Error");

          this.allure?.endStep("failed", err);
          throw err;
        }
      }

      // ── 4. Final screenshot ──────────────────────────────────────────────
      this.allure?.startStep("📸 Final screenshot");
      await this.mcp.screenshot(screenshotFile);
      this.allure?.attachScreenshot(screenshotFile, "Final State");
      this.allure?.endStep("passed");

      // ── 5. Generate script ───────────────────────────────────────────────
      this.allure?.startStep("📝 Generate script");
      const script = this.scriptBuilder.build(executedSteps);
      fs.writeFileSync(scriptFile, script);
      this.allure?.attachText(script, "Generated Script");
      this.allure?.endStep("passed");

      auditLog.status = "SUCCESS";

    } catch (err: any) {
      executionError = err;
      auditLog.status = "FAILED";
      auditLog.error = err.message;

    } finally {
      // ── 🔥 CRITICAL: Close browser first (video finalizes here) ───────────
      await this.mcp.close();

      // ── 🎥 Fetch & attach video ──────────────────────────────────────────
      try {
        const savedVideo = await this.mcp.saveVideo();

        if (savedVideo && fs.existsSync(savedVideo)) {
          fs.copyFileSync(savedVideo, finalVideoPath);

          this.allure?.startStep("🎥 Attach video");
          this.allure?.attachVideo(finalVideoPath, "Execution Video");
          this.allure?.endStep("passed");

          console.log(`🎥 Video attached: ${finalVideoPath}`);
        } else {
          console.warn("⚠️ Video not found");
        }
      } catch (videoErr: any) {
        console.warn("⚠️ Video attach failed:", videoErr.message);
      }

      // ── Save audit log ───────────────────────────────────────────────────
      fs.writeFileSync(auditFile, JSON.stringify(auditLog, null, 2));
      console.log(`📋 Audit saved: ${auditFile}`);

      console.log("🏁 Execution finished.");
    }

    if (executionError) {
      throw executionError;
    }
  }
}