import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Newsreader } from 'next/font/google';

import { t } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/provider';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const newsreader = Newsreader({ variable: '--font-newsreader', subsets: ['latin'] });

export const metadata: Metadata = {
	title: t('app.name'),
	description: 'Turn study documents into multiple-choice practice.'
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	viewportFit: 'cover'
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">
				<I18nProvider>{children}</I18nProvider>
			</body>
		</html>
	);
}
