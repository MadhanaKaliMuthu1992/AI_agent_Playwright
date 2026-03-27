import axios from "axios";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export class GeminiClient {
  private model: string;
  private apiVersion: string;
  private apiKey: string;
  private baseUrl: string;

  // Pre-call delay in ms to stay under free tier (10 RPM = 1 call per 6s, use 7s to be safe)
  private preCallDelayMs: number;

  // Model fallback chain — tries these in order if rate limited
  private modelFallbacks = [
    { model: "gemini-2.0-flash-lite",     apiVersion: "v1beta" },
    { model: "gemini-2.0-flash-001",      apiVersion: "v1beta" },
    { model: "gemini-2.0-flash-lite-001", apiVersion: "v1beta" },
    { model: "gemini-2.5-flash-lite",     apiVersion: "v1beta" },
    { model: "gemini-2.5-flash",          apiVersion: "v1beta" },
  ];

  constructor() {
    this.model          = process.env.GEMINI_MODEL       ?? "gemini-2.0-flash";
    this.apiVersion     = process.env.GEMINI_API_VERSION ?? "v1beta";
    this.apiKey         = process.env.GEMINI_API_KEY     ?? "";
    this.baseUrl        = process.env.GEMINI_BASE_URL    ?? "https://generativelanguage.googleapis.com";
    this.preCallDelayMs = parseInt(process.env.GEMINI_DELAY_MS ?? "7000");

    if (!this.apiKey) {
      throw new Error("❌ GEMINI_API_KEY is missing from .env file");
    }

    console.log(`🤖 Using Gemini model: ${this.model} (${this.apiVersion})`);
    console.log(`⏱️  Pre-call delay: ${this.preCallDelayMs}ms (to respect free tier limits)`);
  }

  // ── Plan high-level steps from user prompt ────────────────────────────────
  async planSteps(prompt: string): Promise<{ steps: any[]; rawResponse: string }> {
    const isLongPrompt = prompt.length > 2000;

    const systemInstruction = `
You are a QA automation expert. Convert this user instruction into test steps JSON.

Instruction: "${prompt}"

Rules:
- Break down EVERY action mentioned into individual steps
- For long prompts with many actions, return ALL steps — do not skip any
- Each step must have:
  - "action": one of goto | click | fill | select | hover | wait | scroll | maximize | assert
  - "description": plain English description of what to do
  - "url": (only for goto)
  - "value": (only for fill/select)
  - "target": (only for scroll — what to scroll to, e.g. "Electron Application")

Example:
[
  { "action": "goto", "url": "https://example.com", "description": "Open the website" },
  { "action": "maximize", "description": "Maximize the browser window" },
  { "action": "click", "description": "Click the GET STARTED button" },
  { "action": "scroll", "target": "Electron Application", "description": "Scroll down to Electron Application section" },
  { "action": "click", "description": "Click on Electron Application" }
]

${isLongPrompt ? "This is a long prompt. Make sure to include EVERY action mentioned without skipping any." : ""}

Return ONLY a valid JSON array. No markdown, no explanation, no extra text.
`;

    const rawResponse = await this.callWithFallback(systemInstruction, 4096);

    console.log("🔍 RAW GEMINI RESPONSE (planSteps):");
    console.log(rawResponse.slice(0, 500) + (rawResponse.length > 500 ? "\n...(truncated)" : ""));

    const cleaned = rawResponse
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) {
      console.error("❌ Could not parse JSON from response:", cleaned);
      throw new Error("AI did not return valid steps JSON. Check your GEMINI_API_KEY and model name.");
    }

    const steps = JSON.parse(match[0]);
    console.log(`✅ Parsed ${steps.length} steps successfully`);

    return { steps, rawResponse };
  }

  // ── Decide exact MCP tool call based on live DOM ──────────────────────────
  async decideToolCall(
    step: any,
    dom: string
  ): Promise<{ toolCall: { tool: string; params: any }; rawResponse: string }> {

    const domSlice = dom.slice(0, 6000);

    const rawResponse = await this.callWithFallback(`
You are a Playwright MCP tool selector. Your job is to pick the right tool and selector.

Current page DOM snapshot:
${domSlice}

Task: "${step.description}"
Action type: "${step.action}"
${step.value  ? `Value: "${step.value}"`          : ""}
${step.url    ? `URL: "${step.url}"`               : ""}
${step.target ? `Scroll target: "${step.target}"` : ""}

Available MCP tools:
- playwright_navigate        { url: string }
- playwright_click           { selector: string }
- playwright_fill            { selector: string, value: string }
- playwright_select_option   { selector: string, value: string }
- playwright_hover           { selector: string }
- playwright_screenshot      { name: string }
- playwright_evaluate        { script: string }
- playwright_wait_for_url    { url: string }
- playwright_maximize        {}
- playwright_scroll          { selector: string }

For "scroll" actions use playwright_evaluate:
  { "tool": "playwright_evaluate", "params": { "script": "document.querySelector('a[href*=\"electron\"]').scrollIntoView()" } }

Selector priority (use best available from DOM):
1. button:has-text("exact text")
2. [role="button"][name="text"]
3. text=exact text
4. #element-id
5. .css-class
6. a:has-text("text")

Return ONLY valid JSON (no markdown, no explanation):
{ "tool": "playwright_click", "params": { "selector": "button:has-text('GET STARTED')" } }
`, 1024);

    const cleaned = rawResponse
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("❌ Could not parse tool call JSON:", cleaned);
      throw new Error(`AI did not return valid tool call for: ${step.description}`);
    }

    return {
      toolCall: JSON.parse(match[0]),
      rawResponse,
    };
  }

  // ── Call with pre-delay + model fallback chain ────────────────────────────
  private async callWithFallback(prompt: string, maxTokens = 2048): Promise<string> {
    // Always wait before calling to respect free tier rate limits
    console.log(`⏳ Waiting ${this.preCallDelayMs / 1000}s before API call...`);
    await sleep(this.preCallDelayMs);

    // Try primary model first
    try {
      return await this.call(prompt, maxTokens, this.model, this.apiVersion);
    } catch (err: any) {
      const is429 = err?.message?.includes("429") || err?.message?.includes("quota");
      if (!is429) throw err;
      console.warn(`⚠️  Primary model (${this.model}) rate limited. Trying fallback models...`);
    }

    // Try fallback models — each with its own pre-delay
    for (const fallback of this.modelFallbacks) {
      if (fallback.model === this.model) continue;

      try {
        console.warn(`🔄 Trying fallback model: ${fallback.model}`);
        await sleep(this.preCallDelayMs);
        return await this.call(prompt, maxTokens, fallback.model, fallback.apiVersion);
      } catch (err: any) {
        const is429 = err?.message?.includes("429") || err?.message?.includes("quota");
        if (!is429) throw err;
        console.warn(`⚠️  Fallback model (${fallback.model}) also rate limited. Trying next...`);
      }
    }

    // All models rate limited — wait 60s and retry primary once more
    console.warn(`⏳ All models rate limited. Waiting 60s before final retry...`);
    await sleep(60000);
    return await this.call(prompt, maxTokens, this.model, this.apiVersion);
  }

  // ── Core Gemini API call (single attempt with retries) ────────────────────
  async call(
    prompt: string,
    maxTokens = 2048,
    model = this.model,
    apiVersion = this.apiVersion,
    retries = 2  // Reduced from 5 — fallback chain handles model switching instead
  ): Promise<string> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const url = `${this.baseUrl}/${apiVersion}/models/${model}:generateContent?key=${this.apiKey}`;

        const response = await axios.post(
          url,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature: 0.1,
            },
          },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 60000,
          }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Empty response from Gemini API");

        return text.trim();

      } catch (err: any) {
        const status  = err?.response?.status;
        const retryMs = this.parseRetryDelay(err) ?? Math.min((attempt + 1) * 10000, 30000);
        const message = err?.response?.data?.error?.message ?? err.message;

        if (status === 429 && attempt < retries - 1) {
          console.warn(`[429] Rate limited on ${model}. Waiting ${retryMs / 1000}s before retry ${attempt + 1}/${retries}...`);
          await sleep(retryMs);
          continue;
        }

        if ((err.code === "ECONNABORTED" || err.code === "ENOTFOUND") && attempt < retries - 1) {
          console.warn(`[NETWORK] ${err.code} — Retrying in 5s...`);
          await sleep(5000);
          continue;
        }

        throw new Error(`Gemini API error (${status ?? "unknown"}): ${message}`);
      }
    }
    throw new Error(`Gemini API failed after ${retries} retries on model: ${model}`);
  }

  private parseRetryDelay(err: any): number | null {
    try {
      const details   = err?.response?.data?.error?.details ?? [];
      const retryInfo = details.find((d: any) => d["@type"]?.includes("RetryInfo"));
      const raw       = retryInfo?.retryDelay;
      if (raw) return Math.ceil(parseFloat(raw) * 1000) + 1000;

      const msgMatch = err?.response?.data?.error?.message?.match(/retry in (\d+(\.\d+)?)s/i);
      if (msgMatch) return Math.ceil(parseFloat(msgMatch[1]) * 1000) + 1000;
    } catch {}
    return null;
  }
}