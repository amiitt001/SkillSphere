/**
 * Resume Intelligence — File Parser Module
 *
 * Handles file validation, size limits, text extraction,
 * and encrypted/scanned file detection.
 */

import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { logger } from '@/services/logger';
import path from 'path';
import fs from 'fs';

// Initialize PDFJS Worker location to prevent dynamic worker errors in Next.js builds
try {
  const workerPath = path.resolve(process.cwd(), 'node_modules/pdfjs-dist/build/pdf.worker.mjs');
  if (fs.existsSync(workerPath)) {
    PDFParse.setWorker(workerPath);
  }
} catch (err) {
  logger.warn('[ResumeIntelligenceParser] Failed to bind PDF worker path:', err);
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export interface RawParsedResume {
  text: string;
  isScanned: boolean;
  fileHash: string;
}

export class ResumeParser {
  /**
   * Validates size and extracts text from resume PDF, DOCX, or TXT.
   */
  async extractText(buffer: Buffer, mimeType: string, filename: string): Promise<RawParsedResume> {
    // 1. Size Validation
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File exceeds maximum allowed size of 20MB (got ${Math.round(buffer.length / (1024 * 1024))}MB).`);
    }

    const ext = path.extname(filename).toLowerCase();
    const type = mimeType.toLowerCase();

    let text = '';

    try {
      // 2. Format Routing
      if (type === 'application/pdf' || ext === '.pdf') {
        text = await this.parsePdf(buffer);
      } else if (
        type.includes('officedocument.wordprocessingml') ||
        type.includes('msword') ||
        ext === '.docx' ||
        ext === '.doc'
      ) {
        text = await this.parseDocx(buffer);
      } else if (type.includes('text/plain') || ext === '.txt') {
        text = buffer.toString('utf-8');
      } else {
        // Fallback to plain text
        text = buffer.toString('utf-8');
      }
    } catch (error: any) {
      logger.error('[ResumeIntelligenceParser] Extraction failed:', error);
      throw new Error(`Failed to extract text from resume: ${error.message || error}`);
    }

    const cleanText = text.trim();

    // 3. Scanned PDF Check
    // If text content is empty or extremely short (< 50 chars), it's likely a scanned PDF / image
    const isScanned = cleanText.length < 50;

    // Calculate file hash (MD5) for versioning/deduplication
    const crypto = require('crypto');
    const fileHash = crypto.createHash('md5').update(buffer).digest('hex');

    return {
      text: cleanText,
      isScanned,
      fileHash,
    };
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      
      // Check for password protection / encryption in metadata
      if ((result as any).info && (result as any).info.IsEncrypted === true) {
        throw new Error('PDF is encrypted or password-protected. Please upload an unencrypted file.');
      }

      return result.text || '';
    } catch (err: any) {
      if (err.message?.includes('password') || err.message?.includes('decrypt')) {
        throw new Error('PDF is encrypted or password-protected. Please upload an unencrypted file.');
      }
      throw err;
    }
  }

  private async parseDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
}

export const resumeParser = new ResumeParser();
