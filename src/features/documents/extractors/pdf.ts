import { extractText } from 'unpdf';

import type { Block } from '../types';

const pageNumber = /^(page\s*)?\d+(\s*(\/|of)\s*\d+)?$/i;

export async function extractPdfBlocks(buffer: Buffer): Promise<Block[]> {
	const { text } = await extractText(new Uint8Array(buffer), { mergePages: false });
	return text.map((page): Block => ({
		kind: 'paragraph',
		lines: page
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line && !pageNumber.test(line))
	}));
}
