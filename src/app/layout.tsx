import { type Metadata } from 'next';
import { Atkinson_Hyperlegible } from 'next/font/google';

import '../theme.css';
import Link from 'next/link';
import Script from 'next/script';

import Footer from '#components/layout/Footer.tsx';
import NavLink from '#components/layout/NavLink.tsx';
import ScrollArea from '#components/styled/ScrollArea.tsx';
import { env } from '#env.js';
import { NavigationLinks } from '#utils/constants.ts';
import { MobileStateSync } from '#utils/useIsMobile.tsx';

const atkinsonHyperlegible = Atkinson_Hyperlegible({
	weight: ['400', '700'],
	display: 'block'
});

export const metadata: Metadata = {
	title: { default: 'AllumeriaDB', template: '%s | AllumeriaDB' },
	description: 'Database site for Allumeria game.',
	icons: [{ rel: 'icon', url: '/icon.png' }],
	metadataBase: new URL(env.BASE_URL)
};

const RootLayout = async ({ children }: LayoutProps<'/'>) => (
	<html lang="en">
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
		<body className={`${atkinsonHyperlegible.className} text-white`}>
			<div
				className="flex min-h-screen flex-col gap-8 overflow-x-hidden p-2 lg:h-screen lg:flex-row lg:p-8"
				style={{
					backgroundImage: 'url(/night_sky.png)',
					backgroundSize: 'cover',
					backgroundPosition: 'center'
				}}
			>
				<div className="flex w-full flex-col gap-8 lg:max-w-84">
					<header className="contents">
						<Link href="/" className="-m-4 p-4">
							<img
								src="/db_logo.png"
								alt="AllumeriaDB Logo"
								className="mx-auto w-full max-w-84"
							/>
						</Link>
						<nav className="relative flex grow before:pointer-events-none before:absolute before:inset-0 before:ns-borderless-panel before:opacity-50 md:flex-row lg:flex-col">
							{NavigationLinks.map(item => (
								<NavLink
									key={item.href}
									href={item.href}
									icon={item.icon}
									label={item.label}
								/>
							))}
						</nav>
					</header>
					<Footer className="hidden lg:block" />
				</div>
				<main className="flex w-full shrink grow flex-col gap-8">
					{children}
				</main>
				<Footer className="px-4 pb-6 lg:hidden" />
			</div>
			<MobileStateSync />
		</body>
	</html>
);

export default RootLayout;
