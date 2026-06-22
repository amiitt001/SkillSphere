import fs from 'fs';
import path from 'path';

const STATUS_FILE = path.join(process.cwd(), 'limit_status.json');

interface LimitStatus {
  geminiBlockedUntil?: string;
  nvidiaBlockedUntil?: string;
}

function getLimitStatus(): LimitStatus {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const content = fs.readFileSync(STATUS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    // Fail silently or log
  }
  return {};
}

function saveLimitStatus(status: LimitStatus) {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), 'utf-8');
  } catch (e) {
    console.error("Error writing limit status file:", e);
  }
}

export function isGeminiBlocked(): boolean {
  const status = getLimitStatus();
  if (status.geminiBlockedUntil) {
    const blockedUntil = new Date(status.geminiBlockedUntil);
    if (new Date() < blockedUntil) {
      return true;
    }
  }
  return false;
}

export function isNvidiaBlocked(): boolean {
  const status = getLimitStatus();
  if (status.nvidiaBlockedUntil) {
    const blockedUntil = new Date(status.nvidiaBlockedUntil);
    if (new Date() < blockedUntil) {
      return true;
    }
  }
  return false;
}

export function blockGemini() {
  const status = getLimitStatus();
  const blockedUntil = new Date();
  blockedUntil.setHours(blockedUntil.getHours() + 24); // Block for 24 hours
  status.geminiBlockedUntil = blockedUntil.toISOString();
  saveLimitStatus(status);
  console.log(`[API Manager] Google Gemini API has been blocked until ${status.geminiBlockedUntil} due to rate limits.`);
}

export function blockNvidia() {
  const status = getLimitStatus();
  const blockedUntil = new Date();
  blockedUntil.setHours(blockedUntil.getHours() + 24); // Block for 24 hours
  status.nvidiaBlockedUntil = blockedUntil.toISOString();
  saveLimitStatus(status);
  console.log(`[API Manager] NVIDIA DeepSeek API has been blocked until ${status.nvidiaBlockedUntil} due to rate limits.`);
}
