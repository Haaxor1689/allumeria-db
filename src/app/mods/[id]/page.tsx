import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import ModInfoCard from '#app/mods/[id]/ModInfoCard.tsx';
import ReadmeMarkdown from '#app/mods/[id]/ReadmeMarkdown.tsx';
import ReadmeToc from '#app/mods/[id]/ReadmeToc.tsx';
import Breadcrumbs from '#components/Breadcrumbs.tsx';
import JsonLd from '#components/JsonLd.tsx';
import { env } from '#env.js';
import { getAllMods, getMod, getModDescription } from '#server/mods.ts';
import { Mods, formatFileSize } from '#utils/mods.ts';
import { getReadmeHeadings } from '#utils/readme.ts';
import { getEntrySocialMetadata } from '#utils/seo.ts';

export const generateStaticParams = () =>
	Mods.map(({ slug }) => ({ id: slug }));

export const generateMetadata = async ({
	params
}: PageProps<'/mods/[id]'>): Promise<Metadata> => {
	const { id } = await params;
	const mod = await getMod(id);
	if (!mod) return { title: 'Mod not found' };
	const title = `${mod.metadata.display_name} Mod`;
	const description = getModDescription(mod);
	return {
		title,
		description,
		...getEntrySocialMetadata(title, description, `/mods/${id}`),
		alternates: { canonical: `/mods/${id}` }
	};
};

const Page = async ({ params }: PageProps<'/mods/[id]'>) => {
	const { id } = await params;
	const [mod, allMods] = await Promise.all([getMod(id), getAllMods()]);

	if (!mod) notFound();

	const { metadata } = mod;
	const rawBase = `${mod.url}/raw/branch/${mod.branch}/`;
	const srcBase = `${mod.url}/src/branch/${mod.branch}/`;
	// The page already renders the mod name as h1, so drop the readme title
	const readme = mod.readme?.replace(/^\s*#\s+.*(\r?\n|$)/, '');

	return (
		<>
			<JsonLd
				data={{
					'@context': 'https://schema.org',
					'@type': 'SoftwareApplication',
					'name': metadata.display_name,
					'description': getModDescription(mod),
					'softwareVersion': metadata.version,
					'applicationCategory': 'GameApplication',
					'operatingSystem': 'Windows',
					'url': new URL(`/mods/${id}`, env.BASE_URL).toString(),
					...(mod.assets.length > 0 && {
						downloadUrl: mod.assets.map(a => a.url)
					}),
					...(mod.releasedAt && { dateModified: mod.releasedAt }),
					'author': metadata.contributors
						.filter(c => c.role === 'author')
						.map(c => ({ '@type': 'Person', 'name': c.name }))
				}}
			/>
			<Breadcrumbs
				items={[
					{ label: 'Home', href: '/' },
					{ label: 'Mods', href: '/mods' },
					{ label: metadata.display_name }
				]}
				className="mx-auto -mb-6 w-full max-w-294"
			/>
			<div className="container mx-auto flex w-full max-w-294 flex-col gap-10 ns-dialog p-4 2xl:grid 2xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-rows-[auto_1fr]">
				<div className="flex flex-col gap-4 2xl:col-start-1 2xl:row-start-1">
					<h1 className="flex flex-wrap items-baseline gap-x-3 text-4xl font-bold pixel-shadow md:text-5xl">
						{metadata.display_name}
						<span className="text-2xl text-aqua">v{metadata.version}</span>
					</h1>
					{metadata.description && (
						<p className="text-lg text-muted">{metadata.description}</p>
					)}
					<div className="flex flex-wrap gap-2">
						{mod.assets.map(asset => (
							<Link
								key={asset.url}
								href={asset.url}
								className="flex items-center gap-2 ns-btn-positive px-3 py-1 text-lg font-bold pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover"
							>
								<img
									src="/assets/icons/icon_down.webp"
									alt=""
									className="-ml-1 size-5.5"
								/>
								Download {asset.name}
								<span className="text-sm font-normal text-white/70">
									{formatFileSize(asset.size)}
								</span>
							</Link>
						))}
						<Link
							href={mod.url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 ns-btn px-3 py-1 text-lg font-bold pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover"
						>
							<img
								src="/assets/icons/icon_cloud.webp"
								alt=""
								className="-ml-1 size-5.5"
							/>
							Codeberg
						</Link>
					</div>
				</div>

				<div className="flex flex-col gap-6 2xl:col-start-2 2xl:row-span-2 2xl:row-start-1">
					<ModInfoCard
						mod={mod}
						allMods={allMods}
						className="flex w-full flex-col gap-6 ns-slot p-4 wrap-break-word"
					/>
					{readme && (
						<ReadmeToc
							headings={getReadmeHeadings(readme)}
							className="2xl:sticky 2xl:top-8 2xl:max-h-[calc(100vh-4rem)] 2xl:overflow-y-auto"
						/>
					)}
				</div>

				{readme && (
					<section className="flex flex-col gap-4 2xl:col-start-1 2xl:row-start-2">
						<ReadmeMarkdown
							content={readme}
							linkBase={srcBase}
							imageBase={rawBase}
						/>
					</section>
				)}
			</div>
		</>
	);
};

export default Page;
