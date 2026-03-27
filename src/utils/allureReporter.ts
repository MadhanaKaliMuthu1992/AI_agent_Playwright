import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

interface AllureStep {
  name: string;
  status: "passed" | "failed" | "skipped" | "broken";
  statusDetails?: { message?: string; trace?: string };
  start: number;
  stop: number;
  attachments: { name: string; source: string; type: string }[];
}

interface AllureTest {
  uuid: string;
  name: string;
  fullName: string;
  status: "passed" | "failed" | "skipped" | "broken";
  statusDetails?: { message?: string; trace?: string };
  start: number;
  stop?: number;
  steps: AllureStep[];
  attachments: { name: string; source: string; type: string }[];
  labels: { name: string; value: string }[];
}

export class AllureReporter {
  private outputDir: string;
  private currentTest: AllureTest | null = null;
  private currentStep: AllureStep | null = null;

  constructor(outputDir = "allure-results") {
    this.outputDir = outputDir;
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // ── Start a new test case ─────────────────────────────────────────────────
  startTest(name: string, suite = "AI QA Agent") {
    this.currentTest = {
      uuid: uuidv4(),
      name,
      fullName: `${suite}.${name}`,
      status: "passed",
      start: Date.now(),
      steps: [],
      attachments: [],
      labels: [
        { name: "suite",     value: suite },
        { name: "framework", value: "Playwright" },
        { name: "language",  value: "TypeScript" },
      ],
    };
    console.log(`📋 Allure test started: ${name}`);
  }

  // ── Start a step inside the current test ──────────────────────────────────
  startStep(name: string) {
    if (!this.currentTest) return;
    this.currentStep = {
      name,
      status: "passed",
      start: Date.now(),
      stop: Date.now(),
      attachments: [],
    };
  }

  // ── End the current step ──────────────────────────────────────────────────
  endStep(status: "passed" | "failed" | "broken" = "passed", error?: Error) {
    if (!this.currentTest || !this.currentStep) return;
    this.currentStep.status = status;
    this.currentStep.stop   = Date.now();
    if (error) {
      this.currentStep.statusDetails = {
        message: error.message,
        trace:   error.stack,
      };
    }
    this.currentTest.steps.push(this.currentStep);
    this.currentStep = null;
  }

  // ── Attach a screenshot to the current step or test ───────────────────────
  attachScreenshot(screenshotPath: string, name = "Screenshot") {
    if (!fs.existsSync(screenshotPath)) return;

    const ext      = path.extname(screenshotPath);
    const fileName = `${uuidv4()}${ext}`;
    const destPath = path.join(this.outputDir, fileName);

    fs.copyFileSync(screenshotPath, destPath);

    const attachment = { name, source: fileName, type: "image/png" };

    if (this.currentStep) {
      this.currentStep.attachments.push(attachment);
    } else if (this.currentTest) {
      this.currentTest.attachments.push(attachment);
    }
  }

  // ── Attach a video to the current test ───────────────────────────────────
  attachVideo(videoPath: string, name = "Test Recording") {
    if (!this.currentTest) return;
    if (!fs.existsSync(videoPath)) {
      console.warn(`⚠️  Video not found, skipping attachment: ${videoPath}`);
      return;
    }

    const ext      = path.extname(videoPath) || ".webm"; // Playwright records .webm by default
    const fileName = `${uuidv4()}${ext}`;
    const destPath = path.join(this.outputDir, fileName);

    fs.copyFileSync(videoPath, destPath);

    // Allure supports video/webm and video/mp4
    const mimeType = ext === ".mp4" ? "video/mp4" : "video/webm";

    const attachment = { name, source: fileName, type: mimeType };

    // Always attach video at test level (not step level) so it shows in the report header
    this.currentTest.attachments.push(attachment);

    console.log(`🎥 Video attached to Allure report: ${fileName}`);
  }

  // ── Attach plain text (e.g. DOM snapshot, AI response) ───────────────────
  attachText(content: string, name = "Details", fileName?: string) {
    if (!this.currentTest) return;

    const source = fileName ?? `${uuidv4()}.txt`;
    fs.writeFileSync(path.join(this.outputDir, source), content, "utf-8");

    const attachment = { name, source, type: "text/plain" };
    if (this.currentStep) {
      this.currentStep.attachments.push(attachment);
    } else {
      this.currentTest.attachments.push(attachment);
    }
  }

  // ── Mark test as failed ───────────────────────────────────────────────────
  failTest(error: Error) {
    if (!this.currentTest) return;
    this.currentTest.status = "failed";
    this.currentTest.statusDetails = {
      message: error.message,
      trace:   error.stack,
    };
    // Also fail any open step
    if (this.currentStep) {
      this.endStep("failed", error);
    }
  }

  // ── End the test and write result JSON ────────────────────────────────────
  endTest(status?: "passed" | "failed" | "broken") {
    if (!this.currentTest) return;

    if (status) this.currentTest.status = status;
    this.currentTest.stop = Date.now();

    const resultPath = path.join(
      this.outputDir,
      `${this.currentTest.uuid}-result.json`
    );

    fs.writeFileSync(resultPath, JSON.stringify(this.currentTest, null, 2), "utf-8");
    console.log(`📊 Allure result written: ${resultPath}`);
    console.log(`   Status: ${this.currentTest.status} | Steps: ${this.currentTest.steps.length}`);

    this.currentTest = null;
  }

  // ── Write environment info ────────────────────────────────────────────────
  writeEnvironment(info: Record<string, string>) {
    const lines = Object.entries(info)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
    fs.writeFileSync(path.join(this.outputDir, "environment.properties"), lines, "utf-8");
  }
}