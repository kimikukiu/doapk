/**
 * REAL SCAN SERVICE — Performs actual HTTP requests, header analysis,
 * port probing, vulnerability testing, and cloud storage enumeration.
 * No simulations. Every function makes real network calls.
 */

const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

async function fetchWithProxy(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  try {
    // Try direct first
    const directResponse = await fetch(url, { 
      ...options, 
      signal: controller.signal,
      mode: 'cors'
    });
    clearTimeout(timeout);
    return directResponse;
  } catch {
    clearTimeout(timeout);
  }

  // Try with CORS proxies
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxy = CORS_PROXIES[i];
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 10000);
    try {
      const response = await fetch(`${proxy}${encodeURIComponent(url)}`, {
        ...options,
        signal: controller2.signal,
      });
      clearTimeout(timeout2);
      return response;
    } catch {
      clearTimeout(timeout2);
      continue;
    }
  }

  throw new Error(`All connection attempts failed for ${url}`);
}

export interface ProbeResult {
  url: string;
  status: number;
  statusText: string;
  server: string;
  headers: Record<string, string>;
  responseTime: number;
  technologies: string[];
  redirectChain: string[];
  contentType: string;
  contentLength: string;
  error?: string;
}

export interface SecurityHeaderResult {
  url: string;
  headers: {
    name: string;
    value: string | null;
    status: 'secure' | 'warning' | 'critical';
    description: string;
  }[];
  score: number;
  grade: string;
}

export interface PortResult {
  port: number;
  service: string;
  status: 'open' | 'closed' | 'filtered';
  responseTime: number;
}

export interface VulnTestResult {
  type: string;
  parameter: string;
  payload: string;
  statusCode: number;
  responseLength: number;
  responseTime: number;
  indication: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  evidence: string;
}

export interface S3BucketResult {
  bucket: string;
  url: string;
  status: 'public' | 'private' | 'not_found' | 'error';
  statusCode: number;
  objects: string[];
  error?: string;
}

export interface CrawlResult {
  url: string;
  links: string[];
  forms: { action: string; method: string; inputs: string[] }[];
  scripts: string[];
  comments: string[];
}

// ===================== REAL PROBE =====================

export async function probeTarget(targetUrl: string): Promise<ProbeResult> {
  const url = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
  const start = performance.now();
  
  try {
    const response = await fetchWithProxy(url);
    const responseTime = Math.round(performance.now() - start);
    
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const technologies: string[] = [];
    const serverHeader = headers['server'] || headers['Server'] || '';
    const poweredBy = headers['x-powered-by'] || headers['X-Powered-By'] || '';
    
    if (serverHeader) technologies.push(`Server: ${serverHeader}`);
    if (poweredBy) technologies.push(`Runtime: ${poweredBy}`);
    if (headers['x-aspnet-version']) technologies.push(`ASP.NET ${headers['x-aspnet-version']}`);
    if (headers['x-drupal-cache']) technologies.push('Drupal CMS');
    if (headers['x-generator']) technologies.push(`Generator: ${headers['x-generator']}`);
    if (headers['x-shopify-stage']) technologies.push('Shopify');
    if (headers['x-wix-request-id']) technologies.push('Wix');
    if (headers['cf-ray']) technologies.push('Cloudflare CDN');
    if (headers['x-amz-cf-id']) technologies.push('AWS CloudFront');
    if (headers['x-vercel-id']) technologies.push('Vercel');
    if (headers['x-netlify-request-id']) technologies.push('Netlify');

    // Try to detect from body
    try {
      const text = await response.clone().text();
      if (text.includes('wp-content') || text.includes('wp-includes')) technologies.push('WordPress');
      if (text.includes('Joomla')) technologies.push('Joomla');
      if (text.includes('react')) technologies.push('React');
      if (text.includes('next') && text.includes('_next')) technologies.push('Next.js');
      if (text.includes('ng-') || text.includes('angular')) technologies.push('Angular');
      if (text.includes('vue')) technologies.push('Vue.js');
      if (text.includes('laravel')) technologies.push('Laravel');
      if (text.includes('django')) technologies.push('Django');
    } catch {}

    return {
      url,
      status: response.status,
      statusText: response.statusText,
      server: serverHeader,
      headers,
      responseTime,
      technologies,
      redirectChain: response.redirected ? [response.url] : [],
      contentType: headers['content-type'] || 'unknown',
      contentLength: headers['content-length'] || 'unknown',
    };
  } catch (error: any) {
    return {
      url,
      status: 0,
      statusText: 'Connection Failed',
      server: 'unknown',
      headers: {},
      responseTime: Math.round(performance.now() - start),
      technologies: [],
      redirectChain: [],
      contentType: 'unknown',
      contentLength: 'unknown',
      error: error.message,
    };
  }
}

