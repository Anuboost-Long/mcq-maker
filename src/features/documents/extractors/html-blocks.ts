import type { Block } from '../types';

const entities: Record<string, string> = {
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#39;': "'",
	'&nbsp;': ' '
};

const plainText = (html: string) =>
	html
		.replace(/<[^>]+>/g, '')
		.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => entities[entity])
		.trim();

const paragraphLines = (html: string) =>
	html
		.split(/<br\s*\/?>/)
		.map(plainText)
		.filter(Boolean);

const tableRows = (html: string) =>
	[...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(([, row]) =>
		[...row.matchAll(/<t[dh]>([\s\S]*?)<\/t[dh]>/g)].map(([, cell]) => plainText(cell))
	);

export function htmlToBlocks(html: string): Block[] {
	return [...html.matchAll(/<table>([\s\S]*?)<\/table>|<p>([\s\S]*?)<\/p>/g)].flatMap(
		([, table, paragraph]): Block[] => {
			if (table !== undefined) return [{ kind: 'table', rows: tableRows(table) }];
			const lines = paragraphLines(paragraph);
			return lines.length ? [{ kind: 'paragraph', lines }] : [];
		}
	);
}
