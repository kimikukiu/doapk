
export interface BotNode {
  id: string;
  country: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  latency: number;
  uptime: string;
  type: 'IOT' | 'SERVER' | 'DESKTOP';
}

export interface Exploit {
  name: string;
  cve?: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  scriptType?: 'Python' | 'NodeJS' | 'Medusa';
  affectedVersions?: string;
  impact?: string;
  mitigation?: string;
  type?: 'SQLi' | 'RCE' | 'XSS' | 'LFI' | 'AuthBypass';
}

export interface LeakedRecord {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  role: string;
}

export interface NetworkConfig {
  threads: number;
  time: number;
  rqs: number;
  proxyScrape: boolean;
  method: string;
  powerLevel: 'Standard' | 'Turbo' | 'Critical' | 'EXTREME_OVERCLOCK';
  payloadSize: number;
  headerJitter: boolean;
  port?: number;
  query?: '0' | '1' | '2' | '3';
  bfm?: boolean;
  delay?: number;
  cookie?: string;
  referer?: string;
  postdata?: string;
  randrate?: boolean;
  rateLimit?: number;
  sshUser?: string;
}

export interface ExploitHistoryItem {
  id: string;
  exploitName: string;
  target: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  leakedData?: {
    records: LeakedRecord[];
    adminPanelLink: string;
    databaseName: string;
    extractionLog: string[];
    deepFiles?: string[];
  };
}

export interface OSINTResult {
  target: string;
  timestamp: string;
  type: 'email' | 'phone' | 'domain' | 'full' | 'sqli' | 'cms' | 'network' | 'scraper';
  emails: string[];
  passwords?: string[];
  adminLinks?: string[];
  phones: string[];
  nicknames: string[];
  telegram: string[];
  tiktok: string[];
  socialMedia: string[];
  breaches: string[];
  vulnerabilities: string[];
  scrapedFiles?: {
    name: string;
    extension: string;
    size: string;
    source: string;
  }[];
  exploits: Exploit[];
  metadata: {
    sourceCount: number;
    reliabilityScore: number;
    threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  };
  summary: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'critical';
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  OSINT_DASHBOARD = 'OSINT_DASHBOARD',
  EXTRACTOR = 'EXTRACTOR', 
  SQL_INJECT = 'SQL_INJECT', 
  CMS_EXPLOIT = 'CMS_EXPLOIT', 
  NETWORK = 'NETWORK', 
  BOTNET_CORE = 'BOTNET_CORE',
  KIMIKUKIU_TOOLS = 'KIMIKUKIU_TOOLS',
  WHOAMISEC_GPT = 'WHOAMISEC_GPT',
  MEDIA_CREATOR = 'MEDIA_CREATOR',
  SETTINGS = 'SETTINGS',
  QUANTUM_INTELLIGENCE = 'QUANTUM_INTELLIGENCE',
  ZXCDDOS = 'ZXCDDOS',
  IDE_TOOL = 'IDE_TOOL',
  AI_CONFIG = 'AI_CONFIG',
  GPT_TOOL = 'GPT_TOOL',
  SOLANA_TOOL = 'SOLANA_TOOL',
  DEPLOYER_TOOL = 'DEPLOYER_TOOL',
  SCANNER_TOOL = 'SCANNER_TOOL',
  S3_TOOL = 'S3_TOOL',
  BLACKHAT_TOOL = 'BLACKHAT_TOOL',
  LAZARUS_TOOL = 'LAZARUS_TOOL',
  BURPSUITE_TOOL = 'BURPSUITE_TOOL',
  OWASP_TOOL = 'OWASP_TOOL',
  LISP_AI_CONTROL = 'LISP_AI_CONTROL',
  LISP_CRYPTO = 'LISP_CRYPTO',
  LISP_DATABASE = 'LISP_DATABASE',
  LISP_NEURAL = 'LISP_NEURAL',
  LISP_CISCO = 'LISP_CISCO',
  LISP_CLISP = 'LISP_CLISP',
  LISP_BREAKER = 'LISP_BREAKER',
  GPT_HUMAN = 'GPT_HUMAN',
  GPT_PLAN = 'GPT_PLAN',
  GPT_GEO = 'GPT_GEO',
  GPT_AMOVEO = 'GPT_AMOVEO',
  GPT_UAV = 'GPT_UAV',
  GPT_ICE = 'GPT_ICE',
  GPT_PALANTIR = 'GPT_PALANTIR',
  GPT_DRONES = 'GPT_DRONES',
  GPT_BANK = 'GPT_BANK',
  GPT_QUANTUM_ARMY = 'GPT_QUANTUM_ARMY',
  GPT_SOCIAL = 'GPT_SOCIAL',
  GPT_CCTV = 'GPT_CCTV',
  GPT_GHOST = 'GPT_GHOST',
  GPT_TV_HIJACK = 'GPT_TV_HIJACK',
  GPT_STS_BALLOT = 'GPT_STS_BALLOT',
  GPT_VEHICLES = 'GPT_VEHICLES',
  GPT_AIRPORTS = 'GPT_AIRPORTS',
  GPT_METRO = 'GPT_METRO',
  GPT_BIOMETRIC = 'GPT_BIOMETRIC',
  GPT_SCADA = 'GPT_SCADA',
  GPT_SS7 = 'GPT_SS7',
  GPT_AEROSPACE = 'GPT_AEROSPACE',
  GPT_STARLINK = 'GPT_STARLINK',
  GPT_JETS = 'GPT_JETS',
  GPT_BANKING = 'GPT_BANKING',
  GPT_POLICE = 'GPT_POLICE',
  GPT_CODER = 'GPT_CODER',
  GPT_SPACEX = 'GPT_SPACEX',
  GPT_PROMIS = 'GPT_PROMIS',
  CYCORP_CYC = 'CYCORP_CYC',
  BOTNET_C2 = 'BOTNET_C2',
  INVESTIGATION_AI = 'INVESTIGATION_AI',
  OSINT_INVESTIGATION = 'OSINT_INVESTIGATION',
  ANDROID_INVESTIGATION = 'ANDROID_INVESTIGATION',
  AWS_METADATA = 'AWS_METADATA',
  FILE_DISCOVERY = 'FILE_DISCOVERY'
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface RepoTool {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: 'OFFENSIVE' | 'INTEL' | 'TELEGRAM' | 'AI' | 'UTILITY' | 'ZR_REPOS';
  requiresTelegram?: boolean;
  githubUrl?: string;
}

export type AgentRole = 'ORCHESTRATOR' | 'RESEARCHER' | 'CODER' | 'SECURITY' | 'SOLANA' | 'LAMA' | 'TESTER' | 'DEPLOYER' | 'DOCUMENTER';

export interface Software {
  id: string;
  name: string;
  description: string;
  source: 'link' | 'upload';
  url?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  content?: string; // For code or text-based software
  installedAt: string;
  status: 'READY' | 'RUNNING' | 'ERROR';
}

export interface GptMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentRole?: AgentRole;
}

export interface ThreatFeedItem {
  id: string;
  source: string;
  event: string;
  time: string;
}

export type AIProvider = 'openrouter' | 'openai' | 'anthropic' | 'gemini' | 'mistral' | 'llama' | 'deepseek' | 'lisp' | 'milspec';

export interface AIConfig {
  provider: AIProvider;
  openrouterKey: string;
  openaiKey: string;
  anthropicKey: string;
  geminiKey: string;
  mistralKey: string;
  llamaKey: string;
  deepseekKey: string;
  deepseekBaseUrl: string;
  selectedModel: string;
  enableGemini: boolean;
}
