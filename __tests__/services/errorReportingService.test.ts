import { describe, it, expect, beforeEach } from 'vitest';
import {
  reportError,
  getStoredReports,
  markReportResolved,
  clearResolvedReports,
  errorReporter,
} from '../../services/errorReportingService';

describe('errorReportingService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should store a report and retrieve it', () => {
    const report = reportError('ui', 'error', 'Test error', undefined, { foo: 'bar' });
    const stored = getStoredReports();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(report.id);
    expect(stored[0].message).toBe('Test error');
    expect(stored[0].source).toBe('ui');
    expect(stored[0].severity).toBe('error');
    expect(stored[0].context).toEqual({ foo: 'bar' });
    expect(stored[0].resolved).toBe(false);
  });

  it('should cap stored reports at 100', () => {
    for (let i = 0; i < 120; i++) {
      reportError('ui', 'info', `Report ${i}`);
    }
    const stored = getStoredReports();
    expect(stored).toHaveLength(100);
    expect(stored[0].message).toBe('Report 119');
  });

  it('should mark a report as resolved', () => {
    const report = reportError('ledger', 'warning', 'Ledger warning');
    markReportResolved(report.id);
    const stored = getStoredReports();
    expect(stored[0].resolved).toBe(true);
  });

  it('should clear only resolved reports', () => {
    const r1 = reportError('ui', 'error', 'Error 1');
    const r2 = reportError('ui', 'error', 'Error 2');
    markReportResolved(r1.id);
    clearResolvedReports();
    const stored = getStoredReports();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(r2.id);
  });

  it('should store stack traces from Error objects', () => {
    const err = new Error('test error');
    reportError('service', 'critical', 'Service failed', err);
    const stored = getStoredReports();
    expect(stored[0].stack).toBeDefined();
    expect(stored[0].stack).toContain('test error');
  });

  describe('convenience reporter', () => {
    it('should create reports with correct source', () => {
      errorReporter.sri.error('SRI failed');
      const stored = getStoredReports();
      expect(stored[0].source).toBe('sri');
      expect(stored[0].message).toBe('SRI failed');
    });

    it('should create critical auth reports', () => {
      errorReporter.auth.critical('Auth system down');
      const stored = getStoredReports();
      expect(stored[0].source).toBe('auth');
      expect(stored[0].severity).toBe('critical');
    });
  });
});
