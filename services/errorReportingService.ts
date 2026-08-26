/**
 * Error Reporting Service — Centralized error tracking
 *
 * Captures errors from all layers (UI, services, ledger, SRI)
 * and stores them for review in the admin panel.
 * Sends to console in dev, stores in localStorage + Supabase in prod.
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
export type ErrorSource = 'ui' | 'service' | 'auth' | 'sri' | 'ledger' | 'realtime';

export interface ErrorReport {
  id: string;
  timestamp: string;
  source: ErrorSource;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  resolved: boolean;
}

const STORAGE_KEY = 'cordova_error_reports';
const MAX_STORED = 100;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function storeReport(report: ErrorReport): void {
  try {
    const stored = getStoredReports();
    stored.unshift(report);
    if (stored.length > MAX_STORED) stored.pop();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // localStorage full or unavailable
  }
}

export function getStoredReports(): ErrorReport[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function markReportResolved(id: string): void {
  const reports = getStoredReports();
  const report = reports.find(r => r.id === id);
  if (report) {
    report.resolved = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  }
}

export function clearResolvedReports(): void {
  const reports = getStoredReports().filter(r => !r.resolved);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

/**
 * Report an error from any layer of the application.
 */
export function reportError(
  source: ErrorSource,
  severity: ErrorSeverity,
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
): ErrorReport {
  const report: ErrorReport = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    source,
    severity,
    message,
    stack: error instanceof Error ? error.stack : undefined,
    context,
    resolved: false,
  };

  // Console output in development
  if (import.meta.env.DEV) {
    const consoleFn = severity === 'critical' || severity === 'error'
      ? console.error
      : severity === 'warning'
      ? console.warn
      : console.log;
    consoleFn(`[${source.toUpperCase()}] ${message}`, error || '', context || '');
  }

  storeReport(report);
  return report;
}

/**
 * Convenience wrappers per source
 */
export const errorReporter = {
  ui: {
    info: (msg: string, ctx?: Record<string, unknown>) => reportError('ui', 'info', msg, undefined, ctx),
    warning: (msg: string, ctx?: Record<string, unknown>) => reportError('ui', 'warning', msg, undefined, ctx),
    error: (msg: string, err?: unknown, ctx?: Record<string, unknown>) => reportError('ui', 'error', msg, err, ctx),
    critical: (msg: string, err?: unknown, ctx?: Record<string, unknown>) => reportError('ui', 'critical', msg, err, ctx),
  },
  service: {
    info: (msg: string, ctx?: Record<string, unknown>) => reportError('service', 'info', msg, undefined, ctx),
    warning: (msg: string, ctx?: Record<string, unknown>) => reportError('service', 'warning', msg, undefined, ctx),
    error: (msg: string, err?: unknown, ctx?: Record<string, unknown>) => reportError('service', 'error', msg, err, ctx),
    critical: (msg: string, err?: unknown, ctx?: Record<string, unknown>) => reportError('service', 'critical', msg, err, ctx),
  },
  auth: {
    error: (msg: string, err?: unknown, ctx?: Record<string, unknown>) => reportError('auth', 'error', msg, err, ctx),
    critical: (msg: string, err?: unknown, ctx?: Record<string, unknown>) => reportError('auth', 'critical', msg, err, ctx),
  },
  sri: {
    warning: (msg: string, ctx?: Record<string, unknown>) => reportError('sri', 'warning', msg, undefined, ctx),
    error: (msg: string, err?: unknown, ctx?: Record<string, unknown>) => reportError('sri', 'error', msg, err, ctx),
    critical: (msg: string, err?: unknown, ctx?: Record<string, unknown>) => reportError('sri', 'critical', msg, err, ctx),
  },
  ledger: {
    warning: (msg: string, ctx?: Record<string, unknown>) => reportError('ledger', 'warning', msg, undefined, ctx),
    error: (msg: string, err?: unknown, ctx?: Record<string, unknown>) => reportError('ledger', 'error', msg, err, ctx),
  },
  realtime: {
    info: (msg: string, ctx?: Record<string, unknown>) => reportError('realtime', 'info', msg, undefined, ctx),
    warning: (msg: string, ctx?: Record<string, unknown>) => reportError('realtime', 'warning', msg, undefined, ctx),
    error: (msg: string, err?: unknown, ctx?: Record<string, unknown>) => reportError('realtime', 'error', msg, err, ctx),
  },
};
