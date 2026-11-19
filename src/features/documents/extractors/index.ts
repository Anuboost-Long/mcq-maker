import { extractDocxBlocks } from './docx';
import { extractPdfBlocks } from './pdf';

export const extractBlocks = (format: 'docx' | 'pdf', buffer: Buffer) =>
	format === 'pdf' ? extractPdfBlocks(buffer) : extractDocxBlocks(buffer);
