import { chromium, Browser, BrowserContext, Page } from "playwright";

/**
 * MCPBrowserClient
 * ─────────────────
 * Executes Playwright MCP-style tool calls decided by AI.
 * No hardcoded locators — AI picks every selector from live DOM.
 */
export class MCPBrowserClient {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  // ── Launch browser ────────────────────────────────────────────────────────
  async launch() {
    this.browser = await chromium.launch({
      headless: false,
      args: ["--start-maximized"],
    });
    this.context = await this.browser.newContext({
      viewport: null,
      recordVideo: {
        dir: "videos/",
        size: { width: 1920, height: 1080 },
      },
    });
    this.page = await this.context.newPage();
    console.log("✅ Browser launched (maximized)");
    console.log("🎥 Video recording started → videos/");
  }

  // ── Get live DOM snapshot for AI analysis ─────────────────────────────────
  async getPageSnapshot(): Promise<string> {
    if (!this.page) throw new Error("Browser not launched");

    const snapshot = await this.page.evaluate(() => {
      const elements: string[] = [];
      const seen = new Set<string>();

      const selectors = [
        "a", "button", "input", "select", "textarea",
        "mat-select", "mat-option", "mat-form-field",
        "ng-select", "ng-option",
        "ngb-modal-window select", "ngb-modal-window ng-select",
        '[role="button"]', '[role="link"]', '[role="tab"]',
        '[role="menuitem"]', '[role="checkbox"]', '[role="radio"]',
        '[role="combobox"]', '[role="listbox"]',
        "h1", "h2", "h3", "label",
      ];

      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el: any) => {
          const tag = el.tagName.toLowerCase();
          const text = (el.innerText ?? el.value ?? "").trim().slice(0, 60);
          const attrs = [
            el.id                         ? `id="${el.id}"`                                   : "",
            el.name                       ? `name="${el.name}"`                               : "",
            el.type                       ? `type="${el.type}"`                               : "",
            el.getAttribute("role")       ? `role="${el.getAttribute("role")}"`               : "",
            el.getAttribute("aria-label") ? `aria-label="${el.getAttribute("aria-label")}"` : "",
            el.placeholder                ? `placeholder="${el.placeholder}"`                 : "",
            el.getAttribute("ng-reflect-placeholder") ? `ng-reflect-placeholder="${el.getAttribute("ng-reflect-placeholder")}"` : "",
            el.getAttribute("formcontrolname") ? `formcontrolname="${el.getAttribute("formcontrolname")}"` : "",
            el.className                  ? `class="${String(el.className).slice(0, 60)}"`   : "",
            el.href                       ? `href="${String(el.href).slice(0, 80)}"`          : "",
          ].filter(Boolean).join(" ");

          const key = `${tag}|${text}|${attrs}`;
          if (!seen.has(key)) {
            seen.add(key);
            elements.push(`<${tag} ${attrs}>${text}</${tag}>`);
          }
        });
      });

      return elements.slice(0, 100).join("\n");
    });

    return snapshot;
  }

  // ── Execute MCP tool decided by AI ────────────────────────────────────────
  async executeTool(tool: string, params: any): Promise<string> {
    if (!this.page) throw new Error("Browser not launched");

    switch (tool) {

      case "playwright_navigate":
        await this.page.goto(params.url, { waitUntil: "domcontentloaded" });
        await this.page.waitForLoadState("networkidle").catch(() => {});
        return `Navigated to ${params.url}`;

      case "playwright_click":
        await this.page.waitForLoadState("domcontentloaded");
        await this.smartClick(params.selector);
        return `Clicked: ${params.selector}`;

      case "playwright_fill":
        try {
          await this.page.locator(params.selector).fill(params.value);
        } catch {
          await this.page.locator(params.selector).click();
          await this.page.keyboard.type(params.value);
        }
        return `Filled "${params.value}" into ${params.selector}`;

      case "playwright_select_option": {
        try {
          await this.page.locator(params.selector).selectOption(
            { label: params.value.trim() },
            { timeout: 3000 }
          );
          return `Selected "${params.value}" by label`;
        } catch {
          try {
            const selectEl = this.page.locator(params.selector);
            const options = await selectEl.locator("option").all();
            for (const option of options) {
              const text = (await option.textContent() ?? "").trim();
              if (text.toLowerCase().includes(params.value.toLowerCase().trim())) {
                const value = await option.getAttribute("value");
                await selectEl.selectOption({ value: value! });
                return `Selected "${params.value}" via text match`;
              }
            }
          } catch {}

          try {
            console.log("⚠️  Trying autocomplete dropdown...");
            await this.page.locator(params.selector).click({ timeout: 3000 });
            await this.page.waitForTimeout(300);

            // Check if Angular Material panel opened (mat-select — no typing needed)
            const matPanelOpen = await this.page.locator('.cdk-overlay-container mat-option').count().then(n => n > 0).catch(() => false);
            if (!matPanelOpen) {
              // Not a mat-select — type to filter
              await this.page.keyboard.type(params.value, { delay: 100 });
              await this.page.waitForTimeout(500);
            }

            const autocompleteStrategies = [
              // ── ngb-modal native <select> inside modal (Angular Bootstrap) ──
              async () => {
                const modal = this.page!.locator("ngb-modal-window").first();
                await modal.locator("select").selectOption({ label: params.value.trim() });
              },
              async () => {
                const modal = this.page!.locator("ngb-modal-window").first();
                const sel = modal.locator("select");
                const opts = await sel.locator("option").all();
                for (const o of opts) {
                  const t = (await o.textContent() ?? "").trim();
                  if (t.toLowerCase().includes(params.value.toLowerCase())) {
                    await sel.selectOption({ value: (await o.getAttribute("value"))! });
                    return;
                  }
                }
                throw new Error("no match");
              },
              // ── ng-select inside modal (Angular Bootstrap) ──
              async () => {
                const modal = this.page!.locator("ngb-modal-window").first();
                await modal.locator("ng-select").first().click({ timeout: 3000 });
                await this.page!.waitForTimeout(300);
                await this.page!.locator(`ng-option:has-text("${params.value}")`).first().click({ timeout: 3000 });
              },
              async () => {
                const modal = this.page!.locator("ngb-modal-window").first();
                await modal.locator("ng-select").first().click({ timeout: 3000 });
                await this.page!.waitForTimeout(300);
                await this.page!.locator(`.ng-option:has-text("${params.value}")`).first().click({ timeout: 3000 });
              },
              // ── Angular Material CDK overlay ──
              () => this.page!.locator(`.cdk-overlay-container mat-option:has-text("${params.value}")`).first().click({ timeout: 3000 }),
              () => this.page!.locator(`.cdk-overlay-container [role="option"]:has-text("${params.value}")`).first().click({ timeout: 3000 }),
              () => this.page!.locator(`.cdk-overlay-pane mat-option:has-text("${params.value}")`).first().click({ timeout: 3000 }),
              () => this.page!.locator(`mat-option:has-text("${params.value}")`).first().click({ timeout: 3000 }),
              // ── Standard strategies ──
              () => this.page!.locator(`li:has-text("${params.value}")`).first().click({ timeout: 3000 }),
              () => this.page!.locator(`[role="option"]:has-text("${params.value}")`).first().click({ timeout: 3000 }),
              () => this.page!.locator(`[class*="autocomplete"] *:has-text("${params.value}")`).first().click({ timeout: 3000 }),
              () => this.page!.locator(`[class*="dropdown"] li:has-text("${params.value}")`).first().click({ timeout: 3000 }),
              () => this.page!.locator(`[class*="suggestion"]:has-text("${params.value}")`).first().click({ timeout: 3000 }),
              () => this.page!.locator(`[class*="option"]:has-text("${params.value}")`).first().click({ timeout: 3000 }),
              () => this.page!.getByRole("option", { name: params.value }).click({ timeout: 3000 }),
              () => this.page!.getByText(params.value, { exact: true }).last().click({ timeout: 3000 }),
              () => this.page!.getByText(params.value, { exact: false }).last().click({ timeout: 3000 }),
            ];

            for (const strategy of autocompleteStrategies) {
              try {
                await strategy();
                console.log(`✅ Autocomplete selected: "${params.value}"`);
                return `Selected "${params.value}" via autocomplete`;
              } catch {
                continue;
              }
            }

            await this.page.keyboard.press("ArrowDown");
            await this.page.waitForTimeout(200);
            await this.page.keyboard.press("Enter");
            return `Selected "${params.value}" via keyboard Enter`;

          } catch (err: any) {
            throw new Error(`Could not select "${params.value}" — all strategies failed: ${err.message}`);
          }
        }
      }

      case "playwright_hover":
        await this.page.locator(params.selector).hover();
        return `Hovered: ${params.selector}`;

      case "playwright_screenshot":
        await this.page.screenshot({
          path: params.name ?? "report.png",
          fullPage: true,
        });
        return `Screenshot saved: ${params.name}`;

      case "playwright_evaluate": {
        let script = params.script;
        if (script.includes("await")) {
          script = `(async () => { ${script} })()`;
        }
        const result = await this.page.evaluate(script);
        return String(result);
      }

      case "playwright_wait_for_url":
        await this.page.waitForURL(params.url, { timeout: 15000 });
        return `URL matched: ${params.url}`;

      case "playwright_wait": {
        const waitMs = params.ms ?? params.timeout ?? 3000;
        await this.page.waitForTimeout(waitMs);
        return `Waited ${waitMs}ms`;
      }

      case "playwright_maximize":
        try {
          const screenSize = await this.page.evaluate(() => ({
            width: window.screen.availWidth,
            height: window.screen.availHeight,
          }));
          await this.page.setViewportSize(screenSize);
          return `Window maximized to ${screenSize.width}x${screenSize.height}`;
        } catch {
          await this.page.setViewportSize({ width: 1920, height: 1080 });
          return "Window maximized to 1920x1080";
        }

      case "playwright_scroll":
        try {
          await this.page.locator(params.selector).scrollIntoViewIfNeeded();
          return `Scrolled to: ${params.selector}`;
        } catch {
          await this.page.evaluate(`document.querySelector('${params.selector}')?.scrollIntoView()`);
          return `Scrolled to: ${params.selector}`;
        }

      default:
        console.warn(`⚠️  Unknown MCP tool: ${tool}`);
        return `Unknown tool: ${tool}`;
    }
  }

  // ── Smart click with fallback chain ───────────────────────────────────────
  private async smartClick(selector: string) {
    if (!this.page) throw new Error("Browser not launched");

    // Extract inner text from has-text(...) for use in fallback strategies
    const hasTextMatch = selector.match(/has-text\(['"](.+?)['"]\)/);
    const innerText = hasTextMatch?.[1] ?? selector;

    // Extract leading tag e.g. "button" from "button:has-text(...)"
    const tagMatch = selector.match(/^(\w+)/);
    const tag = tagMatch?.[1] ?? "";
    const role = tag === "a" ? "link" : "button";

    const strategies: Array<() => Promise<void>> = [
      // 1. Selector as-is
      () => this.page!.locator(selector).first().click({ timeout: 5000 }),

      // 2. Wait for visible, then click
      async () => {
        await this.page!.locator(selector).first().waitFor({ state: "visible", timeout: 5000 });
        await this.page!.locator(selector).first().click({ timeout: 5000 });
      },

      // 3. Scroll into view then click
      async () => {
        const el = this.page!.locator(selector).first();
        await el.scrollIntoViewIfNeeded();
        await el.click({ timeout: 5000 });
      },

      // 4. getByRole with extracted text
      () => this.page!.getByRole(role as any, { name: innerText }).click({ timeout: 5000 }),

      // 5. getByText exact
      () => this.page!.getByText(innerText, { exact: true }).first().click({ timeout: 5000 }),

      // 6. getByText partial
      () => this.page!.getByText(innerText, { exact: false }).first().click({ timeout: 5000 }),

      // 7. Force click (bypasses visibility/overlap checks)
      () => this.page!.locator(selector).first().click({ force: true, timeout: 5000 }),

      // 8. JS click as last resort
      async () => {
        await this.page!.locator(selector).first().evaluate((node: HTMLElement) => node.click());
      },
    ];

    for (const [i, strategy] of strategies.entries()) {
      try {
        await strategy();
        console.log(`✅ smartClick succeeded with strategy ${i + 1}`);
        return;
      } catch {
        continue;
      }
    }

    throw new Error(`Could not click "${selector}" — all strategies failed`);
  }

  // ── Take screenshot ───────────────────────────────────────────────────────
  async screenshot(path: string) {
    if (!this.page) return;
    await this.page.screenshot({ path, fullPage: true });
  }

  async saveVideo(): Promise<string | null> {
  try {
    if (!this.page) return null;

    const video = this.page.video();
    if (!video) {
      console.warn("⚠️ No video found for this page");
      return null;
    }

    const videoPath = await video.path();
    console.log("🎥 Video path:", videoPath);

    return videoPath;
  } catch (err: any) {
    console.error("❌ Failed to get video:", err.message);
    return null;
  }
}

  // ── Close browser ─────────────────────────────────────────────────────────
  async close() {
    await this.page?.close();
    await this.context?.close();
    await this.browser?.close();
    console.log("🎥 Video saved in videos/ folder");
    this.browser = null;
    this.context = null;
    this.page = null;
  }
}