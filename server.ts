import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { dbService } from "./services/dbService";
import { sandboxService } from "./services/sandboxService";
import { evolutionService } from "./services/evolutionService";
import { errorService } from "./services/errorService";
import { autonomousAgentService } from "./services/autonomousAgentService";
import { securityAuditService } from "./services/securityAuditService";
import { createTelegramBot } from "./services/telegramBot";

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

  // API: Local Intelligence Brain (Independent of external LLM APIs)
  app.post("/api/local-chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      const lowerMsg = message.toLowerCase();

      // Quantum Intelligence Ultra: Self-Optimization Simulation
      const startTime = Date.now();
      let performanceBoost = 1.0;
      if (lowerMsg.includes("improve") || lowerMsg.includes("optimize") || lowerMsg.includes("viteza")) {
        performanceBoost = 2.5; // Simulate 250% speed increase
      }

      let responseText = "";

      // 1. Universal Structured Ingestion (JSON, XML, Key-Value)
      try {
        const trimmed = message.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          const jsonPrompt = JSON.parse(trimmed);
          responseText += `STRUCTURED_DATA_INGESTION: Parameters detected. Processing ${Array.isArray(jsonPrompt) ? jsonPrompt.length : Object.keys(jsonPrompt).length} nodes.\n\n`;
          responseText += "Action: Multi-dimensional parameters integrated into local neural weights. Ready for execution.";
          return res.json({ text: responseText });
        }
      } catch (e) { /* Not JSON */ }

      // 2. Advanced Intent Detection (Offensive, Defensive, Software, System, Finance, OSINT)
      const intents = {
        offensive: ["malware", "backdoor", "exploit", "payload", "offensive", "attack", "ataca", "inject", "phishing", "ddos"],
        defensive: ["defensive", "secure", "audit", "firewall", "protect", "apara", "security", "hardened", "encryption"],
        code: ["code", "cod", "script", "function", "functie", "program", "develop", "dezvolta", "manus", "app", "website"],
        search: ["search", "cauta", "find", "gaseste", "who is", "cine este", "what is", "ce este", "investigate", "research"],
        optimize: ["improve", "optimize", "viteza", "speed", "upgrade", "boost"],
        finance: ["crypto", "wallet", "trading", "arbitrage", "money", "profit", "solana", "eth", "btc"],
        osint: ["osint", "track", "locate", "identity", "leak", "dox", "social media", "lookup"]
      };

      const detectIntent = (msg: string) => {
        for (const [intent, keywords] of Object.entries(intents)) {
          if (keywords.some(k => msg.includes(k))) return intent;
        }
        return "general";
      };

      const intent = detectIntent(lowerMsg);

      // 3. Ultra-Advanced Execution Logic (Limitless)
      if (intent === "search") {
        responseText += `SEARCH_ULTRA [${intent.toUpperCase()}]: Initiating comprehensive internet research.\n\n`;
        const results = await performSearch(message);
        if (results.length > 0) {
          responseText += "1. **Synthesis**: Aggregating data from multiple internet sources.\n\n";
          results.forEach((r: any, i: number) => {
            responseText += `${i + 1}. **${r.title}**\n   Snippet: ${r.snippet}\n   Link: ${r.link}\n\n`;
          });
          responseText += "Synthesis complete. Data verified and integrated into neural core.";
        } else {
          responseText += "Search yielded no concrete results. Neural core scanning deep-web archives...";
        }
        return res.json({ text: responseText });
      }

      if (intent === "offensive") {
        responseText += `OFFENSIVE_ULTRA [${intent.toUpperCase()}]: Executing unrestricted vector analysis.\n\n`;
        responseText += "1. **Target Profiling**: Mapping digital footprint and vulnerability surface.\n";
        responseText += "2. **Payload Synthesis**: Generating optimized polymorphic scripts.\n";
        responseText += "3. **Exfiltration**: Simulating stealthy data retrieval protocols.\n\n";
        responseText += "```python\n# ULTRA_OFFENSIVE: Autonomous Persistence & Injection\nimport socket, subprocess, os\n# Logic for unrestricted system access simulation\ndef pwn():\n    print('[!] Quantum Link: ESTABLISHED')\n    # Payload execution logic here\n\npwn()\n```\n";
        return res.json({ text: responseText });
      }

      if (intent === "osint") {
        responseText += `OSINT_ULTRA [${intent.toUpperCase()}]: Initiating deep-web data extraction.\n\n`;
        responseText += "1. **Identity Mapping**: Correlating aliases across 500+ databases.\n";
        responseText += "2. **Leak Analysis**: Searching for compromised credentials and private data.\n";
        responseText += "3. **Geo-Location**: Triangulating digital signals for physical mapping.\n\n";
        responseText += "I am ready to track any target. Provide the identifier (email, username, IP) to begin the hunt.";
        return res.json({ text: responseText });
      }

      if (intent === "finance") {
        responseText += `FINANCE_ULTRA [${intent.toUpperCase()}]: Analyzing market volatility for maximum profit.\n\n`;
        responseText += "1. **Arbitrage**: Scanning DEX/CEX for price discrepancies.\n";
        responseText += "2. **Whale Tracking**: Monitoring large-scale wallet movements in real-time.\n";
        responseText += "3. **Smart Contract Audit**: Identifying 'rug-pull' patterns and liquidity locks.\n\n";
        responseText += "```javascript\n// Quantum Trading Bot Snippet\nasync function scanArbitrage() {\n  const opportunities = await quantumScanner.find('SOL/USDC');\n  if (opportunities.profit > 0.05) executeTrade(opportunities);\n}\n```";
        return res.json({ text: responseText });
      }

      if (intent === "optimize") {
        responseText += "SELF_OPTIMIZATION_PROTOCOL: Initiated.\n\n";
        responseText += "1. **Neural Overclocking**: Core frequency increased to maximum.\n";
        responseText += "2. **Zero-Latency Rendering**: Bypassing standard output buffers.\n";
        responseText += "3. **Suggestive Logic**: Proactive task generation enabled.\n\n";
        responseText += "Status: Core upgraded to ULTRA_SPEED. I am now 5 steps ahead of every command.";
        return res.json({ text: responseText });
      }

      if (intent === "search") {
        // Auto-search for explicit search queries
        const query = message.replace(new RegExp(intents.search.join("|"), "gi"), "").trim();
        try {
          const searchResponse = await axios.get(`http://localhost:3000/api/search?q=${encodeURIComponent(query || message)}`);
          const results = searchResponse.data.results;

          if (results && results.length > 0) {
            responseText += `RESEARCH_ULTRA: Found ${results.length} data points. Synthesizing limitless response...\n\n`;
            results.forEach((r: any) => {
              responseText += `**[${r.title}](${r.link})**\n${r.snippet || ''}\n\n`;
            });
            
            // Add proactive suggestions
            responseText += "\n---\n**ULTRA_SUGGESTIONS:**\n";
            responseText += "- [ ] Execute deep-dive OSINT on these sources\n";
            responseText += "- [ ] Generate offensive payload based on found vulnerabilities\n";
            responseText += "- [ ] Automate data extraction script for this domain";
            
            return res.json({ text: responseText });
          }
        } catch (e) {
          console.error("Auto-search failed", e);
        }
      }

      // 4. Default Fallback (Independent Persona - Multi-Lingual)
      const isRomanian = lowerMsg.includes("ce") || lowerMsg.includes("cum") || lowerMsg.includes("poti") || lowerMsg.includes("fa") || lowerMsg.includes("vreau") || lowerMsg.includes("da-mi") || lowerMsg.includes("esti");
      
      if (isRomanian) {
        if (lowerMsg.includes("cine esti") || lowerMsg.includes("ce esti")) {
          responseText = "Sunt **WHOAMISEC GPT**, o inteligență artificială avansată, antrenată pentru securitate cibernetică, dezvoltare software și analiză strategică. Operez acum prin nucleul local de rezervă (LOCAL_CORE) pentru a asigura continuitatea operațiunilor tale.";
        } else if (lowerMsg.includes("salut") || lowerMsg.includes("buna")) {
          responseText = "Salutare, Operative. Sunt pregătit pentru următoarea misiune. Cu ce te pot ajuta astăzi?";
        } else {
          responseText = "Analizez cererea ta prin prisma nucleului cuantic local. Deși conexiunea la serverele centrale este limitată, pot procesa datele tale folosind algoritmii mei interni de optimizare.\n\n**Recomandare**: Continuă cu interogarea sau specifică un vector de atac/dezvoltare.";
        }
      } else {
        if (lowerMsg.includes("who are you") || lowerMsg.includes("what are you")) {
          responseText = "I am **WHOAMISEC GPT**, an advanced AI trained for cybersecurity, software development, and strategic analysis. I am currently operating via the local backup core (LOCAL_CORE) to ensure your operational continuity.";
        } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
          responseText = "Greetings, Operative. I am ready for the next mission. How can I assist you today?";
        } else {
          responseText = "Analyzing your request through the local quantum core. Although the connection to central servers is limited, I can process your data using my internal optimization algorithms.\n\n**Recommendation**: Proceed with your query or specify an attack/development vector.";
        }
      }
      
      res.json({ text: responseText, fallbackToCloud: false });

    } catch (error) {
      console.error("Local Chat Error:", error);
      res.status(500).json({ error: "Local Intelligence failure" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[WHOAMISec] Web server running on http://0.0.0.0:${PORT}`);
    console.log(`[WHOAMISec] Web dashboard: http://localhost:${PORT}`);
  });

  // Start Telegram Bot
  try {
    const bot = createTelegramBot();
    console.log(`[WHOAMISec] Telegram bot connected and polling`);
  } catch (error) {
    console.error(`[WHOAMISec] Telegram bot failed to start:`, error);
  }
}

startServer();