// ===================== SECURITY HEADERS =====================

export async function analyzeSecurityHeaders(targetUrl: string): Promise<SecurityHeaderResult> {
  const url = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
  
  try {
    const response = await fetchWithProxy(url);
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const checks = [
      {
        name: 'Strict-Transport-Security',
        value: headers['strict-transport-security'] || null,
        secure: !!headers['strict-transport-security'],
        description: headers['strict-transport-security'] ? 'HSTS enabled — forces HTTPS' : 'MISSING — vulnerable to SSL stripping attacks'
      },
      {
        name: 'Content-Security-Policy',
        value: headers['content-security-policy'] || null,
        secure: !!headers['content-security-policy'],
        description: headers['content-security-policy'] ? 'CSP present — XSS mitigation active' : 'MISSING — vulnerable to XSS and injection attacks'
      },
      {
        name: 'X-Frame-Options',
        value: headers['x-frame-options'] || null,
        secure: !!headers['x-frame-options'],
        description: headers['x-frame-options'] ? `Clickjacking protection: ${headers['x-frame-options']}` : 'MISSING — vulnerable to clickjacking'
      },
      {
        name: 'X-Content-Type-Options',
        value: headers['x-content-type-options'] || null,
        secure: headers['x-content-type-options'] === 'nosniff',
        description: headers['x-content-type-options'] === 'nosniff' ? 'MIME sniffing disabled' : 'MISSING — vulnerable to MIME type confusion'
      },
      {
        name: 'X-XSS-Protection',
        value: headers['x-xss-protection'] || null,
        secure: !!headers['x-xss-protection'],
        description: headers['x-xss-protection'] ? 'XSS filter enabled' : 'MISSING — browser XSS filter not configured'
      },
      {
        name: 'Referrer-Policy',
        value: headers['referrer-policy'] || null,
        secure: !!headers['referrer-policy'],
        description: headers['referrer-policy'] ? `Referrer policy: ${headers['referrer-policy']}` : 'MISSING — referrer information may leak'
      },
      {
        name: 'Permissions-Policy',
        value: headers['permissions-policy'] || null,
        secure: !!headers['permissions-policy'],
        description: headers['permissions-policy'] ? 'Feature permissions configured' : 'MISSING — browser features unrestricted'
      },
      {
        name: 'Server',
        value: headers['server'] || null,
        secure: !headers['server'],
        description: headers['server'] ? `Server disclosed: ${headers['server']} — information leakage` : 'Server header hidden — good practice'
      },
      {
        name: 'X-Powered-By',
        value: headers['x-powered-by'] || null,
        secure: !headers['x-powered-by'],
        description: headers['x-powered-by'] ? `Technology disclosed: ${headers['x-powered-by']} — information leakage` : 'Technology header hidden — good practice'
      },
      {
        name: 'Set-Cookie (Secure flags)',
        value: headers['set-cookie'] || null,
        secure: !headers['set-cookie'] || (headers['set-cookie'].includes('Secure') && headers['set-cookie'].includes('HttpOnly')),
        description: headers['set-cookie'] 
          ? (headers['set-cookie'].includes('Secure') && headers['set-cookie'].includes('HttpOnly') ? 'Cookie flags properly set' : 'INSECURE cookie flags — missing Secure/HttpOnly')
          : 'No cookies set on this response'
      }
    ];

    const score = Math.round((checks.filter(c => c.secure).length / checks.length) * 100);
    const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : score >= 30 ? 'D' : 'F';

    return {
      url,
      headers: checks.map(c => ({
        name: c.name,
        value: c.value,
        status: c.secure ? 'secure' : (c.name === 'Server' || c.name === 'X-Powered-By' ? 'warning' : 'critical'),
        description: c.description,
      })),
      score,
      grade,
    };
  } catch (error: any) {
    return {
      url,
      headers: [],
      score: 0,
      grade: 'ERR',
    };
  }
}

// ===================== PORT PROBING =====================

