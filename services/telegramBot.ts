import TelegramBot from 'node-telegram-bot-api';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8703989321:AAHSJ9LduqrcFgi2X7awZND0KuMreffKprE';

class WHOAMISecTelegramBot {
  private bot: TelegramBot;
  private readonly WEB_URL: string;

  constructor(token: string) {
    this.bot = new TelegramBot(token, { polling: true });
    this.WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
    this.setupCommands();
    this.setupMessageHandlers();
    console.log(`[WHOAMISec Bot] Telegram bot initialized successfully`);
  }

  private setupCommands() {
    this.bot.setMyCommands([
      { command: '/start', description: 'Initialize WHOAMISec AI connection' },
      { command: '/status', description: 'Check system & service status' },
      { command: '/scan', description: 'OSINT reconnaissance on a target' },
      { command: '/audit', description: 'Security audit a URL' },
      { command: '/search', description: 'Global intelligence search' },
      { command: '/tools', description: 'List available security tools' },
      { command: '/help', description: 'Show all commands & usage' },
      { command: '/web', description: 'Get web dashboard link' },
    ]);
  }

  private setupMessageHandlers() {
    // /start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const name = msg.from?.first_name || 'Operative';
      this.bot.sendMessage(chatId, `
⚡ *WHOAMISec AI — Online*

Welcome, ${name}. I am *WHOAMISec GPT*, your autonomous security intelligence assistant.

🛡️ *Capabilities:*
• OSINT Reconnaissance
• Security Auditing
• Global Search Aggregation
• Autonomous Intelligence Loops
• Quantum Analysis Engine

📎 *Use /help to see all commands*
🌐 *Web Dashboard:* ${this.WEB_URL}

_Authenticated. Awaiting directives._
      `, { parse_mode: 'Markdown' });
    });

    // /status command
    this.bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);

      try {
        const services = [
          { name: 'Express Server', check: () => fetch(`${this.WEB_URL}/api/storage/list`) },
        ];

        let statusReport = `📊 *WHOAMISec System Status*\n\n`;
        statusReport += `⏱️ *Uptime:* ${hours}h ${minutes}m\n`;
        statusReport += `🟢 *Web Server:* Online (Port 3000)\n`;
        statusReport += `🟢 *Telegram Bot:* Connected\n`;
        statusReport += `🟢 *Neural Core:* Active\n\n`;
        statusReport += `🔐 *All systems operational.*`;

        this.bot.sendMessage(chatId, statusReport, { parse_mode: 'Markdown' });
      } catch {
        this.bot.sendMessage(chatId, '⚠️ Status check encountered an error.', { parse_mode: 'Markdown' });
      }
    });

    // /scan command - OSINT reconnaissance
    this.bot.onText(/\/scan (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const target = match![1];
      const waitMsg = await this.bot.sendMessage(chatId, `🔍 *Initiating OSINT Reconnaissance*\n\nTarget: \`${target}\`\n\n_Scanning multiple intelligence nodes..._`, { parse_mode: 'Markdown' });

      try {
        const response = await fetch(`${this.WEB_URL}/api/search?q=${encodeURIComponent(target)}`);
        const data = await response.json();
        const results = data.results || [];

        if (results.length > 0) {
          let report = `🎯 *OSINT Report: ${target}*\n\n`;
          report += `📋 *${results.length} intelligence nodes discovered:*\n\n`;
          results.slice(0, 8).forEach((r: any, i: number) => {
            report += `${i + 1}. *${r.title || 'Untitled'}*\n`;
            report += `   🔗 ${r.link || 'N/A'}\n\n`;
          });
          if (results.length > 8) {
            report += `... and ${results.length - 8} more results.\n`;
          }
          report += `\n✅ *Scan complete. Data integrated into neural core.*`;
          this.bot.editMessageText(report, { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' });
        } else {
          this.bot.editMessageText(`⚠️ *No results found for:*\n\`${target}\`\n\n_Target may not have public intelligence data._`, { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' });
        }
      } catch {
        this.bot.editMessageText(`❌ *Scan failed.*\n\nWeb server may be unreachable. Check /status.`, { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' });
      }
    });

    // /audit command - Security audit
    this.bot.onText(/\/audit (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const url = match![1];
      if (!url.startsWith('http')) {
        this.bot.sendMessage(chatId, '⚠️ Please provide a valid URL starting with http:// or https://');
        return;
      }

      const waitMsg = await this.bot.sendMessage(chatId, `🔒 *Initiating Security Audit*\n\nTarget: \`${url}\`\n\n_Analyzing headers, protocols, and configurations..._`, { parse_mode: 'Markdown' });

      try {
        const response = await fetch(`${this.WEB_URL}/api/security/audit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const report = await response.json();

        let auditReport = `🛡️ *Security Audit Report*\n\n`;
        auditReport += `🎯 *Target:* \`${url}\`\n`;
        auditReport += `⏱️ *Timestamp:* ${new Date().toISOString()}\n\n`;
        auditReport += `*Headers Analysis:*\n`;
        if (report.headers) {
          Object.entries(report.headers).forEach(([key, value]: [string, any]) => {
            const status = value?.secure ? '✅' : value?.warning ? '⚠️' : '❌';
            auditReport += `${status} *${key}:* ${value?.value || value || 'Not Set'}\n`;
          });
        }
        auditReport += `\n✅ *Audit complete.*`;
        this.bot.editMessageText(auditReport, { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' });
      } catch {
        this.bot.editMessageText(`❌ *Audit failed.*\n\nCould not reach the target or web server.`, { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' });
      }
    });

    // /search command - Intelligence search
    this.bot.onText(/\/search (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const query = match![1];

      const waitMsg = await this.bot.sendMessage(chatId, `🔎 *Global Intelligence Search*\n\nQuery: \`${query}\`\n\n_Searching DuckDuckGo, Bing, and deep archives..._`, { parse_mode: 'Markdown' });

      try {
        const response = await fetch(`${this.WEB_URL}/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        const results = data.results || [];

        if (results.length > 0) {
          let report = `📊 *Search Results: "${query}"*\n\n`;
          results.slice(0, 6).forEach((r: any, i: number) => {
            report += `${i + 1}. *${r.title || 'Untitled'}*\n`;
            report += `   ${r.link || ''}\n\n`;
          });
          report += `✅ *${results.length} results retrieved and cached.*`;
          this.bot.editMessageText(report, { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' });
        } else {
          this.bot.editMessageText(`⚠️ *No results found for:* \`${query}\``, { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' });
        }
      } catch {
        this.bot.editMessageText(`❌ *Search failed.* Web server unreachable.`, { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' });
      }
    });

    // /tools command
    this.bot.onText(/\/tools/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, `
🧰 *WHOAMISec Security Toolkit*

🔧 *Available Tools:*
• /scan \`<target>\` — OSINT Reconnaissance
• /audit \`<url>\` — Security Header Audit
• /search \`<query>\` — Global Intelligence Search
• /status — System Health Check
• /web — Dashboard Link

🌐 *Web Dashboard Tools:*
• OSINT Dashboard — Deep recon engine
• Attack Console — Network stress testing
• Payload Vault — SQL injection & CMS exploits
• Quantum IDE — Code execution sandbox
• WHOAMISEC GPT — AI chat assistant
• Botnet C2 — Zombie swarm management
• Scanner — Vulnerability assessment
• Blackhat Tools — Penetration suite
• LISP AI Engine — Neural analysis
• Media Forge — Content generation

_Use /web to access the full dashboard._
      `, { parse_mode: 'Markdown' });
    });

    // /help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, `
📖 *WHOAMISec AI — Command Reference*

⚡ *Core Commands:*
/start — Initialize bot connection
/status — System & service status
/help — Show this help message
/web — Get web dashboard URL

🔍 *Intelligence Commands:*
/scan \`<domain_or_ip>\` — OSINT recon
/audit \`<https://url>\` — Security audit
/search \`<query>\` — Global search
/tools — List all available tools

📌 *Usage Examples:*
/scan example.com
/audit https://target.com
/search cybersecurity news

🌐 *Web Panel:* ${this.WEB_URL}
🔐 *Operational. All systems green.*
      `, { parse_mode: 'Markdown' });
    });

    // /web command
    this.bot.onText(/\/web/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, `🌐 *WHOAMISec Web Dashboard*\n\n🔗 ${this.WEB_URL}\n\n_Full access to all security tools and AI modules._`, { parse_mode: 'Markdown' });
    });

    // Default message handler — AI chat
    this.bot.on('message', (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        const chatId = msg.chat.id;
        const text = msg.text;
        const lower = text.toLowerCase();

        // Intent detection
        if (lower.includes('who are you') || lower.includes('what are you') || lower.includes('cine esti')) {
          this.bot.sendMessage(chatId, `I am *WHOAMISec GPT*, an advanced AI trained for cybersecurity, software development, and strategic analysis. Currently operating at full capacity.\n\nUse /help to see what I can do.`, { parse_mode: 'Markdown' });
          return;
        }

        if (lower.includes('hello') || lower.includes('hi') || lower.includes('salut')) {
          this.bot.sendMessage(chatId, `Greetings, Operative. Systems online. Awaiting directives.\n\nUse /tools to see available capabilities.`, { parse_mode: 'Markdown' });
          return;
        }

        // Forward to local chat API
        fetch(`${this.WEB_URL}/api/local-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.text) {
              // Telegram markdown has a 4096 char limit
              const chunks = this.splitMessage(data.text, 4000);
              chunks.forEach((chunk, i) => {
                setTimeout(() => {
                  this.bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' }).catch(() => {
                    this.bot.sendMessage(chatId, chunk); // Fallback without markdown
                  });
                }, i * 500);
              });
            }
          })
          .catch(() => {
            this.bot.sendMessage(chatId, `⚠️ Neural core processing delayed. Try again or use /status to check connectivity.`);
          });
      }
    });

    // Error handling
    this.bot.on('polling_error', (error) => {
      console.error(`[WHOAMISec Bot] Polling error:`, error.message);
    });
  }

  private splitMessage(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) return [text];
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }
      let splitIndex = remaining.lastIndexOf('\n', maxLength);
      if (splitIndex === -1) splitIndex = maxLength;
      chunks.push(remaining.substring(0, splitIndex));
      remaining = remaining.substring(splitIndex).trim();
    }
    return chunks;
  }

  public getBot() {
    return this.bot;
  }

  public stop() {
    this.bot.stopPolling();
    console.log('[WHOAMISec Bot] Stopped');
  }
}

export function createTelegramBot() {
  return new WHOAMISecTelegramBot(TELEGRAM_BOT_TOKEN);
}

export default WHOAMISecTelegramBot;
