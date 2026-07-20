import { createWorker } from 'tesseract.js';
import { logger } from '@/services/logger';

export class ResumeOCR {
  /**
   * Performs local, deterministic OCR from a scanned document file buffer.
   * Zero LLM dependency.
   */
  async extractTextFromScanned(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      logger.info('[ResumeOCR] Initiating local OCR process via Tesseract.js...');
      
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(buffer);
      await worker.terminate();

      logger.info(`[ResumeOCR] Local OCR completed successfully. Extracted ${text?.length || 0} characters.`);
      return text || '';
    } catch (error: any) {
      logger.error('[ResumeOCR] Local OCR failed:', error);
      throw new Error(`Failed to extract text from scanned document: ${error.message || error}`);
    }
  }
}

export const resumeOCR = new ResumeOCR();