export async function probePorts(host: string, ports?: number[]): Promise<PortResult[]> {
  const defaultPorts = ports || [80, 443, 8080, 8443, 3000, 3306, 5432, 6379, 27017, 21, 22, 25, 110, 143, 993, 995, 8888, 9090];
  const results: PortResult[] = [];
  const cleanHost = host.replace(/^https?:\/\//, '').replace(/\/.*$/, '').split(':')[0];

  for (const port of defaultPorts) {
    const start = performance.now();
    const serviceMap: Record<number, string> = {
      21: 'FTP', 22: 'SSH', 25: 'SMTP', 80: 'HTTP', 110: 'POP3', 143: 'IMAP',
      443: 'HTTPS', 993: 'IMAPS', 995: 'POP3S', 3000: 'Node.js/Dev', 3306: 'MySQL',
      5432: 'PostgreSQL', 6379: 'Redis', 8080: 'HTTP-Proxy', 8443: 'HTTPS-Alt',
      8888: 'HTTP-Alt', 9090: 'Management', 27017: 'MongoDB'
    };

    try {
      const protocol = (port === 443 || port === 8443 || port === 993 || port === 995) ? 'https' : 'http';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      await fetch(`${protocol}://${cleanHost}:${port}/`, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors',
      });
      clearTimeout(timeout);
      
      results.push({
        port,
        service: serviceMap[port] || 'Unknown',
        status: 'open',
        responseTime: Math.round(performance.now() - start),
      });
    } catch (error: any) {
      const elapsed = Math.round(performance.now() - start);
      results.push({
        port,
        service: serviceMap[port] || 'Unknown',
        status: elapsed > 2800 ? 'filtered' : 'closed',
        responseTime: elapsed,
      });
    }
  }

  return results;
}

// ===================== VULNERABILITY TESTING =====================

export async function testVulnerabilities(targetUrl: string): Promise<VulnTestResult[]> {
  const url = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
  const results: VulnTestResult[] = [];

  // SQLi test payloads
  const sqliPayloads = [
    { payload: "' OR '1'='1", param: 'id' },
    { payload: "1 UNION SELECT NULL--", param: 'id' },
    { payload: "'; DROP TABLE users--", param: 'search' },
    { payload: "1' AND SLEEP(5)--", param: 'id' },
  ];

  for (const test of sqliPayloads) {
    const testUrl = `${url}?${test.param}=${encodeURIComponent(test.payload)}`;
    const start = performance.now();
    try {
      const response = await fetchWithProxy(testUrl);
      const body = await response.text();
      const responseTime = Math.round(performance.now() - start);
      
      let indication = 'No obvious vulnerability';
      let severity: VulnTestResult['severity'] = 'info';
      let evidence = `Status: ${response.status}, Length: ${body.length}`;

      if (body.toLowerCase().includes('sql syntax') || body.toLowerCase().includes('mysql') || 
          body.toLowerCase().includes('sqlite') || body.toLowerCase().includes('postgresql') ||
          body.toLowerCase().includes('ora-') || body.toLowerCase().includes('unclosed quotation')) {
        indication = 'SQL error message in response — LIKELY VULNERABLE';
        severity = 'critical';
        evidence = body.substring(0, 500);
      } else if (response.status === 500) {
        indication = 'Internal Server Error — possible injection point';
        severity = 'high';
      } else if (responseTime > 5000 && test.payload.includes('SLEEP')) {
        indication = 'Delayed response — possible time-based blind SQLi';
        severity = 'critical';
      }

      results.push({
        type: 'SQL Injection',
        parameter: test.param,
        payload: test.payload,
        statusCode: response.status,
        responseLength: body.length,
        responseTime,
        indication,
        severity,
        evidence,
      });
    } catch (error: any) {
      results.push({
        type: 'SQL Injection',
        parameter: test.param,
        payload: test.payload,
        statusCode: 0,
        responseLength: 0,
        responseTime: Math.round(performance.now() - start),
        indication: `Connection error: ${error.message}`,
        severity: 'info',
        evidence: error.message,
      });
    }
  }

  // XSS test payloads
  const xssPayloads = [
    { payload: '<script>alert(1)</script>', param: 'q' },
    { payload: '"><img src=x onerror=alert(1)>', param: 'search' },
    { payload: "javascript:alert(1)//", param: 'url' },
  ];

  for (const test of xssPayloads) {
    const testUrl = `${url}?${test.param}=${encodeURIComponent(test.payload)}`;
    const start = performance.now();
    try {
      const response = await fetchWithProxy(testUrl);
      const body = await response.text();
      const responseTime = Math.round(performance.now() - start);
      
      let indication = 'Payload not reflected';
      let severity: VulnTestResult['severity'] = 'info';
      let evidence = `Status: ${response.status}`;

      if (body.includes(test.payload)) {
        indication = 'Payload reflected unescaped — LIKELY VULNERABLE TO XSS';
        severity = 'critical';
        evidence = `Payload found in response body at position ${body.indexOf(test.payload)}`;
      } else if (body.includes(test.payload.replace(/</g, '&lt;'))) {
        indication = 'Payload reflected but HTML-encoded — properly sanitized';
        severity = 'info';
      }

      results.push({
        type: 'Cross-Site Scripting (XSS)',
        parameter: test.param,
        payload: test.payload,
        statusCode: response.status,
        responseLength: body.length,
        responseTime,
        indication,
        severity,
        evidence,
      });
    } catch (error: any) {
      results.push({
        type: 'Cross-Site Scripting (XSS)',
        parameter: test.param,
        payload: test.payload,
        statusCode: 0,
        responseLength: 0,
        responseTime: Math.round(performance.now() - start),
        indication: `Connection error: ${error.message}`,
        severity: 'info',
        evidence: error.message,
      });
    }
  }

  // Directory traversal
  const traversalPayloads = ['../../../etc/passwd', '..\\..\\..\\windows\\system32\\config\\sam'];
  for (const payload of traversalPayloads) {
    const testUrl = `${url}/${encodeURIComponent(payload)}`;
    const start = performance.now();
    try {
      const response = await fetchWithProxy(testUrl);
      const body = await response.text();
      const responseTime = Math.round(performance.now() - start);
      
      let indication = 'Path traversal blocked';
      let severity: VulnTestResult['severity'] = 'info';

      if (body.includes('root:') && body.includes('/bin/')) {
        indication = 'CRITICAL: /etc/passwd contents exposed';
        severity = 'critical';
      }

      results.push({
        type: 'Path Traversal',
        parameter: 'path',
        payload,
        statusCode: response.status,
        responseLength: body.length,
        responseTime,
        indication,
        severity,
        evidence: `Status: ${response.status}`,
      });
    } catch {}
  }

  return results;
}

