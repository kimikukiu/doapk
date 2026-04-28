
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
  TV_BROADCAST = 'TV_BROADCAST',
  STS_TELECOM = 'STS_TELECOM',
  GOLIATH_VEHICLES = 'GOLIATH_VEHICLES',
  AIRPORT_CONTROL = 'AIRPORT_CONTROL',
  METRO_TRAINS = 'METRO_TRAINS',
  BIOMETRIC_RECON = 'BIOMETRIC_RECON',
  GLOBAL_SCADA = 'GLOBAL_SCADA',
  SS7_SIGNALS = 'SS7_SIGNALS',
  AEROSPACE_NAVAL = 'AEROSPACE_NAVAL',
  STARLINK_PALANTIR = 'STARLINK_PALANTIR',
  MILITARY_JETS = 'MILITARY_JETS',
  GLOBAL_BANKING = 'GLOBAL_BANKING',
  POLICE_RADIO = 'POLICE_RADIO',
  QUANTUM_CODER = 'QUANTUM_CODER',
  SPACEX_CONTROL = 'SPACEX_CONTROL',
  PROMIS_CONTROL = 'PROMIS_CONTROL',
  LISP_AI_CONTROL = 'LISP_AI_CONTROL'
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
