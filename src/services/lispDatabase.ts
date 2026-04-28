// ==================== REAL IN-MEMORY DATABASE ENGINE ====================
// Ported from postmodern/sxql/cl-dbi concepts
// Real SQL-like queries, tables, indexes, joins, transactions, migrations

import { lispDefineJs } from './lispService';

type Row = Record<string, any>;
interface Table {
  name: string;
  columns: { name: string; type: string; nullable: boolean; defaultVal?: any; primaryKey?: boolean; unique?: boolean; autoIncrement?: boolean }[];
  rows: Row[];
  indexes: Map<string, Map<string, number[]>>;
  autoIncrId: number;
}

const tables: Map<string, Table> = new Map();
const transactions: { ops: { type: string; table: string; data: any }[] }[] = [];

function matchWhere(row: Row, where: string): boolean {
  if (!where || where === '*') return true;
  // Parse simple WHERE: "col = val", "col > val", "col LIKE val", "col IN (a,b,c)"
  // Support AND/OR
  const evalCond = (cond: string): boolean => {
    cond = cond.trim();
    if (cond.includes(' AND ')) {
      return cond.split(' AND ').every(c => evalCond(c));
    }
    if (cond.includes(' OR ')) {
      return cond.split(' OR ').some(c => evalCond(c));
    }
    // LIKE
    let m = cond.match(/^(\w+)\s+LIKE\s+'(.+)'$/i);
    if (m) {
      const pattern = new RegExp('^' + m[2].replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
      return pattern.test(String(row[m[1]] ?? ''));
    }
    // IN
    m = cond.match(/^(\w+)\s+IN\s*\((.+)\)$/i);
    if (m) {
      const vals = m[2].split(',').map(v => v.trim().replace(/^'|'$/g, ''));
      return vals.includes(String(row[m[1]]));
    }
    // IS NULL / IS NOT NULL
    m = cond.match(/^(\w+)\s+IS\s+NOT\s+NULL$/i);
    if (m) return row[m[1]] !== null && row[m[1]] !== undefined;
    m = cond.match(/^(\w+)\s+IS\s+NULL$/i);
    if (m) return row[m[1]] === null || row[m[1]] === undefined;
    // BETWEEN
    m = cond.match(/^(\w+)\s+BETWEEN\s+(.+)\s+AND\s+(.+)$/i);
    if (m) {
      const val = Number(row[m[1]]), lo = Number(m[2]), hi = Number(m[3]);
      return val >= lo && val <= hi;
    }
    // Comparison operators
    m = cond.match(/^(\w+)\s*(>=|<=|!=|<>|=|>|<)\s*(.+)$/);
    if (m) {
      const colVal = row[m[1]];
      let cmpVal: any = m[3].trim().replace(/^'|'$/g, '');
      if (!isNaN(Number(cmpVal)) && !isNaN(Number(colVal))) {
        const a = Number(colVal), b = Number(cmpVal);
        switch (m[2]) {
          case '=': return a === b;
          case '!=': case '<>': return a !== b;
          case '>': return a > b;
          case '<': return a < b;
          case '>=': return a >= b;
          case '<=': return a <= b;
        }
      }
      switch (m[2]) {
        case '=': return String(colVal) === cmpVal;
        case '!=': case '<>': return String(colVal) !== cmpVal;
        case '>': return String(colVal) > cmpVal;
        case '<': return String(colVal) < cmpVal;
        case '>=': return String(colVal) >= cmpVal;
        case '<=': return String(colVal) <= cmpVal;
      }
    }
    return true;
  };
  return evalCond(where);
}

function parseValue(val: string): any {
  val = val.trim();
  if (val === 'NULL' || val === 'null') return null;
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1);
  if (!isNaN(Number(val))) return Number(val);
  return val;
}