// ===================== DIRECTORY BRUTEFORCE =====================

export async function bruteforceDirectories(targetUrl: string, onFound?: (path: string, status: number) => void): Promise<{ path: string; status: number; size: number }[]> {
  const url = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
  const paths = [
    '/admin', '/login', '/dashboard', '/wp-admin', '/wp-login.php', '/administrator',
    '/phpmyadmin', '/cpanel', '/.env', '/.git/HEAD', '/.git/config', '/robots.txt',
    '/sitemap.xml', '/backup', '/backup.sql', '/backup.zip', '/config.php',
    '/wp-config.php.bak', '/api', '/api/v1', '/swagger', '/swagger-ui.html',
    '/graphql', '/.well-known/security.txt', '/server-status', '/server-info',
    '/.htaccess', '/web.config', '/crossdomain.xml', '/debug', '/trace',
    '/test', '/staging', '/dev', '/.DS_Store', '/package.json', '/composer.json',
  ];

  const results: { path: string; status: number; size: number }[] = [];

  for (const path of paths) {
    try {
      const response = await fetchWithProxy(`${url}${path}`);
      const body = await response.text();
      
      if (response.status !== 404 && response.status !== 0) {
        const result = { path, status: response.status, size: body.length };
        results.push(result);
        onFound?.(path, response.status);
      }
    } catch {}
  }

  return results;
}

// ===================== S3 BUCKET ENUMERATION =====================

