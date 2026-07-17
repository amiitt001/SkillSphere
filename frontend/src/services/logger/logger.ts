/**
 * Centralized Logging Utility
 * Standardizes formatting and targets for application logs.
 */

export const logger = {
  info: (message: string, context?: any) => {
    console.info(`[INFO] ${message}`, context ? JSON.stringify(context) : '');
  },

  warn: (message: string, context?: any) => {
    console.warn(`[WARN] ${message}`, context ? JSON.stringify(context) : '');
  },

  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error instanceof Error ? error.stack || error.message : error || '');
  },

  audit: (action: string, actor: string, success: boolean, extra?: any) => {
    const status = success ? 'SUCCESS' : 'FAILED';
    const msg = `[AUDIT] Action: ${action} | Actor: ${actor} | Status: ${status}`;
    if (success) {
      console.info(msg, extra ? JSON.stringify(extra) : '');
    } else {
      console.error(msg, extra ? JSON.stringify(extra) : '');
    }
  }
};
