// ==================== WHOAMISEC LISP ENGINE ====================
// Full LISP interpreter: parser, evaluator, environment, macros
// Used as API backbone for GPT and entire project

export type LispValue =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'symbol'; value: string }
  | { type: 'bool'; value: boolean }
  | { type: 'list'; value: LispValue[] }
  | { type: 'nil' }
  | { type: 'fn'; name: string; params: string[]; body: LispValue; env: LispEnv }
  | { type: 'macro'; name: string; params: string[]; body: LispValue }
  | { type: 'builtin'; name: string; fn: (args: LispValue[], env: LispEnv) => LispValue };

export interface LispEnv {
  vars: Map<string, LispValue>;
  parent: LispEnv | null;
}

export interface LispResult {
  value: LispValue;
  output: string[];
  error?: string;
  ast?: LispValue;
  elapsed?: number;
}

// ==================== TOKENIZER ====================
function tokenize(source: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === ';') { while (i < source.length && source[i] !== '\n') i++; continue; }
    if (ch === '(' || ch === ')') { tokens.push(ch); i++; continue; }
    if (ch === "'") { tokens.push("'"); i++; continue; }
    if (ch === '`') { tokens.push('`'); i++; continue; }
    if (ch === ',') {
      if (source[i + 1] === '@') { tokens.push(',@'); i += 2; }
      else { tokens.push(','); i++; }
      continue;
    }
    if (ch === '"') {
      let str = '"';
      i++;
      while (i < source.length && source[i] !== '"') {
        if (source[i] === '\\') { str += source[i] + source[i + 1]; i += 2; }
        else { str += source[i]; i++; }
      }
      str += '"';
      i++;
      tokens.push(str);
      continue;
    }
    let sym = '';
    while (i < source.length && !/[\s();"',`]/.test(source[i])) {
      sym += source[i]; i++;
    }
    tokens.push(sym);
  }
  return tokens;
}