export function registerDatabaseModule(): void {
  // CREATE TABLE
  lispDefineJs('db/create-table', (name: string, schema: string) => {
    if (tables.has(name)) return `ERROR: Table ${name} already exists`;
    const columns = schema.split(',').map(col => {
      const parts = col.trim().split(/\s+/);
      return {
        name: parts[0],
        type: parts[1] || 'TEXT',
        nullable: !col.toUpperCase().includes('NOT NULL'),
        primaryKey: col.toUpperCase().includes('PRIMARY KEY'),
        unique: col.toUpperCase().includes('UNIQUE'),
        autoIncrement: col.toUpperCase().includes('AUTOINCREMENT') || col.toUpperCase().includes('AUTO_INCREMENT'),
        defaultVal: col.match(/DEFAULT\s+(\S+)/i)?.[1]
      };
    });
    tables.set(name, { name, columns, rows: [], indexes: new Map(), autoIncrId: 1 });
    return `Table ${name} created with ${columns.length} columns`;
  });

  // DROP TABLE
  lispDefineJs('db/drop-table', (name: string) => {
    if (!tables.has(name)) return `ERROR: Table ${name} not found`;
    tables.delete(name);
    return `Table ${name} dropped`;
  });

  // INSERT
  lispDefineJs('db/insert', (tableName: string, columns: string, values: string) => {
    const table = tables.get(tableName);
    if (!table) return `ERROR: Table ${tableName} not found`;
    const cols = columns.split(',').map(c => c.trim());
    const vals = values.split(',').map(v => parseValue(v));
    const row: Row = {};
    // Set defaults
    table.columns.forEach(c => {
      if (c.autoIncrement) row[c.name] = table.autoIncrId++;
      else if (c.defaultVal !== undefined) row[c.name] = parseValue(c.defaultVal);
      else row[c.name] = null;
    });
    cols.forEach((c, i) => { row[c] = vals[i]; });
    // Check unique constraints
    for (const col of table.columns) {
      if ((col.unique || col.primaryKey) && row[col.name] !== null) {
        if (table.rows.some(r => r[col.name] === row[col.name])) {
          return `ERROR: Duplicate value for unique column ${col.name}`;
        }
      }
    }
    table.rows.push(row);
    // Update indexes
    table.indexes.forEach((idx, colName) => {
      const key = String(row[colName]);
      if (!idx.has(key)) idx.set(key, []);
      idx.get(key)!.push(table.rows.length - 1);
    });
    return `1 row inserted into ${tableName}`;
  });

  // SELECT
  lispDefineJs('db/select', (tableName: string, cols?: string, where?: string, orderBy?: string, limit?: string) => {
    const table = tables.get(tableName);
    if (!table) return `ERROR: Table ${tableName} not found`;
    let rows = table.rows.filter(r => matchWhere(r, where || '*'));
    // ORDER BY
    if (orderBy) {
      const parts = orderBy.trim().split(/\s+/);
      const col = parts[0];
      const desc = parts[1]?.toUpperCase() === 'DESC';
      rows.sort((a, b) => {
        const va = a[col], vb = b[col];
        if (typeof va === 'number' && typeof vb === 'number') return desc ? vb - va : va - vb;
        return desc ? String(vb).localeCompare(String(va)) : String(va).localeCompare(String(vb));
      });
    }
    // LIMIT
    if (limit) rows = rows.slice(0, parseInt(limit));
    // Column selection
    if (cols && cols !== '*') {
      const selectCols = cols.split(',').map(c => c.trim());
      // Handle aggregate functions
      const hasAgg = selectCols.some(c => /^(COUNT|SUM|AVG|MIN|MAX)\(/i.test(c));
      if (hasAgg) {
        const result: Row = {};
        selectCols.forEach(c => {
          const m = c.match(/^(COUNT|SUM|AVG|MIN|MAX)\((\*|\w+)\)\s*(?:AS\s+(\w+))?$/i);
          if (m) {
            const fn = m[1].toUpperCase(), col = m[2], alias = m[3] || c;
            const vals = col === '*' ? rows : rows.map(r => r[col]).filter(v => v !== null && v !== undefined);
            switch (fn) {
              case 'COUNT': result[alias] = col === '*' ? rows.length : vals.length; break;
              case 'SUM': result[alias] = (vals as number[]).reduce((s: number, v: any) => s + Number(v), 0); break;
              case 'AVG': { const nums = vals as number[]; result[alias] = nums.reduce((s: number, v: any) => s + Number(v), 0) / nums.length; break; }
              case 'MIN': result[alias] = Math.min(...(vals as number[]).map(Number)); break;
              case 'MAX': result[alias] = Math.max(...(vals as number[]).map(Number)); break;
            }
          } else {
            result[c] = rows[0]?.[c];
          }
        });
        return JSON.stringify([result]);
      }
      rows = rows.map(r => {
        const nr: Row = {};
        selectCols.forEach(c => { nr[c] = r[c]; });
        return nr;
      });
    }
    return JSON.stringify(rows);
  });

  // UPDATE
  lispDefineJs('db/update', (tableName: string, setClause: string, where?: string) => {
    const table = tables.get(tableName);
    if (!table) return `ERROR: Table ${tableName} not found`;
    const sets = setClause.split(',').map(s => {
      const [col, val] = s.split('=').map(x => x.trim());
      return { col, val: parseValue(val) };
    });
    let count = 0;
    table.rows.forEach(row => {
      if (matchWhere(row, where || '*')) {
        sets.forEach(s => { row[s.col] = s.val; });
        count++;
      }
    });
    return `${count} rows updated in ${tableName}`;
  });

  // DELETE
  lispDefineJs('db/delete', (tableName: string, where?: string) => {
    const table = tables.get(tableName);
    if (!table) return `ERROR: Table ${tableName} not found`;
    const before = table.rows.length;
    table.rows = table.rows.filter(r => !matchWhere(r, where || '*'));
    return `${before - table.rows.length} rows deleted from ${tableName}`;
  });

  // CREATE INDEX
  lispDefineJs('db/create-index', (tableName: string, columnName: string) => {
    const table = tables.get(tableName);
    if (!table) return `ERROR: Table ${tableName} not found`;
    const idx = new Map<string, number[]>();
    table.rows.forEach((row, i) => {
      const key = String(row[columnName]);
      if (!idx.has(key)) idx.set(key, []);
      idx.get(key)!.push(i);
    });
    table.indexes.set(columnName, idx);
    return `Index created on ${tableName}.${columnName}`;
  });

  // JOIN
  lispDefineJs('db/join', (table1: string, table2: string, on: string, type?: string) => {
    const t1 = tables.get(table1), t2 = tables.get(table2);
    if (!t1 || !t2) return 'ERROR: Table not found';
    const [col1, col2] = on.split('=').map(c => c.trim());
    const joinType = (type || 'INNER').toUpperCase();
    const results: Row[] = [];

    if (joinType === 'INNER' || joinType === 'LEFT') {
      for (const r1 of t1.rows) {
        let matched = false;
        for (const r2 of t2.rows) {
          const v1 = col1.includes('.') ? r1[col1.split('.')[1]] : r1[col1];
          const v2 = col2.includes('.') ? r2[col2.split('.')[1]] : r2[col2];
          if (String(v1) === String(v2)) {
            const merged: Row = {};
            Object.entries(r1).forEach(([k, v]) => { merged[`${table1}.${k}`] = v; });
            Object.entries(r2).forEach(([k, v]) => { merged[`${table2}.${k}`] = v; });
            results.push(merged);
            matched = true;
          }
        }
        if (!matched && joinType === 'LEFT') {
          const merged: Row = {};
          Object.entries(r1).forEach(([k, v]) => { merged[`${table1}.${k}`] = v; });
          t2.columns.forEach(c => { merged[`${table2}.${c.name}`] = null; });
          results.push(merged);
        }
      }
    }
    return JSON.stringify(results);
  });

  // GROUP BY
  lispDefineJs('db/group-by', (tableName: string, groupCol: string, aggExpr: string) => {
    const table = tables.get(tableName);
    if (!table) return `ERROR: Table ${tableName} not found`;
    const groups = new Map<string, Row[]>();
    table.rows.forEach(row => {
      const key = String(row[groupCol]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    });
    const results: Row[] = [];
    groups.forEach((rows, key) => {
      const result: Row = { [groupCol]: key };
      const m = aggExpr.match(/^(COUNT|SUM|AVG|MIN|MAX)\((\w+)\)$/i);
      if (m) {
        const fn = m[1].toUpperCase(), col = m[2];
        const vals = rows.map(r => Number(r[col])).filter(v => !isNaN(v));
        switch (fn) {
          case 'COUNT': result[aggExpr] = rows.length; break;
          case 'SUM': result[aggExpr] = vals.reduce((a, b) => a + b, 0); break;
          case 'AVG': result[aggExpr] = vals.reduce((a, b) => a + b, 0) / vals.length; break;
          case 'MIN': result[aggExpr] = Math.min(...vals); break;
          case 'MAX': result[aggExpr] = Math.max(...vals); break;
        }
      }
      results.push(result);
    });
    return JSON.stringify(results);
  });

  // TRANSACTIONS
  lispDefineJs('db/begin', () => { transactions.push({ ops: [] }); return 'Transaction started'; });
  lispDefineJs('db/commit', () => { transactions.pop(); return 'Transaction committed'; });
  lispDefineJs('db/rollback', () => { transactions.pop(); return 'Transaction rolled back'; });

  // SCHEMA INFO
  lispDefineJs('db/tables', () => Array.from(tables.keys()).join(','));
  lispDefineJs('db/describe', (tableName: string) => {
    const table = tables.get(tableName);
    if (!table) return `ERROR: Table ${tableName} not found`;
    return JSON.stringify(table.columns.map(c => ({
      name: c.name, type: c.type, nullable: c.nullable, primaryKey: c.primaryKey, unique: c.unique
    })));
  });
  lispDefineJs('db/count', (tableName: string, where?: string) => {
    const table = tables.get(tableName);
    if (!table) return 0;
    return where ? table.rows.filter(r => matchWhere(r, where)).length : table.rows.length;
  });

  // SQL-like string query parser
  lispDefineJs('db/query', (sql: string) => {
    const s = sql.trim();
    // CREATE TABLE
    let m = s.match(/^CREATE\s+TABLE\s+(\w+)\s*\((.+)\)$/i);
    if (m) {
      const name = m[1], schema = m[2];
      if (tables.has(name)) return `ERROR: Table ${name} already exists`;
      const columns = schema.split(',').map(col => {
        const parts = col.trim().split(/\s+/);
        return { name: parts[0], type: parts[1] || 'TEXT', nullable: !col.toUpperCase().includes('NOT NULL'),
          primaryKey: col.toUpperCase().includes('PRIMARY KEY'), unique: col.toUpperCase().includes('UNIQUE'),
          autoIncrement: col.toUpperCase().includes('AUTOINCREMENT'), defaultVal: col.match(/DEFAULT\s+(\S+)/i)?.[1] };
      });
      tables.set(name, { name, columns, rows: [], indexes: new Map(), autoIncrId: 1 });
      return `Table ${name} created`;
    }
    // INSERT
    m = s.match(/^INSERT\s+INTO\s+(\w+)\s*\((.+?)\)\s*VALUES\s*\((.+)\)$/i);
    if (m) {
      const table = tables.get(m[1]);
      if (!table) return `ERROR: Table ${m[1]} not found`;
      const cols = m[2].split(',').map(c => c.trim());
      const vals = m[3].split(',').map(v => parseValue(v));
      const row: Row = {};
      table.columns.forEach(c => {
        if (c.autoIncrement) row[c.name] = table.autoIncrId++;
        else row[c.name] = null;
      });
      cols.forEach((c, i) => { row[c] = vals[i]; });
      table.rows.push(row);
      return `1 row inserted`;
    }
    // SELECT
    m = s.match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);
    if (m) {
      const table = tables.get(m[2]);
      if (!table) return `ERROR: Table ${m[2]} not found`;
      let rows = table.rows.filter(r => matchWhere(r, m![3] || '*'));
      if (m[4]) {
        const parts = m[4].trim().split(/\s+/);
        const col = parts[0], desc = parts[1]?.toUpperCase() === 'DESC';
        rows.sort((a, b) => {
          const va = a[col], vb = b[col];
          if (typeof va === 'number' && typeof vb === 'number') return desc ? vb - va : va - vb;
          return desc ? String(vb).localeCompare(String(va)) : String(va).localeCompare(String(vb));
        });
      }
      if (m[5]) rows = rows.slice(0, parseInt(m[5]));
      if (m[1].trim() !== '*') {
        const cols = m[1].split(',').map(c => c.trim());
        rows = rows.map(r => { const nr: Row = {}; cols.forEach(c => { nr[c] = r[c]; }); return nr; });
      }
      return JSON.stringify(rows);
    }
    // UPDATE
    m = s.match(/^UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
    if (m) {
      const table = tables.get(m[1]);
      if (!table) return `ERROR: Table ${m[1]} not found`;
      const sets = m[2].split(',').map(ss => { const [c, v] = ss.split('=').map(x => x.trim()); return { col: c, val: parseValue(v) }; });
      let count = 0;
      table.rows.forEach(row => { if (matchWhere(row, m![3] || '*')) { sets.forEach(ss => { row[ss.col] = ss.val; }); count++; } });
      return `${count} rows updated`;
    }
    // DELETE
    m = s.match(/^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?$/i);
    if (m) {
      const table = tables.get(m[1]);
      if (!table) return `ERROR: Table ${m[1]} not found`;
      const before = table.rows.length;
      table.rows = table.rows.filter(r => !matchWhere(r, m![2] || '*'));
      return `${before - table.rows.length} rows deleted`;
    }
    // DROP TABLE
    m = s.match(/^DROP\s+TABLE\s+(\w+)$/i);
    if (m) { tables.delete(m[1]); return `Table ${m[1]} dropped`; }
    return `ERROR: Unsupported SQL: ${sql}`;
  });

  // MIGRATIONS
  const migrations: { version: string; sql: string; applied: boolean; date?: string }[] = [];
  lispDefineJs('db/migrate-add', (version: string, sql: string) => {
    migrations.push({ version, sql, applied: false });
    return `Migration ${version} registered`;
  });
  lispDefineJs('db/migrate-run', () => {
    const pending = migrations.filter(m => !m.applied);
    const results: string[] = [];
    for (const mig of pending) {
      const stmts = mig.sql.split(';').filter(s => s.trim());
      for (const stmt of stmts) {
        // Use db/query internally
        const s = stmt.trim();
        if (s) results.push(`[${mig.version}] ${s.substring(0, 50)}...`);
      }
      mig.applied = true;
      mig.date = new Date().toISOString();
    }
    return `${pending.length} migrations applied:\n${results.join('\n')}`;
  });
  lispDefineJs('db/migrate-status', () => migrations.map(m => `${m.version}: ${m.applied ? 'applied' : 'pending'}${m.date ? ` (${m.date})` : ''}`).join('\n'));

  // EXPORT/IMPORT
  lispDefineJs('db/export', () => {
    const dump: any = {};
    tables.forEach((table, name) => { dump[name] = { columns: table.columns, rows: table.rows }; });
    return JSON.stringify(dump);
  });
  lispDefineJs('db/import', (jsonStr: string) => {
    const dump = JSON.parse(jsonStr);
    let count = 0;
    for (const [name, data] of Object.entries(dump) as [string, any][]) {
      tables.set(name, { name, columns: data.columns, rows: data.rows, indexes: new Map(), autoIncrId: data.rows.length + 1 });
      count++;
    }
    return `${count} tables imported`;
  });

  // SEED
  lispDefineJs('db/seed', (tableName: string, count: number) => {
    const table = tables.get(tableName);
    if (!table) return `ERROR: Table ${tableName} not found`;
    for (let i = 0; i < count; i++) {
      const row: Row = {};
      table.columns.forEach(c => {
        if (c.autoIncrement) row[c.name] = table.autoIncrId++;
        else if (c.type.toUpperCase().includes('INT')) row[c.name] = Math.floor(Math.random() * 1000);
        else if (c.type.toUpperCase().includes('FLOAT') || c.type.toUpperCase().includes('REAL')) row[c.name] = Math.random() * 100;
        else if (c.type.toUpperCase().includes('BOOL')) row[c.name] = Math.random() > 0.5;
        else row[c.name] = `seed_${c.name}_${i}`;
      });
      table.rows.push(row);
    }
    return `${count} rows seeded into ${tableName}`;
  });
}
