// OSINT Investigation Engine — Advanced Open-Source Intelligence system
// Ported and enhanced from kimikukiu/investigation-core-ai-system

export interface Subject {
  id: string;
  name: string;
  type: 'person' | 'organization' | 'location' | 'financial';
  status: 'active' | 'inactive' | 'monitoring';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdate: Date;
  metadata: Record<string, any>;
}

export interface InvestigationReport {
  id: string;
  subjectId: string;
  title: string;
  summary: string;
  findings: Finding[];
  evidence: Evidence[];
  riskScore: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'in_progress' | 'completed';
}

export interface Finding {
  id: string;
  category: 'financial' | 'social' | 'network' | 'legal' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  verified: boolean;
}

export interface Evidence {
  id: string;
  type: 'document' | 'image' | 'audio' | 'video' | 'data';
  title: string;
  description: string;
  url?: string;
  content?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface MonitoringAlert {
  id: string;
  subjectId: string;
  type: 'new_connection' | 'financial_activity' | 'social_change' | 'legal_update';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  data: any;
  timestamp: Date;
}

export class OSINTInvestigationEngine {
  private subjects: Map<string, Subject> = new Map();
  private reports: Map<string, InvestigationReport> = new Map();
  private alerts: MonitoringAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultSubjects();
  }

  private initializeDefaultSubjects(): void {
    // Initialize with some default investigation subjects
    const defaultSubjects: Subject[] = [
      {
        id: 'sub_001',
        name: 'Emil Boc',
        type: 'person',
        status: 'active',
        riskLevel: 'high',
        lastUpdate: new Date(),
        metadata: {
          position: 'Mayor of Cluj-Napoca',
          party: 'PNL',
          region: 'Cluj County'
        }
      },
      {
        id: 'sub_002',
        name: 'Mugur Isărescu',
        type: 'person',
        status: 'active',
        riskLevel: 'critical',
        lastUpdate: new Date(),
        metadata: {
          position: 'Governor of National Bank of Romania',
          institution: 'BNR'
        }
      },
      {
        id: 'sub_003',
        name: 'Nicușor Dan',
        type: 'person',
        status: 'active',
        riskLevel: 'medium',
        lastUpdate: new Date(),
        metadata: {
          position: 'General Mayor of Bucharest',
          party: 'USR'
        }
      }
    ];

    defaultSubjects.forEach(subject => {
      this.subjects.set(subject.id, subject);
    });
  }

