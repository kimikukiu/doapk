// File Discovery and Extraction Service
// Handles directory listing analysis and file extraction

export interface DiscoveredFile {
  name: string;
  path: string;
  size?: string;
  type: 'file' | 'directory' | 'archive' | 'config' | 'database' | 'log' | 'backup' | 'unknown';
  lastModified?: string;
  permissions?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  extractionMethods: string[];
}

export interface DirectoryListing {
  url: string;
  title: string;
  files: DiscoveredFile[];
  serverInfo?: {
    software: string;
    version: string;
    headers: Record<string, string>;
  };
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface ExtractionResult {
  file: DiscoveredFile;
  content: string;
  method: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export class FileDiscoveryService {
  private listings: DirectoryListing[] = [];
  private extractions: ExtractionResult[] = [];

  // Parse directory listing HTML
  parseDirectoryListing(html: string, baseUrl: string): DirectoryListing {
    const files: DiscoveredFile[] = [];
    
    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'Directory Listing';
    
    // Extract server info from headers (simulated)
    const serverInfo = {
      software: 'Apache/2.4.41',
      version: '2.4.41',
      headers: this.extractHeadersFromHtml(html)
    };

    // Parse file listings
    const filePattern = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    let match;
    
    while ((match = filePattern.exec(html)) !== null) {
      const href = match[1];
      const name = match[2].trim();
      
      // Skip navigation links
      if (href === '../' || href === './' || href.startsWith('?')) continue;
      
      const file = this.analyzeFile(href, name, baseUrl);
      files.push(file);
    }

    return {
      url: baseUrl,
      title,
      files,
      serverInfo,
      timestamp: new Date(),
      success: true
    };
  }

  // Analyze individual file
  private analyzeFile(href: string, name: string, baseUrl: string): DiscoveredFile {
    const fullPath = baseUrl.endsWith('/') ? baseUrl + href : `${baseUrl}/${href}`;
    const extension = name.split('.').pop()?.toLowerCase();
    
    let type: DiscoveredFile['type'] = 'unknown';
    let riskLevel: DiscoveredFile['riskLevel'] = 'low';
    let description = '';
    let extractionMethods: string[] = [];

    // Determine file type and risk
    switch (extension) {
      case 'zip':
      case 'tar':
      case 'gz':
      case 'rar':
      case '7z':
        type = 'archive';
        riskLevel = 'high';
        description = 'Compressed archive - may contain sensitive data';
        extractionMethods = ['direct_download', 'extract_archive'];
        break;
        
      case 'bak':
      case 'backup':
      case 'old':
      case 'orig':
        type = 'backup';
        riskLevel = 'critical';
        description = 'Backup file - likely contains credentials or configuration';
        extractionMethods = ['direct_download', 'analyze_config'];
        break;
        
      case 'conf':
      case 'config':
      case 'cfg':
      case 'ini':
      case 'env':
      case 'yml':
      case 'yaml':
      case 'json':
        type = 'config';
        riskLevel = 'high';
        description = 'Configuration file - may contain credentials';
        extractionMethods = ['direct_download', 'extract_config'];
        break;
        
      case 'sql':
      case 'db':
      case 'sqlite':
      case 'mdb':
        type = 'database';
        riskLevel = 'critical';
        description = 'Database file - contains user data and credentials';
        extractionMethods = ['direct_download', 'analyze_database'];
        break;
        
      case 'log':
      case 'out':
      case 'err':
        type = 'log';
        riskLevel = 'medium';
        description = 'Log file - may contain sensitive information';
        extractionMethods = ['direct_download', 'analyze_logs'];
        break;
        
      case 'csv':
      case 'xls':
      case 'xlsx':
        type = 'file';
        riskLevel = 'high';
        description = 'Data file - may contain sensitive information';
        extractionMethods = ['direct_download', 'analyze_data'];
        break;
        
      case 'php':
      case 'js':
      case 'py':
      case 'sh':
      case 'bat':
        type = 'file';
        riskLevel = 'medium';
        description = 'Script file - may contain credentials';
        extractionMethods = ['direct_download', 'analyze_source'];
        break;
        
      case 'txt':
      case 'md':
        type = 'file';
        riskLevel = 'low';
        description = 'Text file - content unknown';
        extractionMethods = ['direct_download'];
        break;
        
      default:
        if (name.includes('backup') || name.includes('config') || name.includes('secret')) {
          riskLevel = 'high';
          description = 'File name suggests sensitive content';
        } else {
          description = 'Unknown file type';
        }
        extractionMethods = ['direct_download'];
        break;
    }

    // Special handling for specific file names
    if (name.toLowerCase().includes('users') || name.toLowerCase().includes('password') || name.toLowerCase().includes('admin')) {
      riskLevel = 'critical';
      description = 'File name suggests user credentials or admin data';
    }

    return {
      name,
      path: fullPath,
      type,
      riskLevel,
      description,
      extractionMethods
    };
  }

  // Extract file content
  async extractFile(file: DiscoveredFile, method: string = 'direct_download'): Promise<ExtractionResult> {
    try {
      let content = '';
      
      switch (method) {
        case 'direct_download':
          content = await this.downloadFile(file.path);
          break;
        case 'analyze_config':
          content = await this.analyzeConfigFile(file);
          break;
        case 'extract_archive':
          content = await this.extractArchiveInfo(file);
          break;
        default:
          content = await this.downloadFile(file.path);
      }

      const result: ExtractionResult = {
        file,
        content,
        method,
        timestamp: new Date(),
        success: true
      };

      this.extractions.push(result);
      return result;

    } catch (error: any) {
      const result: ExtractionResult = {
        file,
        content: '',
        method,
        timestamp: new Date(),
        success: false,
        error: error.message
      };

      this.extractions.push(result);
      return result;
    }
  }

  // Download file content
  private async downloadFile(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      throw new Error(`Failed to download file: ${error}`);
    }
  }

  // Analyze configuration file
  private async analyzeConfigFile(file: DiscoveredFile): Promise<string> {
    const content = await this.downloadFile(file.path);
    
    // Extract potential credentials
    const patterns = {
      passwords: /password\s*[:=]\s*['"]?([^'"\s]+)/gi,
      apiKeys: /api[_-]?key\s*[:=]\s*['"]?([^'"\s]+)/gi,
      secrets: /secret\s*[:=]\s*['"]?([^'"\s]+)/gi,
      tokens: /token\s*[:=]\s*['"]?([^'"\s]+)/gi,
      databases: /database[_-]?url?\s*[:=]\s*['"]?([^'"\s]+)/gi
    };

    const findings: string[] = [];
    findings.push('=== CONFIGURATION ANALYSIS ===');
    findings.push(`File: ${file.name}`);
    findings.push(`Size: ${content.length} bytes`);
    findings.push('');

    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = content.match(pattern);
      if (matches) {
        findings.push(`[${type.toUpperCase()}] Found ${matches.length} potential ${type}:`);
        matches.forEach(match => {
          const value = match.split(/[:=]/)[1]?.trim().replace(/['"]/g, '') || '';
          findings.push(`  - ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
        });
        findings.push('');
      }
    });

    // Check for suspicious content
    const suspiciousPatterns = [
      /admin/i,
      /root/i,
      /sudo/i,
      /privilege/i,
      /credential/i,
      /auth/i
    ];

    const suspiciousMatches = suspiciousPatterns.filter(pattern => content.match(pattern));
    if (suspiciousMatches.length > 0) {
      findings.push('[SUSPICIOUS CONTENT] Found potentially sensitive content:');
      suspiciousMatches.forEach(pattern => {
        findings.push(`  - ${pattern.source}`);
      });
    }

    return findings.join('\n');
  }

  // Extract archive information
  private async extractArchiveInfo(file: DiscoveredFile): Promise<string> {
    const content = await this.downloadFile(file.path);
    
    return `=== ARCHIVE ANALYSIS ===
File: ${file.name}
Size: ${content.length} bytes
Type: Archive file

Note: This is a binary archive file. Full extraction requires:
- Local download and extraction with appropriate tools
- Analysis of extracted contents for sensitive data

Recommendations:
- Download the archive for offline analysis
- Check for configuration files, databases, or credentials
- Verify file integrity before extraction`;
  }

  // Generate extraction commands
  generateExtractionCommands(file: DiscoveredFile): string[] {
    const commands: string[] = [];
    
    switch (file.type) {
      case 'archive':
        commands.push(
          `# Download archive`,
          `wget "${file.path}" -O "${file.name}"`,
          `# Extract archive`,
          `unzip "${file.name}" -d extracted_${file.name}`,
          `# Or for tar.gz:`,
          `tar -xzf "${file.name}"`,
          `# Analyze contents`,
          `ls -la extracted_${file.name}/`,
          `find extracted_${file.name}/ -name "*.conf" -o -name "*.db" -o -name "*password*"`
        );
        break;
        
      case 'config':
        commands.push(
          `# Download config file`,
          `wget "${file.path}" -O "${file.name}"`,
          `# Analyze for credentials`,
          `grep -i "password\\|key\\|secret\\|token" "${file.name}"`,
          `# Extract potential credentials`,
          `strings "${file.name}" | grep -E "(password|key|secret|token)"`
        );
        break;
        
      case 'database':
        commands.push(
          `# Download database`,
          `wget "${file.path}" -O "${file.name}"`,
          `# For SQLite:`,
          `sqlite3 "${file.name}" ".tables"`,
          `sqlite3 "${file.name}" "SELECT * FROM users LIMIT 10;"`,
          `# For MySQL dump:`,
          `mysql -u root -p < "${file.name}"`
        );
        break;
        
      default:
        commands.push(
          `# Download file`,
          `wget "${file.path}" -O "${file.name}"`,
          `# View content`,
          `cat "${file.name}"`,
          `# Or with syntax highlighting`,
          `bat "${file.name}"`
        );
    }
    
    return commands;
  }

  // Get all listings
  getListings(): DirectoryListing[] {
    return this.listings;
  }

  // Get all extractions
  getExtractions(): ExtractionResult[] {
    return this.extractions;
  }

  // Add directory listing
  addListing(listing: DirectoryListing): void {
    this.listings.push(listing);
  }

  // Get risk summary
  getRiskSummary(): {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  } {
    const allFiles = this.listings.flatMap(listing => listing.files);
    
    return {
      total: allFiles.length,
      critical: allFiles.filter(f => f.riskLevel === 'critical').length,
      high: allFiles.filter(f => f.riskLevel === 'high').length,
      medium: allFiles.filter(f => f.riskLevel === 'medium').length,
      low: allFiles.filter(f => f.riskLevel === 'low').length
    };
  }

  // Export data
  exportData(): string {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      listings: this.listings,
      extractions: this.extractions,
      riskSummary: this.getRiskSummary()
    }, null, 2);
  }

  // Clear data
  clearData(): void {
    this.listings = [];
    this.extractions = [];
  }

  private extractHeadersFromHtml(html: string): Record<string, string> {
    // This would normally come from HTTP headers, but we'll simulate
    const headers: Record<string, string> = {
      'Server': 'Apache/2.4.41',
      'Content-Type': 'text/html; charset=UTF-8',
      'Accept-Ranges': 'bytes'
    };
    
    // Try to extract server from HTML meta tags if available
    const serverMatch = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i);
    if (serverMatch) {
      headers['Generator'] = serverMatch[1];
    }
    
    return headers;
  }
}

// Singleton instance
export const fileDiscoveryService = new FileDiscoveryService();
