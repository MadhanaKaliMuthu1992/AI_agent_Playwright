<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ai-qa-agent README</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #ffffff;
    --card: #f8f8fb;
    --border: #e8e8f0;
    --c1: #e8193c;
    --c2: #e07b2a;
    --c3: #00a67e;
    --c4: #0099cc;
    --c5: #8b33e8;
    --c6: #c9a600;
    --text: #111118;
    --muted: #6b6b88;
    --mono: 'Space Mono', monospace;
    --sans: 'Syne', sans-serif;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    min-height: 100vh;
    overflow-x: hidden;
  }



  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 60px 32px;
    position: relative;
    z-index: 1;
  }

  /* ── HERO ── */
  .hero {
    text-align: center;
    margin-bottom: 64px;
    animation: fadeUp 0.6s ease both;
  }

  .hero-badge {
    display: inline-block;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--c3);
    border: 1px solid var(--c3);
    padding: 4px 14px;
    border-radius: 2px;
    margin-bottom: 24px;
  }

  .hero h1 {
    font-size: clamp(48px, 8vw, 88px);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -2px;
    margin-bottom: 20px;
    background: linear-gradient(135deg, var(--c1) 0%, var(--c2) 30%, var(--c6) 55%, var(--c3) 75%, var(--c4) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: hueShift 8s linear infinite;
  }

  @keyframes hueShift {
    0%   { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
  }

  .hero p {
    font-size: 18px;
    color: var(--muted);
    max-width: 560px;
    margin: 0 auto 32px;
    line-height: 1.6;
  }

  .badges {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .badge {
    font-family: var(--mono);
    font-size: 11px;
    padding: 5px 12px;
    border-radius: 99px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .badge-red    { background: rgba(255,77,109,0.15); color: var(--c1); border: 1px solid rgba(255,77,109,0.35); }
  .badge-orange { background: rgba(244,162,97,0.15); color: var(--c2); border: 1px solid rgba(244,162,97,0.35); }
  .badge-green  { background: rgba(6,214,160,0.15);  color: var(--c3); border: 1px solid rgba(6,214,160,0.35); }
  .badge-blue   { background: rgba(76,201,240,0.15); color: var(--c4); border: 1px solid rgba(76,201,240,0.35); }
  .badge-purple { background: rgba(168,85,247,0.15); color: var(--c5); border: 1px solid rgba(168,85,247,0.35); }
  .badge-yellow { background: rgba(250,255,0,0.1);   color: var(--c6); border: 1px solid rgba(250,255,0,0.3); }

  /* ── DIVIDER ── */
  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--c4), var(--c5), var(--c1), transparent);
    margin: 48px 0;
    opacity: 0.4;
  }

  /* ── SECTION ── */
  .section {
    margin-bottom: 56px;
    animation: fadeUp 0.6s ease both;
  }

  .section-label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 12px;
  }

  .section-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .section-title .icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }

  .icon-red    { background: rgba(255,77,109,0.2);  }
  .icon-orange { background: rgba(244,162,97,0.2);  }
  .icon-green  { background: rgba(6,214,160,0.2);   }
  .icon-blue   { background: rgba(76,201,240,0.2);  }
  .icon-purple { background: rgba(168,85,247,0.2);  }
  .icon-yellow { background: rgba(250,255,0,0.15);  }

  /* ── OVERVIEW CARD ── */
  .overview-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-left: 3px solid var(--c4);
    border-radius: 8px;
    padding: 24px 28px;
    font-size: 16px;
    line-height: 1.8;
    color: #3a3a5a;
  }

  /* ── STRUCTURE TREE ── */
  .tree {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }

  .tree-header {
    background: #f0f0f6;
    padding: 10px 20px;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot-r { background: #ff5f57; }
  .dot-y { background: #ffbd2e; }
  .dot-g { background: #28ca41; }

  .tree-body {
    padding: 20px 24px;
    font-family: var(--mono);
    font-size: 13px;
    line-height: 2;
  }

  .tree-line { display: flex; align-items: baseline; gap: 10px; }
  .tree-indent-1 { padding-left: 20px; }
  .tree-indent-2 { padding-left: 40px; }
  .tree-indent-3 { padding-left: 60px; }

  .t-folder { color: var(--c4); }
  .t-ts     { color: var(--c5); }
  .t-json   { color: var(--c2); }
  .t-config { color: var(--c3); }
  .t-html   { color: var(--c1); }
  .t-env    { color: var(--c6); }
  .t-comment { color: var(--muted); font-size: 11px; margin-left: 8px; }

  /* ── CARDS GRID ── */
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }

  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 22px;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }

  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
  }

  .card:hover { transform: translateY(-3px); }

  .card-r::before { background: var(--c1); }
  .card-o::before { background: var(--c2); }
  .card-g::before { background: var(--c3); }
  .card-b::before { background: var(--c4); }
  .card-p::before { background: var(--c5); }
  .card-y::before { background: var(--c6); }

  .card:hover.card-r { border-color: rgba(255,77,109,0.4); }
  .card:hover.card-o { border-color: rgba(244,162,97,0.4); }
  .card:hover.card-g { border-color: rgba(6,214,160,0.4); }
  .card:hover.card-b { border-color: rgba(76,201,240,0.4); }
  .card:hover.card-p { border-color: rgba(168,85,247,0.4); }
  .card:hover.card-y { border-color: rgba(250,255,0,0.3); }

  .card-icon { font-size: 28px; margin-bottom: 12px; }
  .card-title { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
  .card-desc  { font-size: 13px; color: var(--muted); line-height: 1.6; }
  .card-file  { font-family: var(--mono); font-size: 11px; margin-top: 10px; opacity: 0.6; }

  /* ── CODE BLOCK ── */
  pre {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow-x: auto;
    position: relative;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }

  .pre-header {
    background: #f0f0f6;
    padding: 8px 16px;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
    border-radius: 10px 10px 0 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  code {
    display: block;
    padding: 20px 24px;
    font-family: var(--mono);
    font-size: 13px;
    line-height: 1.8;
    color: #1a1a3a;
  }

  .k { color: var(--c5); }  /* keyword */
  .s { color: var(--c3); }  /* string */
  .c { color: var(--muted); }  /* comment */
  .v { color: var(--c2); }  /* variable */

  /* ── STEPS ── */
  .steps { display: flex; flex-direction: column; gap: 0; }

  .step {
    display: flex;
    gap: 20px;
    position: relative;
  }

  .step:not(:last-child) .step-line {
    position: absolute;
    left: 19px;
    top: 40px;
    bottom: -16px;
    width: 2px;
    background: linear-gradient(180deg, var(--c3), transparent);
    opacity: 0.3;
  }

  .step-num {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 700;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .step:nth-child(1) .step-num { background: rgba(255,77,109,0.2); color: var(--c1); border: 1px solid rgba(255,77,109,0.3); }
  .step:nth-child(2) .step-num { background: rgba(244,162,97,0.2); color: var(--c2); border: 1px solid rgba(244,162,97,0.3); }
  .step:nth-child(3) .step-num { background: rgba(6,214,160,0.2);  color: var(--c3); border: 1px solid rgba(6,214,160,0.3); }
  .step:nth-child(4) .step-num { background: rgba(76,201,240,0.2); color: var(--c4); border: 1px solid rgba(76,201,240,0.3); }
  .step:nth-child(5) .step-num { background: rgba(168,85,247,0.2); color: var(--c5); border: 1px solid rgba(168,85,247,0.3); }

  .step-content { padding-bottom: 32px; flex: 1; }
  .step-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
  .step-desc  { font-size: 14px; color: var(--muted); line-height: 1.6; }

  /* ── TECH TABLE ── */
  .tech-table {
    width: 100%;
    border-collapse: collapse;
  }

  .tech-table th {
    text-align: left;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
  }

  .tech-table td {
    padding: 14px 16px;
    font-size: 14px;
    border-bottom: 1px solid var(--border);
  }

  .tech-table tr:last-child td { border-bottom: none; }
  .tech-table tr:hover td { background: rgba(0,0,0,0.02); }

  .tech-table td:first-child { color: var(--muted); font-family: var(--mono); font-size: 12px; }

  .chip {
    display: inline-block;
    font-family: var(--mono);
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 4px;
    font-weight: 700;
  }

  /* ── PREREQS LIST ── */
  .req-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .req-list li {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 15px;
    color: #3a3a5a;
  }
  .req-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  /* ── FOOTER ── */
  footer {
    text-align: center;
    padding: 40px 0 24px;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--muted);
    border-top: 1px solid var(--border);
    margin-top: 80px;
  }

  footer span {
    background: linear-gradient(90deg, var(--c1), var(--c4));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
  }

  /* ── ANIMATION ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .section:nth-child(1) { animation-delay: 0.0s; }
  .section:nth-child(2) { animation-delay: 0.1s; }
  .section:nth-child(3) { animation-delay: 0.2s; }
  .section:nth-child(4) { animation-delay: 0.3s; }
  .section:nth-child(5) { animation-delay: 0.4s; }
  .section:nth-child(6) { animation-delay: 0.5s; }
  .section:nth-child(7) { animation-delay: 0.6s; }
</style>
</head>
<body>
<div class="container">

  <!-- HERO -->
  <div class="hero">
    <div class="hero-badge">⚡ AI-Powered QA Automation</div>
    <h1>ai-qa-agent</h1>
    <p>Intelligently generate, execute, and report on browser tests — powered by Gemini AI and Playwright.</p>
    <div class="badges">
      <span class="badge badge-purple">TypeScript</span>
      <span class="badge badge-blue">Playwright</span>
      <span class="badge badge-green">Gemini AI</span>
      <span class="badge badge-red">Allure Reports</span>
      <span class="badge badge-yellow">MCP</span>
      <span class="badge badge-orange">Node.js 18+</span>
    </div>
  </div>

  <div class="divider"></div>

  <!-- OVERVIEW -->
  <div class="section">
    <div class="section-label">// 01 · overview</div>
    <div class="section-title">
      <div class="icon icon-blue">🤖</div>
      What is this?
    </div>
    <div class="overview-card">
      <code style="background:none;padding:0;color:inherit;font-family:inherit;font-size:inherit;line-height:inherit;">
        <strong>ai-qa-agent</strong> is a TypeScript-based testing framework that combines large language models with Playwright's browser automation. The AI agent autonomously analyzes your target application, generates test scripts, executes them across browsers, and produces rich Allure HTML reports — dramatically reducing manual QA effort.
      </code>
    </div>
  </div>

  <!-- PROJECT STRUCTURE -->
  <div class="section">
    <div class="section-label">// 02 · project structure</div>
    <div class="section-title">
      <div class="icon icon-yellow">📁</div>
      File Layout
    </div>
    <div class="tree">
      <div class="tree-header">
        <div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>
        &nbsp; ai-qa-agent/
      </div>
      <div class="tree-body">
        <div class="tree-line"><span class="t-folder">├── public/</span></div>
        <div class="tree-line tree-indent-1"><span class="t-html">└── index.html</span><span class="t-comment">// Static entry point / UI</span></div>
        <div class="tree-line"><span class="t-folder">├── src/</span></div>
        <div class="tree-line tree-indent-1"><span class="t-folder">├── agent/</span></div>
        <div class="tree-line tree-indent-2"><span class="t-ts">└── aiAgent.ts</span><span class="t-comment">// Core orchestration logic</span></div>
        <div class="tree-line tree-indent-1"><span class="t-folder">├── ai/</span></div>
        <div class="tree-line tree-indent-2"><span class="t-ts">└── geminiClient.ts</span><span class="t-comment">// Gemini API wrapper</span></div>
        <div class="tree-line tree-indent-1"><span class="t-folder">├── generator/</span></div>
        <div class="tree-line tree-indent-2"><span class="t-ts">└── scriptBuilder.ts</span><span class="t-comment">// AI test script generator</span></div>
        <div class="tree-line tree-indent-1"><span class="t-folder">├── mcp/</span><span class="t-comment">// Model Context Protocol</span></div>
        <div class="tree-line tree-indent-1"><span class="t-folder">├── utils/</span></div>
        <div class="tree-line tree-indent-2"><span class="t-ts">└── allureReporter.ts</span><span class="t-comment">// Report utilities</span></div>
        <div class="tree-line tree-indent-1"><span class="t-ts">└── index.ts</span><span class="t-comment">// App entry point</span></div>
        <div class="tree-line"><span class="t-folder">├── tests/</span><span class="t-comment">// Generated Playwright tests</span></div>
        <div class="tree-line"><span class="t-folder">├── videos/</span><span class="t-comment">// Recorded test runs</span></div>
        <div class="tree-line"><span class="t-folder">├── allure-results/</span><span class="t-comment">// Raw report data</span></div>
        <div class="tree-line"><span class="t-folder">├── allure-report/</span><span class="t-comment">// Generated HTML report</span></div>
        <div class="tree-line"><span class="t-env">├── .env</span><span class="t-comment">// Environment variables</span></div>
        <div class="tree-line"><span class="t-json">├── ai-audit-log.json</span><span class="t-comment">// AI interaction log</span></div>
        <div class="tree-line"><span class="t-config">├── playwright.config.ts</span></div>
        <div class="tree-line"><span class="t-json">└── package.json</span></div>
      </div>
    </div>
  </div>

  <!-- PREREQUISITES -->
  <div class="section">
    <div class="section-label">// 03 · prerequisites</div>
    <div class="section-title">
      <div class="icon icon-orange">🔧</div>
      Requirements
    </div>
    <ul class="req-list">
      <li><div class="req-icon" style="background:rgba(6,214,160,0.15)">🟢</div> <strong>Node.js</strong> &nbsp;v18 or higher</li>
      <li><div class="req-icon" style="background:rgba(76,201,240,0.15)">📦</div> <strong>npm</strong> &nbsp;v9 or higher</li>
      <li><div class="req-icon" style="background:rgba(255,77,109,0.15)">🔑</div> <strong>Gemini API Key</strong> &nbsp;from Google AI Studio</li>
      <li><div class="req-icon" style="background:rgba(244,162,97,0.15)">📊</div> <strong>Allure CLI</strong> &nbsp;<code style="background:#eeeef8;padding:2px 8px;border-radius:4px;font-size:12px;color:#1a1a3a;">npm install -g allure-commandline</code></li>
    </ul>
  </div>

  <!-- INSTALLATION -->
  <div class="section">
    <div class="section-label">// 04 · installation</div>
    <div class="section-title">
      <div class="icon icon-green">⚙️</div>
      Get Started
    </div>
    <pre>
      <div class="pre-header"><div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>&nbsp; bash</div>
      <code><span class="c"># Clone the repository</span>
<span class="k">git</span> clone https://github.com/your-org/ai-qa-agent.git
<span class="k">cd</span> ai-qa-agent

<span class="c"># Install dependencies</span>
<span class="k">npm</span> install

<span class="c"># Install Playwright browsers</span>
<span class="k">npx</span> playwright install</code>
    </pre>

    <br>
    <p style="font-size:14px;color:var(--muted);margin-bottom:12px;">Create a <code style="background:#eeeef8;padding:2px 8px;border-radius:4px;font-size:12px;color:var(--c6);">.env</code> file in the project root:</p>
    <pre>
      <div class="pre-header"><div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>&nbsp; .env</div>
      <code><span class="v">GEMINI_API_KEY</span>=your_gemini_api_key_here
<span class="v">BASE_URL</span>=https://your-target-app.com</code>
    </pre>
  </div>

  <!-- USAGE -->
  <div class="section">
    <div class="section-label">// 05 · usage</div>
    <div class="section-title">
      <div class="icon icon-purple">🚀</div>
      Running the Agent
    </div>
    <pre>
      <div class="pre-header"><div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>&nbsp; bash</div>
      <code><span class="c"># Run the full AI agent pipeline</span>
<span class="k">npm</span> start

<span class="c"># Run Playwright tests directly</span>
<span class="k">npx</span> playwright test

<span class="c"># View Allure report in browser</span>
<span class="k">allure</span> serve allure-results</code>
    </pre>
  </div>

  <!-- HOW IT WORKS -->
  <div class="section">
    <div class="section-label">// 06 · architecture</div>
    <div class="section-title">
      <div class="icon icon-red">⚡</div>
      How It Works
    </div>
    <div class="steps">
      <div class="step">
        <div class="step-line"></div>
        <div class="step-num">01</div>
        <div class="step-content">
          <div class="step-title">aiAgent.ts — Orchestration</div>
          <div class="step-desc">Receives a testing objective, coordinates the full pipeline: delegates to the script builder, triggers test execution, and kicks off reporting.</div>
        </div>
      </div>
      <div class="step">
        <div class="step-line"></div>
        <div class="step-num">02</div>
        <div class="step-content">
          <div class="step-title">geminiClient.ts — AI Interface</div>
          <div class="step-desc">Manages all Gemini API communication including prompt construction, response parsing, and retry logic.</div>
        </div>
      </div>
      <div class="step">
        <div class="step-line"></div>
        <div class="step-num">03</div>
        <div class="step-content">
          <div class="step-title">scriptBuilder.ts — Test Generation</div>
          <div class="step-desc">Translates high-level goals into executable Playwright test scripts using Gemini's code generation capabilities.</div>
        </div>
      </div>
      <div class="step">
        <div class="step-line"></div>
        <div class="step-num">04</div>
        <div class="step-content">
          <div class="step-title">allureReporter.ts — Reporting</div>
          <div class="step-desc">Collects test outcomes and formats them into Allure-compatible JSON, enabling rich HTML report generation.</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num">05</div>
        <div class="step-content">
          <div class="step-title">ai-audit-log.json — Traceability</div>
          <div class="step-desc">Records every AI prompt and response for full traceability, debugging, and compliance.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- COMPONENTS -->
  <div class="section">
    <div class="section-label">// 07 · components</div>
    <div class="section-title">
      <div class="icon icon-blue">🧩</div>
      Key Modules
    </div>
    <div class="cards">
      <div class="card card-r">
        <div class="card-icon">🤖</div>
        <div class="card-title">AI Agent</div>
        <div class="card-desc">Central orchestrator that drives the full test lifecycle from goal to report.</div>
        <div class="card-file">src/agent/aiAgent.ts</div>
      </div>
      <div class="card card-g">
        <div class="card-icon">✨</div>
        <div class="card-title">Gemini Client</div>
        <div class="card-desc">Wraps the Gemini API with prompt engineering for reliable code generation.</div>
        <div class="card-file">src/ai/geminiClient.ts</div>
      </div>
      <div class="card card-p">
        <div class="card-icon">🏗️</div>
        <div class="card-title">Script Builder</div>
        <div class="card-desc">Converts natural language objectives into Playwright test code.</div>
        <div class="card-file">src/generator/scriptBuilder.ts</div>
      </div>
      <div class="card card-o">
        <div class="card-icon">📊</div>
        <div class="card-title">Allure Reporter</div>
        <div class="card-desc">Formats results into beautiful, shareable HTML test reports.</div>
        <div class="card-file">src/utils/allureReporter.ts</div>
      </div>
      <div class="card card-b">
        <div class="card-icon">🔗</div>
        <div class="card-title">MCP Integration</div>
        <div class="card-desc">Model Context Protocol support for extended AI capabilities.</div>
        <div class="card-file">src/mcp/</div>
      </div>
      <div class="card card-y">
        <div class="card-icon">🎬</div>
        <div class="card-title">Test Recordings</div>
        <div class="card-desc">Video recordings of every test run for visual debugging.</div>
        <div class="card-file">videos/</div>
      </div>
    </div>
  </div>

  <!-- TECH STACK -->
  <div class="section">
    <div class="section-label">// 08 · tech stack</div>
    <div class="section-title">
      <div class="icon icon-green">🛠️</div>
      Technology
    </div>
    <div class="tree" style="border-radius:10px;overflow:hidden;">
      <table class="tech-table">
        <thead>
          <tr>
            <th>Layer</th>
            <th>Technology</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Language</td>
            <td><span class="chip badge-purple">TypeScript</span></td>
            <td style="color:var(--muted);font-size:13px;">Type-safe agent and test code</td>
          </tr>
          <tr>
            <td>AI Model</td>
            <td><span class="chip badge-blue">Google Gemini</span></td>
            <td style="color:var(--muted);font-size:13px;">Test generation & analysis</td>
          </tr>
          <tr>
            <td>Automation</td>
            <td><span class="chip badge-green">Playwright</span></td>
            <td style="color:var(--muted);font-size:13px;">Cross-browser test execution</td>
          </tr>
          <tr>
            <td>Reporting</td>
            <td><span class="chip badge-red">Allure</span></td>
            <td style="color:var(--muted);font-size:13px;">Rich HTML test reports</td>
          </tr>
          <tr>
            <td>Protocol</td>
            <td><span class="chip badge-yellow">MCP</span></td>
            <td style="color:var(--muted);font-size:13px;">Model Context Protocol</td>
          </tr>
          <tr>
            <td>Runtime</td>
            <td><span class="chip badge-orange">Node.js 18+</span></td>
            <td style="color:var(--muted);font-size:13px;">JavaScript runtime</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- CONTRIBUTING -->
  <div class="section">
    <div class="section-label">// 09 · contributing</div>
    <div class="section-title">
      <div class="icon icon-red">🤝</div>
      Contributing
    </div>
    <pre>
      <div class="pre-header"><div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>&nbsp; bash</div>
      <code><span class="c"># 1. Fork the repo and create a feature branch</span>
<span class="k">git</span> checkout -b feature/my-feature

<span class="c"># 2. Commit your changes</span>
<span class="k">git</span> commit -m <span class="s">'feat: add my feature'</span>

<span class="c"># 3. Push and open a Pull Request</span>
<span class="k">git</span> push origin feature/my-feature</code>
    </pre>
  </div>

  <footer>
    <p>Licensed under <span>MIT</span> &nbsp;·&nbsp; Built with <span>ai-qa-agent</span> &nbsp;·&nbsp; Powered by <span>Gemini + Playwright</span></p>
  </footer>

</div>
</body>
</html>