import { logger } from '@/services/logger';

export interface IJobProvider {
  extract(input: string | Buffer): Promise<string>;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export class TextJobProvider implements IJobProvider {
  async extract(input: string): Promise<string> {
    if (!input || input.trim().length < 50) {
      throw new Error('Job description text is too short. Please paste the full description.');
    }
    return input.trim();
  }
}

export class UrlJobProvider implements IJobProvider {
  private readonly MIN_CONTENT_LENGTH = 200;

  async extract(url: string): Promise<string> {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      throw new Error('Please provide a full URL starting with https://');
    }

    logger.info(`[UrlJobProvider] Fetching job URL: ${trimmed}`);

    let html: string;
    try {
      const response = await fetch(trimmed, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        throw new Error(`URL fetch returned ${response.status}. Try pasting the job description directly.`);
      }
      html = await response.text();
    } catch (err: any) {
      if (err.name === 'TimeoutError') {
        throw new Error('The job page took too long to respond. Please paste the description instead.');
      }
      throw new Error(err.message || 'Failed to fetch the job URL. Please paste the description directly.');
    }

    const text = stripHtml(html);

    if (text.length < this.MIN_CONTENT_LENGTH) {
      throw new Error(
        'Could not extract readable content from this URL (the site may block automated access). ' +
        'Please paste the job description text directly.'
      );
    }

    return text.slice(0, 8000);
  }
}

export class PdfJobProvider implements IJobProvider {
  async extract(input: string | Buffer): Promise<string> {
    let buffer: Buffer;
    if (typeof input === 'string') {
      buffer = Buffer.from(input, 'base64');
    } else {
      buffer = input;
    }

    const pdfStr = buffer.toString('binary');
    const lines: string[] = [];

    const btEtRegex = /BT([\s\S]*?)ET/g;
    let match: RegExpExecArray | null;
    while ((match = btEtRegex.exec(pdfStr)) !== null) {
      const block = match[1];
      const strRegex = /\(([^)]*)\)/g;
      let strMatch: RegExpExecArray | null;
      while ((strMatch = strRegex.exec(block)) !== null) {
        const decoded = strMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\t/g, ' ')
          .replace(/\\\\/g, '\\')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .trim();
        if (decoded.length > 1) lines.push(decoded);
      }
    }

    const text = lines.join(' ').replace(/\s+/g, ' ').trim();

    if (text.length < 100) {
      throw new Error(
        'Could not extract text from this PDF. Please paste the job description instead.'
      );
    }

    logger.info(`[PdfJobProvider] Extracted ${text.length} characters from PDF`);
    return text.slice(0, 8000);
  }
}

export function createJobProvider(source: 'url' | 'text' | 'pdf'): IJobProvider {
  switch (source) {
    case 'url':  return new UrlJobProvider();
    case 'pdf':  return new PdfJobProvider();
    case 'text':
    default:     return new TextJobProvider();
  }
}
