import mammoth from 'mammoth';

import { htmlToBlocks } from './html-blocks';

export async function extractDocxBlocks(buffer: Buffer) {
	const { value } = await mammoth.convertToHtml({ buffer });
	return htmlToBlocks(value);
}
