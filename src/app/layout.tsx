import { Analytics } from '@vercel/analytics/next';
import { type Metadata } from 'next';

import '../theme.css';
import { Atkinson_Hyperlegible } from 'next/font/google';
import Link from 'next/link';
import Script from 'next/script';

import AutoBlur from '#components/AutoBlur.tsx';
import JsonLd from '#components/JsonLd.tsx';
import Footer from '#components/layout/Footer.tsx';
import MobileNav from '#components/layout/MobileNav.tsx';
import Navigation from '#components/layout/Navigation.tsx';
import { env } from '#env.js';
import { MobileStateSync } from '#utils/useIsMobile.tsx';

const atkinsonHyperlegible = Atkinson_Hyperlegible({
	weight: ['400', '700'],
	display: 'block'
});

export const metadata: Metadata = {
	title: { default: 'AllumeriaDB', template: '%s | AllumeriaDB' },
	description:
		'Browse items, blocks, creatures, effects, recipes, loot, structures, and NPCs from the Allumeria game.',
	alternates: { canonical: '/' },
	icons: [{ rel: 'icon', url: '/icon.png' }],
	metadataBase: new URL(env.BASE_URL)
};

const RootLayout = async ({ children }: LayoutProps<'/'>) => (
	<html lang="en" className="overflow-hidden">
		<head>
			{process.env.NODE_ENV === 'production' ? (
				<>
					{/* Google Ads */}
					<meta
						name="google-adsense-account"
						content="ca-pub-8795217129609015"
					/>
					<Script
						id="adsense-global"
						async
						strategy="afterInteractive"
						src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8795217129609015"
						crossOrigin="anonymous"
					/>
					{/* Anti AI scrape */}
					<meta name="robots" content="noai, noimageai" />
					<meta name="googlebot" content="noai" />
					<meta httpEquiv="X-Robots-Tag" content="noai, noimageai" />
				</>
			) : (
				<Script
					src="//unpkg.com/react-scan/dist/auto.global.js"
					crossOrigin="anonymous"
					strategy="beforeInteractive"
				/>
			)}
		</head>
		<body
			className={`${atkinsonHyperlegible.className} max-h-screen scrollbar-gutter-stable overflow-auto text-white`}
		>
			<JsonLd
				data={{
					'@context': 'https://schema.org',
					'@type': 'WebSite',
					'name': 'AllumeriaDB',
					'url': env.BASE_URL,
					'description': 'A searchable database of Allumeria game content.'
				}}
			/>
			<div
				className="fixed inset-0 -z-10"
				style={{
					backgroundImage: 'url(/night_sky.png)',
					backgroundSize: 'cover',
					backgroundRepeat: 'no-repeat',
					backgroundPosition: 'center'
				}}
			/>
			<div className="flex min-h-screen flex-col gap-8 overflow-x-clip p-2 lg:flex-row lg:p-8">
				<div className="flex max-h-[calc(100vh-4rem)] w-full flex-col gap-8 lg:sticky lg:top-8 lg:max-w-84 lg:flex-none">
					<header className="contents">
						<Link href="/" className="-m-4 p-4">
							<img
								src="/db_logo.png"
								alt="AllumeriaDB Logo"
								className="mx-auto w-full max-w-84"
							/>
						</Link>
						<Navigation className="hidden lg:flex" />
					</header>
					<Footer className="hidden lg:block" />
				</div>
				<main className="flex w-full shrink grow flex-col gap-8">
					{children}
				</main>
				<AutoBlur />

				<Footer className="px-4 pb-6 lg:hidden" />
				<MobileNav>
					<Navigation />
				</MobileNav>
			</div>
			<MobileStateSync />
			<Analytics />
		</body>
	</html>
);

export default RootLayout;