  // Subject Management
  addSubject(subject: Omit<Subject, 'id' | 'lastUpdate'>): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullSubject: Subject = {
      ...subject,
      id,
      lastUpdate: new Date()
    };
    this.subjects.set(id, fullSubject);
    return id;
  }

  updateSubject(id: string, updates: Partial<Subject>): boolean {
    const subject = this.subjects.get(id);
    if (!subject) return false;
    
    this.subjects.set(id, {
      ...subject,
      ...updates,
      lastUpdate: new Date()
    });
    return true;
  }

  getSubject(id: string): Subject | undefined {
    return this.subjects.get(id);
  }

  getAllSubjects(): Subject[] {
    return Array.from(this.subjects.values());
  }

  getSubjectsByType(type: Subject['type']): Subject[] {
    return this.getAllSubjects().filter(s => s.type === type);
  }

  getSubjectsByRiskLevel(riskLevel: Subject['riskLevel']): Subject[] {
    return this.getAllSubjects().filter(s => s.riskLevel === riskLevel);
  }

  // Investigation Reports
  createReport(subjectId: string, report: Omit<InvestigationReport, 'id' | 'subjectId' | 'createdAt' | 'updatedAt'>): string {
    const id = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullReport: InvestigationReport = {
      ...report,
      id,
      subjectId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.reports.set(id, fullReport);
    return id;
  }

  updateReport(id: string, updates: Partial<InvestigationReport>): boolean {
    const report = this.reports.get(id);
    if (!report) return false;
    
    this.reports.set(id, {
      ...report,
      ...updates,
      updatedAt: new Date()
    });
    return true;
  }

  getReport(id: string): InvestigationReport | undefined {
    return this.reports.get(id);
  }

  getAllReports(): InvestigationReport[] {
    return Array.from(this.reports.values());
  }

  getReportsBySubject(subjectId: string): InvestigationReport[] {
    return this.getAllReports().filter(r => r.subjectId === subjectId);
  }

  // Monitoring System
  startMonitoring(intervalMinutes: number = 30): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCheck();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`[OSINT] Monitoring started - checking every ${intervalMinutes} minutes`);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('[OSINT] Monitoring stopped');
  }

  private performMonitoringCheck(): void {
    const activeSubjects = this.getAllSubjects().filter(s => s.status === 'active');
    
    activeSubjects.forEach(subject => {
      // Simulate monitoring checks
      const checkType = Math.random();
      
      if (checkType < 0.3) {
        // Financial activity detected
        this.addAlert({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          subjectId: subject.id,
          type: 'financial_activity',
          severity: Math.random() > 0.7 ? 'critical' : 'warning',
          message: `Unusual financial activity detected for ${subject.name}`,
          data: {
            amount: Math.floor(Math.random() * 1000000),
            source: 'Bank Transaction Monitor'
          },
          timestamp: new Date()
        });
      } else if (checkType < 0.6) {
        // Social network change
        this.addAlert({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          subjectId: subject.id,
          type: 'social_change',
          severity: 'info',
          message: `New social connection detected for ${subject.name}`,
          data: {
            platform: ['LinkedIn', 'Facebook', 'Twitter'][Math.floor(Math.random() * 3)],
            connections: Math.floor(Math.random() * 50)
          },
          timestamp: new Date()
        });
      }
    });
  }

  // Alert Management
  private addAlert(alert: MonitoringAlert): void {
    this.alerts.unshift(alert);
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }
  }

  getAlerts(limit?: number): MonitoringAlert[] {
    return limit ? this.alerts.slice(0, limit) : this.alerts;
  }

  getAlertsBySubject(subjectId: string): MonitoringAlert[] {
    return this.alerts.filter(a => a.subjectId === subjectId);
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  // Analysis Functions
  generateRiskAssessment(subjectId: string): { score: number; factors: string[] } {
    const subject = this.getSubject(subjectId);
    if (!subject) return { score: 0, factors: ['Subject not found'] };

    const reports = this.getReportsBySubject(subjectId);
    const alerts = this.getAlertsBySubject(subjectId);
    
    let score = 0;
    const factors: string[] = [];

    // Base risk level
    const riskScores = { low: 10, medium: 30, high: 60, critical: 80 };
    score += riskScores[subject.riskLevel] || 0;
    factors.push(`Base risk: ${subject.riskLevel}`);

    // Report impact
    score += reports.length * 5;
    if (reports.length > 0) factors.push(`${reports.length} investigation reports`);

    // Recent alerts
    const recentAlerts = alerts.filter(a => 
      (Date.now() - a.timestamp.getTime()) < 7 * 24 * 60 * 60 * 1000
    );
    score += recentAlerts.length * 10;
    if (recentAlerts.length > 0) factors.push(`${recentAlerts.length} recent alerts`);

    // Cap at 100
    score = Math.min(score, 100);

    return { score, factors };
  }

  generateSubjectSummary(subjectId: string): any {
    const subject = this.getSubject(subjectId);
    if (!subject) return null;

    const reports = this.getReportsBySubject(subjectId);
    const alerts = this.getAlertsBySubject(subjectId);
    const riskAssessment = this.generateRiskAssessment(subjectId);

    return {
      subject,
      reports: reports.length,
      alerts: alerts.length,
      riskAssessment,
      lastActivity: Math.max(
        ...reports.map(r => r.updatedAt.getTime()),
        ...alerts.map(a => a.timestamp.getTime()),
        subject.lastUpdate.getTime()
      )
    };
  }

  // Data Export/Import
  exportData(): string {
    const data = {
      subjects: Array.from(this.subjects.values()),
      reports: Array.from(this.reports.values()),
      alerts: this.alerts,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.subjects) {
        data.subjects.forEach((s: Subject) => this.subjects.set(s.id, s));
      }
      
      if (data.reports) {
        data.reports.forEach((r: InvestigationReport) => this.reports.set(r.id, r));
      }
      
      if (data.alerts) {
        this.alerts = data.alerts;
      }
      
      return true;
    } catch (error) {
      console.error('[OSINT] Import failed:', error);
      return false;
    }
  }

  // Statistics
  getStatistics(): any {
    const subjects = this.getAllSubjects();
    const reports = this.getAllReports();
    const alerts = this.getAlerts();

    return {
      subjects: {
        total: subjects.length,
        byType: subjects.reduce((acc, s) => {
          acc[s.type] = (acc[s.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byRiskLevel: subjects.reduce((acc, s) => {
          acc[s.riskLevel] = (acc[s.riskLevel] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        active: subjects.filter(s => s.status === 'active').length
      },
      reports: {
        total: reports.length,
        byStatus: reports.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
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
        active: this.isMonitoring,
        subjectsMonitoring: subjects.filter(s => s.status === 'active').length
      }
    };
  }
}

// Singleton instance
export const osintEngine = new OSINTInvestigationEngine();
