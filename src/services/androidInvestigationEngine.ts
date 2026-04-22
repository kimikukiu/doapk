// Android Investigation Engine — Mobile forensics and investigation system
// Ported from kimikukiu/android-investigation-core

export interface AndroidDevice {
  id: string;
  deviceId: string;
  model: string;
  osVersion: string;
  status: 'online' | 'offline' | 'compromised';
  lastSeen: Date;
  location?: LocationData;
  apps: InstalledApp[];
  permissions: AppPermission[];
  metadata: Record<string, any>;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  source: 'gps' | 'network' | 'passive';
}

export interface InstalledApp {
  packageName: string;
  appName: string;
  version: string;
  installDate: Date;
  lastUsed?: Date;
  permissions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  category: 'system' | 'user' | 'malicious' | 'suspicious';
}

export interface AppPermission {
  name: string;
  granted: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface ForensicArtifact {
  id: string;
  deviceId: string;
  type: 'call_log' | 'sms' | 'browser_history' | 'location' | 'app_data' | 'media';
  timestamp: Date;
  content: any;
  metadata: Record<string, any>;
}

export interface SecurityAlert {
  id: string;
  deviceId: string;
  type: 'malware_detected' | 'suspicious_app' | 'unauthorized_access' | 'data_exfiltration' | 'location_tracking';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  evidence: any;
  timestamp: Date;
}

export class AndroidInvestigationEngine {
  private devices: Map<string, AndroidDevice> = new Map();
  private artifacts: ForensicArtifact[] = [];
  private alerts: SecurityAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDemoDevices();
  }

  private initializeDemoDevices(): void {
    const demoDevices: AndroidDevice[] = [
      {
        id: 'dev_001',
        deviceId: 'android-1234567890abcdef',
        model: 'Samsung Galaxy S23',
        osVersion: 'Android 13',
        status: 'online',
        lastSeen: new Date(),
        location: {
          latitude: 44.4268,
          longitude: 26.1025,
          accuracy: 10,
          timestamp: new Date(),
          source: 'gps'
        },
        apps: [],
        permissions: [],
        metadata: {
          owner: 'Target Alpha',
          department: 'Executive'
        }
      },
      {
        id: 'dev_002',
        deviceId: 'android-0987654321fedcba',
        model: 'Google Pixel 7',
        osVersion: 'Android 14',
        status: 'compromised',
        lastSeen: new Date(Date.now() - 5 * 60 * 1000),
        location: {
          latitude: 44.4397,
          longitude: 26.0973,
          accuracy: 15,
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          source: 'network'
        },
        apps: [],
        permissions: [],
        metadata: {
          owner: 'Target Beta',
          department: 'Finance'
        }
      }
    ];

    demoDevices.forEach(device => {
      this.devices.set(device.id, device);
      this.generateDemoApps(device);
      this.generateDemoPermissions(device);
    });
  }