// ==================== PARSER ====================
function parse(tokens: string[]): LispValue[] {
  let pos = 0;

  function readExpr(): LispValue {
    if (pos >= tokens.length) throw new Error('Unexpected end of input');
    const tok = tokens[pos];

    if (tok === "'") {
      pos++;
      return { type: 'list', value: [{ type: 'symbol', value: 'quote' }, readExpr()] };
    }
    if (tok === '`') {
      pos++;
      return { type: 'list', value: [{ type: 'symbol', value: 'quasiquote' }, readExpr()] };
    }
    if (tok === ',') {
      pos++;
      return { type: 'list', value: [{ type: 'symbol', value: 'unquote' }, readExpr()] };
    }
    if (tok === ',@') {
      pos++;
      return { type: 'list', value: [{ type: 'symbol', value: 'unquote-splicing' }, readExpr()] };
    }

    if (tok === '(') {
      pos++;
      const list: LispValue[] = [];
      while (pos < tokens.length && tokens[pos] !== ')') {
        list.push(readExpr());
      }
      if (pos >= tokens.length) throw new Error('Missing closing )');
      pos++; // skip )
      return { type: 'list', value: list };
    }

    if (tok === ')') throw new Error('Unexpected )');

    pos++;
    // String
    if (tok.startsWith('"') && tok.endsWith('"')) {
      return { type: 'string', value: tok.slice(1, -1).replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"') };
    }
    // Number
    const num = Number(tok);
    if (!isNaN(num) && tok !== '') return { type: 'number', value: num };
    // Boolean
    if (tok === '#t' || tok === 'true') return { type: 'bool', value: true };
    if (tok === '#f' || tok === 'false') return { type: 'bool', value: false };
    if (tok === 'nil' || tok === '#nil') return { type: 'nil' };
    // Symbol
    return { type: 'symbol', value: tok };
  }

  const exprs: LispValue[] = [];
  while (pos < tokens.length) {
    exprs.push(readExpr());
  }
  return exprs;
}

// ==================== PRINTER ====================
export function lispToString(val: LispValue): string {
  switch (val.type) {
    case 'number': return String(val.value);
    case 'string': return `"${val.value}"`;
    case 'symbol': return val.value;
    case 'bool': return val.value ? '#t' : '#f';
    case 'nil': return 'nil';
    case 'list': return `(${val.value.map(lispToString).join(' ')})`;
    case 'fn': return `<fn:${val.name || 'lambda'}>`;
    case 'macro': return `<macro:${val.name || 'macro'}>`;
    case 'builtin': return `<builtin:${val.name}>`;
  }
}

// ==================== ENVIRONMENT ====================
function createEnv(parent: LispEnv | null = null): LispEnv {
  return { vars: new Map(), parent };
}

function envGet(env: LispEnv, name: string): LispValue {
  if (env.vars.has(name)) return env.vars.get(name)!;
  if (env.parent) return envGet(env.parent, name);
  throw new Error(`Undefined symbol: ${name}`);
}

function envSet(env: LispEnv, name: string, val: LispValue): void {
  env.vars.set(name, val);
}

// ==================== EVALUATOR ====================
function evaluate(expr: LispValue, env: LispEnv, output: string[]): LispValue {
  // Self-evaluating
  if (expr.type === 'number' || expr.type === 'string' || expr.type === 'bool' || expr.type === 'nil') return expr;
  if (expr.type === 'builtin' || expr.type === 'fn' || expr.type === 'macro') return expr;

  // Symbol lookup
  if (expr.type === 'symbol') return envGet(env, expr.value);

  // List (function call or special form)
  if (expr.type === 'list') {
    if (expr.value.length === 0) return { type: 'nil' };
    const first = expr.value[0];

    // Special forms
    if (first.type === 'symbol') {
      switch (first.value) {
        case 'quote':
          return expr.value[1];

        case 'if': {
          const cond = evaluate(expr.value[1], env, output);
          if (cond.type === 'nil' || (cond.type === 'bool' && !cond.value)) {
            return expr.value[3] ? evaluate(expr.value[3], env, output) : { type: 'nil' };
          }
          return evaluate(expr.value[2], env, output);
        }

        case 'cond': {
          for (let i = 1; i < expr.value.length; i++) {
            const clause = expr.value[i];
            if (clause.type !== 'list') throw new Error('cond clause must be a list');
            const test = clause.value[0];
            if (test.type === 'symbol' && test.value === 'else') {
              return evaluate(clause.value[1], env, output);
            }
            const result = evaluate(test, env, output);
            if (!(result.type === 'nil' || (result.type === 'bool' && !result.value))) {
              return evaluate(clause.value[1], env, output);
            }
          }
          return { type: 'nil' };
        }

        case 'define': case 'def': {
          const name = expr.value[1];
          if (name.type === 'list') {
            // (define (name params...) body)
            const fnName = (name.value[0] as any).value;
            const params = name.value.slice(1).map((p: any) => p.value);
            const body = expr.value[2];
            const fn: LispValue = { type: 'fn', name: fnName, params, body, env };
            envSet(env, fnName, fn);
            return fn;
          }
          const val = evaluate(expr.value[2], env, output);
          envSet(env, (name as any).value, val);
          return val;
        }

        case 'set!': {
          const val = evaluate(expr.value[2], env, output);
          let e: LispEnv | null = env;
          const name = (expr.value[1] as any).value;
          while (e) {
            if (e.vars.has(name)) { e.vars.set(name, val); return val; }
            e = e.parent;
          }
          envSet(env, name, val);
          return val;
        }

        case 'lambda': case 'fn': {
          const params = (expr.value[1] as any).value.map((p: any) => p.value);
          const body = expr.value[2];
          return { type: 'fn', name: 'lambda', params, body, env };
        }

        case 'defmacro': {
          const name = (expr.value[1] as any).value;
          const params = (expr.value[2] as any).value.map((p: any) => p.value);
          const body = expr.value[3];
          const macro: LispValue = { type: 'macro', name, params, body };
          envSet(env, name, macro);
          return macro;
        }

        case 'let': {
          const bindings = (expr.value[1] as any).value;
          const childEnv = createEnv(env);
          for (const b of bindings) {
            const name = (b as any).value[0].value;
            const val = evaluate((b as any).value[1], env, output);
            envSet(childEnv, name, val);
          }
          let result: LispValue = { type: 'nil' };
          for (let i = 2; i < expr.value.length; i++) {
            result = evaluate(expr.value[i], childEnv, output);
          }
          return result;
        }

        case 'begin': case 'do': case 'progn': {
          let result: LispValue = { type: 'nil' };
          for (let i = 1; i < expr.value.length; i++) {
            result = evaluate(expr.value[i], env, output);
          }
          return result;
        }

        case 'and': {
          let result: LispValue = { type: 'bool', value: true };
          for (let i = 1; i < expr.value.length; i++) {
            result = evaluate(expr.value[i], env, output);
            if (result.type === 'nil' || (result.type === 'bool' && !result.value)) return result;
          }
          return result;
        }

        case 'or': {
          for (let i = 1; i < expr.value.length; i++) {
            const result = evaluate(expr.value[i], env, output);
            if (!(result.type === 'nil' || (result.type === 'bool' && !result.value))) return result;
          }
          return { type: 'bool', value: false };
        }

        case 'not': {
          const val = evaluate(expr.value[1], env, output);
          return { type: 'bool', value: val.type === 'nil' || (val.type === 'bool' && !val.value) };
        }

        case 'eval': {
          const val = evaluate(expr.value[1], env, output);
          return evaluate(val, env, output);
        }

        case 'apply': {
          const fn = evaluate(expr.value[1], env, output);
          const args = evaluate(expr.value[2], env, output);
          if (args.type !== 'list') throw new Error('apply: second argument must be a list');
          return applyFn(fn, args.value, env, output);
        }

        case 'map': {
          const fn = evaluate(expr.value[1], env, output);
          const lst = evaluate(expr.value[2], env, output);
          if (lst.type !== 'list') throw new Error('map: second argument must be a list');
          return { type: 'list', value: lst.value.map(item => applyFn(fn, [item], env, output)) };
        }

        case 'filter': {
          const fn = evaluate(expr.value[1], env, output);
          const lst = evaluate(expr.value[2], env, output);
          if (lst.type !== 'list') throw new Error('filter: second argument must be a list');
          return { type: 'list', value: lst.value.filter(item => {
            const r = applyFn(fn, [item], env, output);
            return !(r.type === 'nil' || (r.type === 'bool' && !r.value));
          })};
        }

        case 'reduce': {
          const fn = evaluate(expr.value[1], env, output);
          const init = evaluate(expr.value[2], env, output);
          const lst = evaluate(expr.value[3], env, output);
          if (lst.type !== 'list') throw new Error('reduce: third argument must be a list');
          let acc = init;
          for (const item of lst.value) {
            acc = applyFn(fn, [acc, item], env, output);
          }
          return acc;
        }

        case 'try': {
          try {
            return evaluate(expr.value[1], env, output);
          } catch (e: any) {
            if (expr.value[2]) {
              const catchEnv = createEnv(env);
              envSet(catchEnv, 'error', { type: 'string', value: e.message || String(e) });
              return evaluate(expr.value[2], catchEnv, output);
            }
            return { type: 'string', value: e.message || String(e) };
          }
        }

        case 'throw': {
          const val = evaluate(expr.value[1], env, output);
          throw new Error(lispToString(val));
        }

        case 'loop': case 'while': {
          const cond = expr.value[1];
          const body = expr.value[2];
          let result: LispValue = { type: 'nil' };
          let iterations = 0;
          while (true) {
            const c = evaluate(cond, env, output);
            if (c.type === 'nil' || (c.type === 'bool' && !c.value)) break;
            result = evaluate(body, env, output);
            if (++iterations > 10000) throw new Error('Loop limit exceeded (10000 iterations)');
          }
          return result;
        }

        case 'for': {
          // (for i 0 10 body)
          const varName = (expr.value[1] as any).value;
          const start = evaluate(expr.value[2], env, output);
          const end = evaluate(expr.value[3], env, output);
          const body = expr.value[4];
          if (start.type !== 'number' || end.type !== 'number') throw new Error('for: bounds must be numbers');
          const loopEnv = createEnv(env);
          let result: LispValue = { type: 'nil' };
          for (let i = start.value; i < end.value; i++) {
            envSet(loopEnv, varName, { type: 'number', value: i });
            result = evaluate(body, loopEnv, output);
          }
          return result;
        }
      }
    }

    // Evaluate function and arguments
    const fn = evaluate(first, env, output);

    // Macro expansion
    if (fn.type === 'macro') {
      const macroEnv = createEnv(env);
      for (let i = 0; i < fn.params.length; i++) {
        envSet(macroEnv, fn.params[i], expr.value[i + 1]); // unevaluated
      }
      const expanded = evaluate(fn.body, macroEnv, output);
      return evaluate(expanded, env, output);
    }

    const args = expr.value.slice(1).map(a => evaluate(a, env, output));
    return applyFn(fn, args, env, output);
  }

  throw new Error(`Cannot evaluate: ${lispToString(expr)}`);
}

function applyFn(fn: LispValue, args: LispValue[], env: LispEnv, output: string[]): LispValue {
  if (fn.type === 'builtin') return fn.fn(args, env);
  if (fn.type === 'fn') {
    const fnEnv = createEnv(fn.env);
    for (let i = 0; i < fn.params.length; i++) {
      envSet(fnEnv, fn.params[i], args[i] || { type: 'nil' });
    }
    return evaluate(fn.body, fnEnv, output);
  }
  throw new Error(`Not a function: ${lispToString(fn)}`);
}

// ==================== STANDARD LIBRARY ====================
function createStdLib(output: string[]): LispEnv {
  const env = createEnv();

  const b = (name: string, fn: (args: LispValue[], env: LispEnv) => LispValue) => {
    envSet(env, name, { type: 'builtin', name, fn });
  };

  // Arithmetic
  b('+', (args) => ({ type: 'number', value: args.reduce((a, v) => a + (v.type === 'number' ? v.value : 0), 0) }));
  b('-', (args) => {
    if (args.length === 1) return { type: 'number', value: -(args[0] as any).value };
    return { type: 'number', value: args.slice(1).reduce((a, v) => a - (v.type === 'number' ? v.value : 0), (args[0] as any).value) };
  });
  b('*', (args) => ({ type: 'number', value: args.reduce((a, v) => a * (v.type === 'number' ? v.value : 1), 1) }));
  b('/', (args) => {
    const divisor = (args[1] as any).value;
    if (divisor === 0) throw new Error('Division by zero');
    return { type: 'number', value: (args[0] as any).value / divisor };
  });
  b('mod', (args) => ({ type: 'number', value: (args[0] as any).value % (args[1] as any).value }));
  b('pow', (args) => ({ type: 'number', value: Math.pow((args[0] as any).value, (args[1] as any).value) }));
  b('sqrt', (args) => ({ type: 'number', value: Math.sqrt((args[0] as any).value) }));
  b('abs', (args) => ({ type: 'number', value: Math.abs((args[0] as any).value) }));
  b('floor', (args) => ({ type: 'number', value: Math.floor((args[0] as any).value) }));
  b('ceil', (args) => ({ type: 'number', value: Math.ceil((args[0] as any).value) }));
  b('round', (args) => ({ type: 'number', value: Math.round((args[0] as any).value) }));
  b('random', (args) => ({ type: 'number', value: args.length > 0 ? Math.floor(Math.random() * (args[0] as any).value) : Math.random() }));
  b('max', (args) => ({ type: 'number', value: Math.max(...args.map(a => (a as any).value)) }));
  b('min', (args) => ({ type: 'number', value: Math.min(...args.map(a => (a as any).value)) }));

  // Comparison
  b('=', (args) => ({ type: 'bool', value: lispToString(args[0]) === lispToString(args[1]) }));
  b('!=', (args) => ({ type: 'bool', value: lispToString(args[0]) !== lispToString(args[1]) }));
  b('<', (args) => ({ type: 'bool', value: (args[0] as any).value < (args[1] as any).value }));
  b('>', (args) => ({ type: 'bool', value: (args[0] as any).value > (args[1] as any).value }));
  b('<=', (args) => ({ type: 'bool', value: (args[0] as any).value <= (args[1] as any).value }));
  b('>=', (args) => ({ type: 'bool', value: (args[0] as any).value >= (args[1] as any).value }));

  // List operations
  b('list', (args) => ({ type: 'list', value: args }));
  b('cons', (args) => {
    const cdr = args[1];
    if (cdr.type === 'list') return { type: 'list', value: [args[0], ...cdr.value] };
    return { type: 'list', value: [args[0], cdr] };
  });
  b('car', (args) => args[0].type === 'list' && args[0].value.length > 0 ? args[0].value[0] : { type: 'nil' });
  b('cdr', (args) => args[0].type === 'list' ? { type: 'list', value: args[0].value.slice(1) } : { type: 'nil' });
  b('first', (args) => args[0].type === 'list' && args[0].value.length > 0 ? args[0].value[0] : { type: 'nil' });
  b('rest', (args) => args[0].type === 'list' ? { type: 'list', value: args[0].value.slice(1) } : { type: 'nil' });
  b('last', (args) => args[0].type === 'list' && args[0].value.length > 0 ? args[0].value[args[0].value.length - 1] : { type: 'nil' });
  b('nth', (args) => {
    const lst = args[0]; const n = (args[1] as any).value;
    return lst.type === 'list' && n < lst.value.length ? lst.value[n] : { type: 'nil' };
  });
  b('length', (args) => ({ type: 'number', value: args[0].type === 'list' ? args[0].value.length : args[0].type === 'string' ? args[0].value.length : 0 }));
  b('append', (args) => ({ type: 'list', value: args.flatMap(a => a.type === 'list' ? a.value : [a]) }));
  b('reverse', (args) => args[0].type === 'list' ? { type: 'list', value: [...args[0].value].reverse() } : args[0]);
  b('sort', (args) => {
    if (args[0].type !== 'list') return args[0];
    return { type: 'list', value: [...args[0].value].sort((a, b) => {
      if (a.type === 'number' && b.type === 'number') return a.value - b.value;
      return lispToString(a).localeCompare(lispToString(b));
    })};
  });
  b('range', (args) => {
    const start = args.length > 1 ? (args[0] as any).value : 0;
    const end = args.length > 1 ? (args[1] as any).value : (args[0] as any).value;
    const step = args.length > 2 ? (args[2] as any).value : 1;
    const result: LispValue[] = [];
    for (let i = start; i < end; i += step) result.push({ type: 'number', value: i });
    return { type: 'list', value: result };
  });
  b('flatten', (args) => {
    function flat(val: LispValue): LispValue[] {
      if (val.type === 'list') return val.value.flatMap(flat);
      return [val];
    }
    return { type: 'list', value: flat(args[0]) };
  });
  b('zip', (args) => {
    if (args.length < 2 || args[0].type !== 'list' || args[1].type !== 'list') throw new Error('zip requires two lists');
    const len = Math.min(args[0].value.length, args[1].value.length);
    const result: LispValue[] = [];
    for (let i = 0; i < len; i++) result.push({ type: 'list', value: [args[0].value[i], args[1].value[i]] });
    return { type: 'list', value: result };
  });

  // String operations
  b('str', (args) => ({ type: 'string', value: args.map(a => a.type === 'string' ? a.value : lispToString(a)).join('') }));
  b('str-split', (args) => ({ type: 'list', value: ((args[0] as any).value as string).split((args[1] as any).value || '').map((s: string) => ({ type: 'string' as const, value: s })) }));
  b('str-join', (args) => ({ type: 'string', value: (args[0].type === 'list' ? args[0].value : []).map(v => v.type === 'string' ? v.value : lispToString(v)).join(args[1] ? (args[1] as any).value : '') }));
  b('str-upper', (args) => ({ type: 'string', value: ((args[0] as any).value as string).toUpperCase() }));
  b('str-lower', (args) => ({ type: 'string', value: ((args[0] as any).value as string).toLowerCase() }));
  b('str-trim', (args) => ({ type: 'string', value: ((args[0] as any).value as string).trim() }));
  b('str-replace', (args) => ({ type: 'string', value: ((args[0] as any).value as string).replace(new RegExp((args[1] as any).value, 'g'), (args[2] as any).value) }));
  b('str-contains', (args) => ({ type: 'bool', value: ((args[0] as any).value as string).includes((args[1] as any).value) }));
  b('str-starts', (args) => ({ type: 'bool', value: ((args[0] as any).value as string).startsWith((args[1] as any).value) }));
  b('str-ends', (args) => ({ type: 'bool', value: ((args[0] as any).value as string).endsWith((args[1] as any).value) }));
  b('substr', (args) => ({ type: 'string', value: ((args[0] as any).value as string).substring((args[1] as any).value, args[2] ? (args[2] as any).value : undefined) }));
  b('char-at', (args) => ({ type: 'string', value: ((args[0] as any).value as string)[(args[1] as any).value] || '' }));
  b('parse-int', (args) => ({ type: 'number', value: parseInt((args[0] as any).value, args[1] ? (args[1] as any).value : 10) || 0 }));
  b('parse-float', (args) => ({ type: 'number', value: parseFloat((args[0] as any).value) || 0 }));
  b('to-string', (args) => ({ type: 'string', value: args[0].type === 'string' ? args[0].value : lispToString(args[0]) }));

  // Type checks
  b('number?', (args) => ({ type: 'bool', value: args[0].type === 'number' }));
  b('string?', (args) => ({ type: 'bool', value: args[0].type === 'string' }));
  b('list?', (args) => ({ type: 'bool', value: args[0].type === 'list' }));
  b('nil?', (args) => ({ type: 'bool', value: args[0].type === 'nil' }));
  b('fn?', (args) => ({ type: 'bool', value: args[0].type === 'fn' || args[0].type === 'builtin' }));
  b('symbol?', (args) => ({ type: 'bool', value: args[0].type === 'symbol' }));
  b('bool?', (args) => ({ type: 'bool', value: args[0].type === 'bool' }));
  b('empty?', (args) => ({ type: 'bool', value: (args[0].type === 'list' && args[0].value.length === 0) || args[0].type === 'nil' }));
  b('type', (args) => ({ type: 'string', value: args[0].type }));

  // I/O
  b('print', (args) => { const s = args.map(a => a.type === 'string' ? a.value : lispToString(a)).join(' '); output.push(s); return { type: 'string', value: s }; });
  b('println', (args) => { const s = args.map(a => a.type === 'string' ? a.value : lispToString(a)).join(' '); output.push(s); return { type: 'string', value: s }; });
  b('format', (args) => {
    let fmt = (args[0] as any).value as string;
    for (let i = 1; i < args.length; i++) {
      fmt = fmt.replace('{}', args[i].type === 'string' ? (args[i] as any).value : lispToString(args[i]));
    }
    return { type: 'string', value: fmt };
  });

  // Hash/Map operations
  b('hash-map', (args) => {
    const result: LispValue[] = [];
    for (let i = 0; i < args.length; i += 2) {
      result.push({ type: 'list', value: [args[i], args[i + 1] || { type: 'nil' }] });
    }
    return { type: 'list', value: result };
  });
  b('hash-get', (args) => {
    if (args[0].type !== 'list') return { type: 'nil' };
    const key = lispToString(args[1]);
    for (const pair of args[0].value) {
      if (pair.type === 'list' && lispToString(pair.value[0]) === key) return pair.value[1];
    }
    return args[2] || { type: 'nil' };
  });
  b('hash-set', (args) => {
    if (args[0].type !== 'list') return { type: 'list', value: [{ type: 'list', value: [args[1], args[2]] }] };
    const key = lispToString(args[1]);
    const newMap = args[0].value.filter((p: LispValue) => p.type === 'list' && lispToString(p.value[0]) !== key);
    newMap.push({ type: 'list', value: [args[1], args[2]] });
    return { type: 'list', value: newMap };
  });
  b('hash-keys', (args) => args[0].type === 'list' ? { type: 'list', value: args[0].value.map((p: any) => p.value[0]) } : { type: 'list', value: [] });

  // Time
  b('now', () => ({ type: 'number', value: Date.now() }));
  b('timestamp', () => ({ type: 'string', value: new Date().toISOString() }));

  // JSON
  b('json-encode', (args) => {
    function toJS(v: LispValue): any {
      if (v.type === 'number') return v.value;
      if (v.type === 'string') return v.value;
      if (v.type === 'bool') return v.value;
      if (v.type === 'nil') return null;
      if (v.type === 'list') return v.value.map(toJS);
      return lispToString(v);
    }
    return { type: 'string', value: JSON.stringify(toJS(args[0])) };
  });
  b('json-decode', (args) => {
    function fromJS(v: any): LispValue {
      if (v === null || v === undefined) return { type: 'nil' };
      if (typeof v === 'number') return { type: 'number', value: v };
      if (typeof v === 'string') return { type: 'string', value: v };
      if (typeof v === 'boolean') return { type: 'bool', value: v };
      if (Array.isArray(v)) return { type: 'list', value: v.map(fromJS) };
      if (typeof v === 'object') return { type: 'list', value: Object.entries(v).map(([k, val]) => ({ type: 'list' as const, value: [{ type: 'string' as const, value: k }, fromJS(val)] })) };
      return { type: 'string', value: String(v) };
    }
    try { return fromJS(JSON.parse((args[0] as any).value)); }
    catch { return { type: 'nil' }; }
  });

  // Functional
  b('compose', (args) => ({
    type: 'builtin', name: 'composed',
    fn: (innerArgs, innerEnv) => {
      let result = applyFn(args[args.length - 1], innerArgs, innerEnv, output);
      for (let i = args.length - 2; i >= 0; i--) {
        result = applyFn(args[i], [result], innerEnv, output);
      }
      return result;
    }
  }));
  b('partial', (args) => ({
    type: 'builtin', name: 'partial',
    fn: (innerArgs) => applyFn(args[0], [...args.slice(1), ...innerArgs], env, output)
  }));
  b('identity', (args) => args[0] || { type: 'nil' });
  b('constantly', (args) => ({ type: 'builtin', name: 'const', fn: () => args[0] }));

  // Bitwise
  b('bit-and', (args) => ({ type: 'number', value: (args[0] as any).value & (args[1] as any).value }));
  b('bit-or', (args) => ({ type: 'number', value: (args[0] as any).value | (args[1] as any).value }));
  b('bit-xor', (args) => ({ type: 'number', value: (args[0] as any).value ^ (args[1] as any).value }));
  b('bit-not', (args) => ({ type: 'number', value: ~(args[0] as any).value }));
  b('bit-shift-left', (args) => ({ type: 'number', value: (args[0] as any).value << (args[1] as any).value }));
  b('bit-shift-right', (args) => ({ type: 'number', value: (args[0] as any).value >> (args[1] as any).value }));

  // Crypto/Encode
  b('base64-encode', (args) => ({ type: 'string', value: btoa((args[0] as any).value) }));
  b('base64-decode', (args) => ({ type: 'string', value: atob((args[0] as any).value) }));
  b('hex-encode', (args) => ({ type: 'string', value: Array.from(new TextEncoder().encode((args[0] as any).value)).map(b => b.toString(16).padStart(2, '0')).join('') }));
  b('to-binary', (args) => ({ type: 'string', value: ((args[0] as any).value >>> 0).toString(2).padStart(args[1] ? (args[1] as any).value : 8, '0') }));
  b('from-binary', (args) => ({ type: 'number', value: parseInt((args[0] as any).value, 2) }));

  // Math constants
  envSet(env, 'PI', { type: 'number', value: Math.PI });
  envSet(env, 'E', { type: 'number', value: Math.E });
  envSet(env, 'INF', { type: 'number', value: Infinity });
  envSet(env, 'NAN', { type: 'number', value: NaN });

  return env;
}

// ==================== LISP ENGINE PUBLIC API ====================

let globalEnv: LispEnv | null = null;
const globalOutput: string[] = [];

export function lispInit(): LispEnv {
  globalOutput.length = 0;
  globalEnv = createStdLib(globalOutput);
  return globalEnv;
}

export function lispEval(source: string, env?: LispEnv): LispResult {
  const output: string[] = [];
  const useEnv = env || globalEnv || createStdLib(output);
  if (!globalEnv) globalEnv = useEnv;
  const start = performance.now();

  try {
    const tokens = tokenize(source);
    const exprs = parse(tokens);
    let result: LispValue = { type: 'nil' };

    for (const expr of exprs) {
      result = evaluate(expr, useEnv, output);
    }

    return {
      value: result,
      output,
      ast: exprs.length === 1 ? exprs[0] : { type: 'list', value: exprs },
      elapsed: performance.now() - start
    };
  } catch (e: any) {
    return {
      value: { type: 'nil' },
      output,
      error: e.message || String(e),
      elapsed: performance.now() - start
    };
  }
}

export function lispParse(source: string): LispResult {
  try {
    const tokens = tokenize(source);
    const exprs = parse(tokens);
    return {
      value: exprs.length === 1 ? exprs[0] : { type: 'list', value: exprs },
      output: [],
      ast: exprs.length === 1 ? exprs[0] : { type: 'list', value: exprs }
    };
  } catch (e: any) {
    return { value: { type: 'nil' }, output: [], error: e.message || String(e) };
  }
}

export function lispMacroExpand(source: string, _env?: LispEnv): string {
  try {
    const tokens = tokenize(source);
    const exprs = parse(tokens);
    return exprs.map(e => lispToString(e)).join('\n');
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
}

export function lispGetEnv(): LispEnv {
  if (!globalEnv) lispInit();
  return globalEnv!;
}

export function lispDefine(name: string, value: LispValue): void {
  if (!globalEnv) lispInit();
  envSet(globalEnv!, name, value);
}

export function lispDefineJs(name: string, fn: (...args: any[]) => any): void {
  if (!globalEnv) lispInit();
  envSet(globalEnv!, name, {
    type: 'builtin', name,
    fn: (args) => {
      const jsArgs = args.map(a => {
        switch (a.type) {
          case 'number': return a.value;
          case 'string': return a.value;
          case 'bool': return a.value;
          case 'nil': return null;
          case 'list': return a.value;
          default: return lispToString(a);
        }
      });
      const result = fn(...jsArgs);
      if (result === null || result === undefined) return { type: 'nil' };
      if (typeof result === 'number') return { type: 'number', value: result };
      if (typeof result === 'string') return { type: 'string', value: result };
      if (typeof result === 'boolean') return { type: 'bool', value: result };
      return { type: 'string', value: String(result) };
    }
  });
}

export function lispReset(): void {
  globalEnv = null;
  globalOutput.length = 0;
}
