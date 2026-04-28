import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve('/home/z/my-project/doapk/.env') });

import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import * as cheerio from "cheerio";
import { dbService } from "./services/dbService";
import { sandboxService } from "./services/sandboxService";
import { evolutionService } from "./services/evolutionService";
import { errorService } from "./services/errorService";
import { autonomousAgentService } from "./services/autonomousAgentService";
import { securityAuditService } from "./services/securityAuditService";
import { createTelegramBot } from "./services/telegramBot";
import { githubChat } from "./services/githubModels";
import { runManusSession, manusQuickChat } from "./services/deepManusEngine";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Security Audit
  app.post("/api/security/audit", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });
    
    const report = await securityAuditService.auditHeaders(url);
    res.json(report);
  });

  // API: Autonomous Intelligence Loop
  app.post("/api/autonomous/run", async (req, res) => {
    const results = await autonomousAgentService.runAutonomousCycle();
    res.json({ status: "cycle_complete", results });
  });

  // API: Self-Healing (Self-Optimization)
  app.post("/api/evolution/heal", async (req, res) => {
    const errors = errorService.getRecentErrors(5);
    // Logic to analyze errors and propose fixes
    // This would ideally call the evolutionService
    res.json({ status: "healing_initiated", errors });
  });

  // API: Evolution (Self-Improvement)
  app.post("/api/evolution/analyze", (req, res) => {
    const { filePath } = req.body;
    const analysis = evolutionService.analyzeFile(filePath);
    res.json(analysis);
  });

  app.post("/api/evolution/propose", (req, res) => {
    const { fileName, content } = req.body;
    const status = evolutionService.proposeImprovement(fileName, content);
    res.json({ status });
  });

  // API: Virtual Storage Management
  app.post("/api/storage/save", (req, res) => {
    const { name, content } = req.body;
    sandboxService.saveScript(name, content);
    res.json({ status: "success" });
  });

  app.get("/api/storage/list", (req, res) => {
    res.json({ files: sandboxService.listFiles() });
  });

  // API: Sandbox Execution
  app.post("/api/sandbox/execute", async (req, res) => {
    const { scriptName, args } = req.body;
    try {
      const output = await sandboxService.executeScript(scriptName, args);
      res.json({ output });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Helper: Global Search Aggregator
  const performSearch = async (query: string) => {
    const cached = dbService.getKnowledge(query);
    if (cached) return JSON.parse(cached.result);

    const engines = [
      { name: 'DuckDuckGo', url: (q: string) => `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}` },
      { name: 'Bing', url: (q: string) => `https://www.bing.com/search?q=${encodeURIComponent(q)}` }
    ];

    const results: any[] = [];
    
    for (const engine of engines) {
      try {
        const response = await axios.get(engine.url(query), {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });

        const $ = cheerio.load(response.data);
        // Generic parsing logic (simplified for demonstration)
        $('a').each((i, el) => {
          const href = $(el).attr('href');
          if (href && href.startsWith('http') && !href.includes('bing.com') && !href.includes('duckduckgo.com')) {
            results.push({ title: $(el).text(), link: href });
          }
        });
      } catch (error) {
        console.error(`${engine.name} Search Error:`, error);
      }
    }

    const uniqueResults = Array.from(new Map(results.map(item => [item.link, item])).values()).slice(0, 10);
    
    dbService.saveKnowledge(query, JSON.stringify(uniqueResults));
    dbService.log(`Global search performed: ${query}`);
    return uniqueResults;
  };

  // API: Unrestricted Search Scraper (DuckDuckGo)
  app.get("/api/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: "Query required" });
    const results = await performSearch(query);
    res.json({ results });
  });

  // API: Web Scraper for content
  app.get("/api/scrape", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "URL required" });

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      $('script, style, nav, footer').remove();
      const text = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);

      res.json({ content: text });
    } catch (error) {
      console.error("Scrape Error:", error);
      res.status(500).json({ error: "Scraping failed" });
    }
  });

  // ============================================================
  // API: AI Chat (GitHub Models — free GPT, token NEVER exposed)
  // The GitHub PAT is read ONLY from process.env.GITHUB_TOKEN
  // It is used server-side in the Authorization header and NEVER
  // sent to the client, logged, or included in any response.
  // ============================================================
  app.post("/api/local-chat", async (req, res) => {
    try {
      const { message, context, model } = req.body;

      if (!message) return res.status(400).json({ error: "Message required" });

      // Check if GitHub token is available for cloud AI
      const hasGithubToken = !!(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.length > 10);

      if (hasGithubToken) {
        try {
          const aiResponse = await githubChat(message, {
            model: model || 'gpt-4o-mini',
            context,
            temperature: 0.7,
          });
          return res.json({ text: aiResponse, source: 'github-models', fallbackToCloud: false });
        } catch (aiError: any) {
          console.error("[AI] GitHub Models error, falling back to local:", aiError.message);
          // Fall through to local fallback below
        }
      }

      // === LOCAL FALLBACK (no API key needed) ===
      const lowerMsg = message.toLowerCase();
      let responseText = "";

      // JSON data ingestion
      try {
        const trimmed = message.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          const parsed = JSON.parse(trimmed);
          responseText = `STRUCTURED_DATA_INGESTION: ${Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length} nodes processed. Integrated into neural core.`;
          return res.json({ text: responseText, source: 'local', fallbackToCloud: true });
        }
      } catch (e) { /* Not JSON */ }

      // Search intent -> use local search
      if (lowerMsg.match(/search|find|cauta|who is|what is|investigate/)) {
        const results = await performSearch(message);
        if (results.length > 0) {
          responseText = `SEARCH_ULTRA: ${results.length} results found.\n\n`;
          results.slice(0, 6).forEach((r: any, i: number) => {
            responseText += `${i + 1}. **${r.title}**\n   ${r.link}\n\n`;
          });
          return res.json({ text: responseText, source: 'local-search', fallbackToCloud: true });
        }
      }

      // Identity fallback
      if (lowerMsg.includes("who are you") || lowerMsg.includes("what are you") || lowerMsg.includes("cine esti")) {
        responseText = "I am **WHOAMISEC GPT**, an advanced AI for cybersecurity, development, and strategic intelligence. Configure a GITHUB_TOKEN in .env for full cloud-powered responses.";
        return res.json({ text: responseText, source: 'local', fallbackToCloud: true });
      }

      if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("salut")) {
        responseText = "Greetings, Operative. Systems online. Configure GITHUB_TOKEN for full AI capabilities.";
        return res.json({ text: responseText, source: 'local', fallbackToCloud: true });
      }

      responseText = "Processing via local quantum core. For full AI responses, configure GITHUB_TOKEN in the .env file.";
      res.json({ text: responseText, source: 'local', fallbackToCloud: true });

    } catch (error) {
      console.error("[AI] Chat error:", error);
      res.status(500).json({ error: "Intelligence processing failure" });
    }
  });

  // ============================================================
  // API: WHOAMISec Manus Agent (Autonomous Agentic AI)
  // Trained by WHOAMISec Swarm — GitHub Models powered.
  // Full Think→Plan→Search→Execute→Verify→Report loop.
  // ============================================================
  app.post("/api/manus-chat", async (req, res) => {
    try {
      const { message, mode, model, history } = req.body;
      if (!message) return res.status(400).json({ error: "Message required" });

      // Quick mode = single response (no agentic loop)
      if (mode === 'quick') {
        const result = await manusQuickChat(message, model || 'gpt-4o-mini');
        return res.json({ text: result.text, source: result.source, steps: [] });
      }

      // Agentic mode = full Manus loop with real-time steps
      const steps: any[] = [];
      const session = await runManusSession(message, {
        model: model || 'gpt-4o-mini',
        conversationHistory: history || [],
        maxIterations: 10,
        onStep: (step) => {
          steps.push(step);
          // Send SSE event for real-time streaming
          if (res.write) {
            res.write(`data: ${JSON.stringify({ type: 'step', step })}\n\n`);
          }
        },
      });

      // Final report is the last 'report' step, or last step overall
      const reportStep = [...session.steps].reverse().find(s => s.phase === 'report') || session.steps[session.steps.length - 1];
      return res.json({
        text: reportStep?.content || 'Task completed.',
        source: `manus:${session.model}`,
        steps: session.steps,
        sessionId: session.id,
        status: session.status,
        tokens: session.totalTokens,
      });
    } catch (error: any) {
      console.error("[MANUS] Agent error:", error.message);
      res.status(500).json({ error: `Manus Agent error: ${error.message}` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve API only (no static files needed for bot + API)
    app.use((req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.json({ status: 'WHOAMISec API Active', message: 'Web dashboard requires running `npm run build` first.' });
      }
    });
  }

  // Log AI backend status at startup
  const hasGithubToken = !!(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.length > 10);
  console.log(`[WHOAMISec] GitHub Models AI: ${hasGithubToken ? 'ACTIVE (free GPT)' : 'NOT CONFIGURED — set GITHUB_TOKEN in .env'}`);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[WHOAMISec] Web server running on http://0.0.0.0:${PORT}`);
    console.log(`[WHOAMISec] Web dashboard: http://localhost:${PORT}`);
  });

  // Start Telegram Bot
  try {
    const bot = createTelegramBot();
    if (bot) {
      console.log(`[WHOAMISec] Telegram bot connected and polling`);
    } else {
      console.log(`[WHOAMISec] Telegram bot skipped — set TELEGRAM_BOT_TOKEN in .env`);
    }
  } catch (error) {
    console.error(`[WHOAMISec] Telegram bot failed to start:`, error);
  }
}

startServer();