  private generateDemoApps(device: AndroidDevice): void {
    const suspiciousApps = [
      { pkg: 'com.spyware.hidden', name: 'System Service', risk: 'critical' as const, cat: 'malicious' as const },
      { pkg: 'com.track.location', name: 'Location Tracker', risk: 'high' as const, cat: 'suspicious' as const },
      { pkg: 'com.data.stealer', name: 'File Manager', risk: 'high' as const, cat: 'suspicious' as const },
      { pkg: 'com.facebook.katana', name: 'Facebook', risk: 'medium' as const, cat: 'user' as const },
      { pkg: 'com.whatsapp', name: 'WhatsApp', risk: 'medium' as const, cat: 'user' as const },
      { pkg: 'android.shell', name: 'Shell', risk: 'low' as const, cat: 'system' as const }
    ];

    device.apps = suspiciousApps.map(app => ({
      packageName: app.pkg,
      appName: app.name,
      version: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}`,
      installDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      permissions: this.generateAppPermissions(app.risk),
      riskLevel: app.risk,
      category: app.cat
    }));
  }

  private generateAppPermissions(riskLevel: 'low' | 'medium' | 'high' | 'critical'): string[] {
    const permissions = {
      low: ['android.permission.INTERNET', 'android.permission.VIBRATE'],
      medium: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO'],
      high: ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.READ_CONTACTS'],
      critical: ['android.permission.SYSTEM_ALERT_WINDOW', 'android.permission.WRITE_SECURE_SETTINGS']
    };
    return permissions[riskLevel] || [];
  }

  private generateDemoPermissions(device: AndroidDevice): void {
    const criticalPerms = [
      { name: 'android.permission.ACCESS_FINE_LOCATION', granted: true, riskLevel: 'high' as const, description: 'Access precise location' },
      { name: 'android.permission.CAMERA', granted: true, riskLevel: 'medium' as const, description: 'Access camera' },
      { name: 'android.permission.RECORD_AUDIO', granted: true, riskLevel: 'medium' as const, description: 'Record audio' },
      { name: 'android.permission.READ_CONTACTS', granted: true, riskLevel: 'high' as const, description: 'Read contacts' },
      { name: 'android.permission.SYSTEM_ALERT_WINDOW', granted: false, riskLevel: 'critical' as const, description: 'Draw over other apps' }
    ];

    device.permissions = criticalPerms;
  }

  // Device Management
  addDevice(device: Omit<AndroidDevice, 'id' | 'lastSeen'>): string {
    const id = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullDevice: AndroidDevice = {
      ...device,
      id,
      lastSeen: new Date()
    };
    this.devices.set(id, fullDevice);
    return id;
  }

  updateDevice(id: string, updates: Partial<AndroidDevice>): boolean {
    const device = this.devices.get(id);
    if (!device) return false;
    
    this.devices.set(id, {
      ...device,
      ...updates,
      lastSeen: new Date()
    });
    return true;
  }

  getDevice(id: string): AndroidDevice | undefined {
    return this.devices.get(id);
  }

  getAllDevices(): AndroidDevice[] {
    return Array.from(this.devices.values());
  }

  getDevicesByStatus(status: AndroidDevice['status']): AndroidDevice[] {
    return this.getAllDevices().filter(d => d.status === status);
  }

  // Forensic Artifacts
  addArtifact(artifact: Omit<ForensicArtifact, 'id'>): string {
    const id = `art_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullArtifact: ForensicArtifact = { ...artifact, id };
    this.artifacts.unshift(fullArtifact);
    return id;
  }

  getArtifacts(deviceId?: string, type?: ForensicArtifact['type']): ForensicArtifact[] {
    return this.artifacts.filter(a => 
      (!deviceId || a.deviceId === deviceId) && 
      (!type || a.type === type)
    );
  }

  // Security Alerts
  addAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp'>): string {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullAlert: SecurityAlert = { ...alert, id, timestamp: new Date() };
    this.alerts.unshift(fullAlert);
    return id;
  }

  getAlerts(deviceId?: string, severity?: SecurityAlert['severity']): SecurityAlert[] {
    return this.alerts.filter(a => 
      (!deviceId || a.deviceId === deviceId) && 
      (!severity || a.severity === severity)
    );
  }

  // Monitoring System
  startMonitoring(intervalMinutes: number = 5): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performDeviceCheck();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`[ANDROID] Monitoring started - checking every ${intervalMinutes} minutes`);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('[ANDROID] Monitoring stopped');
  }

  private performDeviceCheck(): void {
    const devices = this.getAllDevices();
    
    devices.forEach(device => {
      // Simulate device checks
      const checkType = Math.random();
      
      if (checkType < 0.2 && device.status === 'online') {
        // Device went offline
        this.updateDevice(device.id, { status: 'offline' });
        this.addAlert({
          deviceId: device.id,
          type: 'unauthorized_access',
          severity: 'warning',
          title: 'Device Offline',
          description: `Device ${device.model} went offline unexpectedly`,
          evidence: { lastSeen: device.lastSeen }
        });
      } else if (checkType < 0.4 && device.status === 'offline') {
        // Device came back online
        this.updateDevice(device.id, { status: 'online' });
        this.addAlert({
          deviceId: device.id,
          type: 'unauthorized_access',
          severity: 'info',
          title: 'Device Online',
          description: `Device ${device.model} is back online`,
          evidence: { lastSeen: new Date() }
        });
      } else if (checkType < 0.6) {
        // Location update
        if (device.location) {
          const newLocation = {
            ...device.location,
            latitude: device.location.latitude + (Math.random() - 0.5) * 0.01,
            longitude: device.location.longitude + (Math.random() - 0.5) * 0.01,
            timestamp: new Date()
          };
          this.updateDevice(device.id, { location: newLocation });
        }
      }
    });
  }

  // Analysis Functions
  analyzeDeviceSecurity(deviceId: string): any {
    const device = this.getDevice(deviceId);
    if (!device) return null;

    const criticalApps = device.apps.filter(a => a.riskLevel === 'critical').length;
    const suspiciousApps = device.apps.filter(a => a.category === 'suspicious' || a.category === 'malicious').length;
    const highRiskPermissions = device.permissions.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length;
    const recentAlerts = this.getAlerts(deviceId, 'critical').filter(a => 
      (Date.now() - a.timestamp.getTime()) < 24 * 60 * 60 * 1000
    ).length;

    const riskScore = Math.min(100, 
      (criticalApps * 25) + 
      (suspiciousApps * 15) + 
      (highRiskPermissions * 10) + 
      (recentAlerts * 30)
    );

    return {
      device,
      riskScore,
      riskFactors: {
        criticalApps,
        suspiciousApps,
        highRiskPermissions,
        recentAlerts
      },
      recommendations: this.generateRecommendations(riskScore, {
        criticalApps,
        suspiciousApps,
        highRiskPermissions
      })
    };
  }

  private generateRecommendations(score: number, factors: any): string[] {
    const recommendations: string[] = [];
    
    if (factors.criticalApps > 0) {
      recommendations.push('Immediately uninstall critical risk applications');
    }
    
    if (factors.suspiciousApps > 2) {
      recommendations.push('Review and remove suspicious applications');
    }
    
    if (factors.highRiskPermissions > 5) {
      recommendations.push('Review and revoke unnecessary high-risk permissions');
    }
    
    if (score > 70) {
      recommendations.push('Consider device wipe and reinstallation');
    } else if (score > 40) {
      recommendations.push('Implement additional security monitoring');
    }
    
    return recommendations;
  }

  // Data Export
  exportDeviceData(deviceId: string): string {
    const device = this.getDevice(deviceId);
    if (!device) return '{}';

    const artifacts = this.getArtifacts(deviceId);
    const alerts = this.getAlerts(deviceId);
    const analysis = this.analyzeDeviceSecurity(deviceId);

    const data = {
      device,
      artifacts,
      alerts,
      analysis,
      exportDate: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }

  // Statistics
  getStatistics(): any {
    const devices = this.getAllDevices();
    const artifacts = this.artifacts;
    const alerts = this.alerts;

    return {
      devices: {
        total: devices.length,
        online: devices.filter(d => d.status === 'online').length,
        offline: devices.filter(d => d.status === 'offline').length,
        compromised: devices.filter(d => d.status === 'compromised').length
      },
      artifacts: {
        total: artifacts.length,
        byType: artifacts.reduce((acc, a) => {
          acc[a.type] = (acc[a.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      alerts: {
        total: alerts.length,
        bySeverity: alerts.reduce((acc, a) => {
          acc[a.severity] = (acc[a.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        last24h: alerts.filter(a => 
          (Date.now() - a.timestamp.getTime()) < 24 * 60 * 60 * 1000
        ).length
      },
      monitoring: {
        active: this.isMonitoring
      }
    };
  }
}

// Singleton instance
export const androidEngine = new AndroidInvestigationEngine();
