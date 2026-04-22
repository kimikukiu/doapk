import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'local_data.db');

// Ensure the database file exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, '');
}

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
    const stmt = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?');
    return stmt.all(limit);
  }
};
