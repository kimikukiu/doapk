// ============================================================
// Pure TypeScript Database - Works on Vercel!
// ============================================================
// Replaces better-sqlite3 (native module) with pure TypeScript.
// No native dependencies - works everywhere including Vercel serverless.
// ============================================================

import { Database } from './ts-database';

// Use pure TS database - works on Vercel!
const DB_PATH = process.env.DATABASE_PATH || 'local_data.db';
const db = new Database(DB_PATH);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    message TEXT,
    level TEXT
  );
  CREATE TABLE IF NOT EXISTS knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT UNIQUE,
    result TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('[DB] ✅ Pure TypeScript database initialized - works on Vercel!');

export const dbService = {
  log: (message: string, level: string = 'info') => {
    const stmt = db.prepare('INSERT INTO logs (message, level) VALUES (?, ?)');
    stmt.run(message, level);
  },
  saveKnowledge: (query: string, result: string) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO knowledge (query, result) VALUES (?, ?)');
    stmt.run(query, result);
  },
  getKnowledge: (query: string) => {
    const stmt = db.prepare('SELECT result FROM knowledge WHERE query = ?');
    return stmt.get(query);
  },
  getLogs: (limit: number = 50) => {
    const stmt = db.prepare(`SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?`);
    return stmt.all(limit);
  }
};
