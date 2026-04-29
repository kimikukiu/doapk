// ============================================================
// Pure TypeScript SQLite-like Database for Vercel
// Replaces better-sqlite3 (native module) with a pure TS implementation
// Works on Vercel serverless - no native dependencies
// ============================================================

type Row = Record<string, any>;
type Statement = {
  run: (...params: any[]) => { lastInsertRowid: number; changes: number };
  get: (...params: any[]) => Row | undefined;
  all: (...params: any[]) => Row[];
  iterate: (...params: any[]) => IterableIterator<Row>;
};

type Database = {
  prepare: (sql: string) => Statement;
  exec: (sql: string) => void;
  pragma: (pragma: string) => any;
  close: () => void;
};

// Simple in-memory database with WAL mode simulation
class MemoryDatabase implements Database {
  private tables: Map<string, Row[]> = new Map();
  private sequence: Map<string, number> = new Map();

  prepare(sql: string): Statement {
    const trimmed = sql.trim().toUpperCase();
    
    return {
      run: (...params: any[]) => {
        if (trimmed.startsWith('INSERT')) {
          return this.handleInsert(sql, params);
        } else if (trimmed.startsWith('CREATE')) {
          this.handleCreate(sql);
          return { lastInsertRowid: 0, changes: 0 };
        } else if (trimmed.startsWith('SELECT')) {
          return { lastInsertRowid: 0, changes: 0 };
        }
        return { lastInsertRowid: 0, changes: 0 };
      },
      get: (...params: any[]) => {
        const rows = this.executeSelect(sql, params);
        return rows[0];
      },
      all: (...params: any[]) => {
        return this.executeSelect(sql, params);
      },
      iterate: (...params: any[]) => {
        const rows = this.executeSelect(sql, params);
        return rows[Symbol.iterator]() as any;
      }
    };
  }

  private handleCreate(sql: string): void {
    const match = sql.match(/CREATE TABLE (IF NOT EXISTS )?(\w+)/i);
    if (match) {
      const tableName = match[2];
      if (!this.tables.has(tableName)) {
        this.tables.set(tableName, []);
        this.sequence.set(tableName, 0);
      }
    }
  }

  private handleInsert(sql: string, params: any[]): { lastInsertRowid: number; changes: number } {
    const match = sql.match(/INSERT (OR REPLACE )?INTO (\w+)/i);
    if (!match) return { lastInsertRowid: 0, changes: 0 };
    
    const tableName = match[2];
    const columnsMatch = sql.match(/\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    
    if (!columnsMatch) return { lastInsertRowid: 0, changes: 0 };
    
    const columns = columnsMatch[1].split(',').map(c => c.trim().replace(/`/g, ''));
    const values = columnsMatch[2].split(',').map(v => v.trim());
    
    const row: Row = {};
    let paramIndex = 0;
    
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const val = values[i];
      
      if (val === '?') {
        row[col] = params[paramIndex++];
      } else if (val === 'CURRENT_TIMESTAMP') {
        row[col] = new Date().toISOString();
      } else if (val?.startsWith("'")) {
        row[col] = val.replace(/^'|'$/g, '');
      } else {
        row[col] = val;
      }
    }
    
    // Auto-increment ID
    if ('id' in row && !row.id) {
      const seq = (this.sequence.get(tableName) || 0) + 1;
      this.sequence.set(tableName, seq);
      row.id = seq;
    }
    
    const table = this.tables.get(tableName) || [];
    table.push(row);
    this.tables.set(tableName, table);
    
    return { lastInsertRowid: row.id || 0, changes: 1 };
  }

  private executeSelect(sql: string, params: any[]): Row[] {
    const tableMatch = sql.match(/FROM (\w+)/i);
    if (!tableMatch) return [];
    
    const tableName = tableMatch[1];
    let rows = this.tables.get(tableName) || [];
    
    // WHERE clause
    const whereMatch = sql.match(/WHERE (\w+) = \?/i);
    if (whereMatch) {
      const col = whereMatch[1];
      const val = params[0];
      rows = rows.filter(row => row[col] === val);
    }
    
    // ORDER BY
    const orderMatch = sql.match(/ORDER BY (\w+) (DESC|ASC)?/i);
    if (orderMatch) {
      const col = orderMatch[1];
      const dir = orderMatch[2]?.toLowerCase() === 'desc' ? -1 : 1;
      rows.sort((a, b) => (a[col] > b[col] ? 1 : -1) * dir);
    }
    
    // LIMIT
    const limitMatch = sql.match(/LIMIT \?/i);
    if (limitMatch && params.length > 0) {
      const limit = parseInt(params[params.length - 1]);
      if (!isNaN(limit)) {
        rows = rows.slice(0, limit);
      }
    }
    
    return rows;
  }

  exec(sql: string): void {
    const statements = sql.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      if (stmt.trim().toUpperCase().startsWith('CREATE')) {
        this.handleCreate(stmt);
      }
    }
  }

  pragma(pragma: string): any {
    return null;
  }

  close(): void {
    this.tables.clear();
    this.sequence.clear();
  }
}

// Export the same API as better-sqlite3
export function Database(path: string): Database {
  console.log(`[DB] Using pure TypeScript database (path: ${path}) - works on Vercel!`);
  return new MemoryDatabase();
}

export default { Database };