export async function scanS3Buckets(keyword: string, onFound?: (bucket: string, status: string) => void): Promise<S3BucketResult[]> {
  const permutations = [
    keyword, `${keyword}-dev`, `${keyword}-prod`, `${keyword}-staging`,
    `${keyword}-assets`, `${keyword}-public`, `${keyword}-backup`,
    `${keyword}-media`, `${keyword}-uploads`, `${keyword}-static`,
    `dev-${keyword}`, `prod-${keyword}`, `staging-${keyword}`,
    `${keyword}-data`, `${keyword}-logs`, `${keyword}-config`,
    `${keyword}-files`, `${keyword}-storage`, `${keyword}-cdn`,
    `${keyword}-archive`, `${keyword}-db`, `${keyword}-internal`,
  ];

  const results: S3BucketResult[] = [];

  for (const bucket of permutations) {
    const bucketUrl = `https://${bucket}.s3.amazonaws.com/`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(bucketUrl, { signal: controller.signal });
      clearTimeout(timeout);
      
      const body = await response.text();
      let status: S3BucketResult['status'] = 'not_found';
      const objects: string[] = [];

      if (response.status === 200) {
        status = 'public';
        // Parse XML listing
        const keyMatches = body.match(/<Key>([^<]+)<\/Key>/g);
        if (keyMatches) {
          keyMatches.forEach(m => {
            const key = m.replace(/<Key>|<\/Key>/g, '');
            objects.push(key);
          });
        }
        onFound?.(bucket, 'PUBLIC');
      } else if (response.status === 403) {
        status = 'private';
        onFound?.(bucket, 'PRIVATE (exists but access denied)');
      } else if (response.status === 404) {
        status = 'not_found';
      }

      results.push({
        bucket,
        url: bucketUrl,
        status,
        statusCode: response.status,
        objects,
      });
    } catch (error: any) {
      results.push({
        bucket,
        url: bucketUrl,
        status: 'error',
        statusCode: 0,
        objects: [],
        error: error.message,
      });
    }
  }

  return results;
}

// ===================== CRAWL =====================

export async function crawlTarget(targetUrl: string): Promise<CrawlResult> {
  const url = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
  
  try {
    const response = await fetchWithProxy(url);
    const html = await response.text();
    
    // Extract links
    const linkRegex = /href=["']([^"']+)["']/gi;
    const links: string[] = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      links.push(match[1]);
    }

    // Extract forms
    const formRegex = /<form[^>]*action=["']([^"']*)["'][^>]*method=["']([^"']*)["'][^>]*>([\s\S]*?)<\/form>/gi;
    const forms: CrawlResult['forms'] = [];
    while ((match = formRegex.exec(html)) !== null) {
      const inputRegex = /name=["']([^"']+)["']/gi;
      const inputs: string[] = [];
      let inputMatch;
      while ((inputMatch = inputRegex.exec(match[3])) !== null) {
        inputs.push(inputMatch[1]);
      }
      forms.push({ action: match[1], method: match[2], inputs });
    }

    // Extract script sources
    const scriptRegex = /src=["']([^"']*\.js[^"']*)["']/gi;
    const scripts: string[] = [];
    while ((match = scriptRegex.exec(html)) !== null) {
      scripts.push(match[1]);
    }

    // Extract HTML comments
    const commentRegex = /<!--([\s\S]*?)-->/g;
    const comments: string[] = [];
    while ((match = commentRegex.exec(html)) !== null) {
      const comment = match[1].trim();
      if (comment.length > 5 && comment.length < 500) {
        comments.push(comment);
      }
    }

    return { url, links: [...new Set(links)], forms, scripts: [...new Set(scripts)], comments };
  } catch (error: any) {
    return { url, links: [], forms: [], scripts: [], comments: [] };
  }
}

// ===================== WHOIS / DNS =====================

export async function dnsLookup(domain: string): Promise<{ records: Record<string, string[]>; ip: string }> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').split(':')[0];
  try {
    const response = await fetch(`https://dns.google/resolve?name=${cleanDomain}&type=A`);
    const data = await response.json();
    const ip = data.Answer?.[0]?.data || 'unknown';
    
    const records: Record<string, string[]> = { A: [], MX: [], NS: [], TXT: [], CNAME: [] };
    
    for (const type of ['A', 'MX', 'NS', 'TXT', 'CNAME']) {
      try {
        const res = await fetch(`https://dns.google/resolve?name=${cleanDomain}&type=${type}`);
        const d = await res.json();
        records[type] = (d.Answer || []).map((a: any) => a.data);
      } catch {}
    }

    return { records, ip };
  } catch {
    return { records: {}, ip: 'unknown' };
  }
}

export default {
  probeTarget,
  analyzeSecurityHeaders,
  probePorts,
  testVulnerabilities,
  bruteforceDirectories,
  scanS3Buckets,
  crawlTarget,
  dnsLookup,
};
