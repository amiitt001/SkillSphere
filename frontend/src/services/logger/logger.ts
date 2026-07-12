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

  ai: (provider: string, action: string, success: boolean, error?: any) => {
    const status = success ? 'SUCCESS' : 'FAILED';
    const msg = `[AI_CALL] Provider: ${provider} | Action: ${action} | Status: ${status}`;
    if (success) {
      console.info(msg);
    } else {
      console.error(msg, error instanceof Error ? error.stack || error.message : error || '');
    }
  },

  auth: (userId: string | undefined, action: string, success: boolean, error?: any) => {
    const status = success ? 'SUCCESS' : 'FAILED';
    const msg = `[AUTH] User: ${userId || 'anonymous'} | Action: ${action} | Status: ${status}`;
    if (success) {
      console.info(msg);
    } else {
      console.error(msg, error instanceof Error ? error.stack || error.message : error || '');
    }
  }
};
