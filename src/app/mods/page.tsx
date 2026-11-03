import { type Metadata } from 'next';
import Link from 'next/link';
import { type ReactNode } from 'react';

import ModImageSlideshow from '#app/mods/ModImageSlideshow.tsx';
import Breadcrumbs from '#components/Breadcrumbs.tsx';
import RelativeTime from '#components/RelativeTime.tsx';
import { getAllMods } from '#server/mods.ts';
import {
	DefaultModsFolder,
	IgnitronLoaderDownload,
	formatFileSize
} from '#utils/mods.ts';
import { getEntrySocialMetadata } from '#utils/seo.ts';

import InstallSection from './InstallSection.tsx';

const description =
	'Install the Ignitron mod loader for Allumeria and browse quality of life and content mods with download links, changelogs and documentation.';

export const metadata: Metadata = {
	title: 'Allumeria Mods',
	description,
	...getEntrySocialMetadata('Allumeria Mods', description, '/mods'),
	alternates: { canonical: '/mods' }
};

const InstallStep = ({
	number,
	title,
	children
}: {
	number: number;
	title: string;
	children: ReactNode;
}) => (
	<li className="flex gap-5 p-2">
		<span className="flex size-12 shrink-0 items-center justify-center text-2xl font-bold pixel-shadow">
			{String(number).padStart(2, '0')}
		</span>
		<div className="flex shrink flex-col gap-1">
			<h3 className="text-lg font-bold pixel-shadow">{title}</h3>
			<div className="text-base text-white/85">{children}</div>
		</div>
	</li>
);

const Page = async () => {
	const mods = await getAllMods();

	return (
		<>
			<Breadcrumbs
				items={[{ label: 'Home', href: '/' }, { label: 'Mods' }]}
				className="mx-auto -mb-6 w-full max-w-294"
			/>
			<div className="container mx-auto flex w-full max-w-294 flex-col gap-4">
				<h1 className="my-2 text-3xl font-bold pixel-shadow md:text-4xl">
					Allumeria Mods
				</h1>
				<InstallSection>
					<p className="text-muted">
						To install mods, you first need to set up the Ignitron loader.
						Follow the steps below to get started.
					</p>

					<ol className="flex max-w-3xl flex-col gap-3">
						<InstallStep number={1} title="Find your game folder">
							<p>
								Open the Allumeria installation directory. On a default Steam
								install, it&apos;s:
							</p>
							<code className="mt-1 block break-all text-aqua">
								{DefaultModsFolder}
							</code>
						</InstallStep>
						<InstallStep number={2} title="Prepare the mods folder">
							<p>
								Inside the game folder, create a folder named{' '}
								<code className="text-aqua">mods</code> if one doesn&apos;t
								already exist. This is where the loader and your mods go.
							</p>
						</InstallStep>
						<InstallStep number={3} title="Install the Ignitron loader">
							<p>
								Download the loader below, then extract the contents of the zip
								directly into <code className="text-aqua">mods</code>. You
								should see <code className="text-aqua">Loader.dll</code> and
								other files in the folder.
							</p>
						</InstallStep>
						<InstallStep number={4} title="Add mods and launch the game">
							<p>
								Download the mods you want from the list below or from other
								sources and place each mod&apos;s zip file in{' '}
								<code className="text-aqua">mods</code> without extracting it.
								Launch Allumeria to load them.
							</p>
						</InstallStep>
					</ol>

					<div className="flex flex-col items-center gap-2 pt-5 text-center">
						<a
							href={IgnitronLoaderDownload}
							aria-label="Download the Ignitron mod loader"
							className="flex w-full max-w-xl flex-col items-center justify-center gap-1 ns-btn-positive px-3 py-2 text-center text-lg pixel-shadow active:ns-btn-pressed sm:flex-row sm:gap-3 sm:px-6 sm:py-4 sm:text-left hocus:ns-btn-hover"
						>
							<img
								src="/assets/icons/icon_down.webp"
								alt=""
								className="size-5.5 sm:size-11"
							/>
							<span className="flex shrink flex-col">
								<span className="text-lg font-bold">
									Download Ignitron Loader
								</span>
								<span className="text-sm font-normal">
									Required to install and run mods
								</span>
							</span>
						</a>
					</div>
				</InstallSection>

				<section className="flex flex-col gap-4">
					<h2 className="my-2 text-center text-3xl font-bold pixel-shadow">
						Mods
					</h2>
					<ul className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(420px,1fr))]">
						{mods.map(mod => (
							<li
								key={mod.slug}
								className="relative flex flex-col gap-3 ns-card p-3 has-[>div>a:first-child:active]:ns-card-pressed has-[>div>a:first-child:focus-visible:not(:active)]:ns-card-hover has-[>div>a:first-child:hover:not(:active)]:ns-card-hover"
							>
								<ModImageSlideshow
									images={mod.images}
									name={mod.metadata.display_name}
									className="z-10"
								/>
								<div className="flex gap-3">
									<Link
										href={`/mods/${mod.slug}`}
										aria-label={`${mod.metadata.display_name} details`}
										className="flex min-w-0 flex-1 gap-3 outline-none after:absolute after:inset-0"
									>
										<img
											src={mod.avatarUrl}
											alt=""
											className="size-20 object-cover"
										/>
										<div className="flex shrink flex-col">
											<h3 className="text-2xl font-bold pixel-shadow">
												{mod.metadata.display_name}
											</h3>
											<span className="text-xl text-aqua">
												v{mod.metadata.version}
												{mod.releasedAt && (
													<>
														{' '}
														<RelativeTime
															date={mod.releasedAt}
															className="text-base text-muted"
														/>
													</>
												)}
											</span>
											<p className="line-clamp-2 text-muted">
												{mod.metadata.description}
											</p>
										</div>
									</Link>
									<div className="relative z-10 flex flex-col gap-1 self-start">
										{mod.assets[0] && (
											<Link
												href={mod.assets[0].url}
												aria-label={`Download ${mod.assets[0].name} (${formatFileSize(mod.assets[0].size)})`}
												title={`Download ${mod.assets[0].name} (${formatFileSize(mod.assets[0].size)})`}
												className="ns-btn-positive active:ns-btn-pressed hocus:ns-btn-hover"
											>
												<img
													src="/assets/icons/icon_down.webp"
													alt=""
													className="size-5.5"
												/>
											</Link>
										)}
										<Link
											href={mod.url}
											target="_blank"
											rel="noopener noreferrer"
											title="Source code on Codeberg"
											aria-label={`${mod.metadata.display_name} source code on Codeberg`}
											className="ns-btn active:ns-btn-pressed hocus:ns-btn-hover"
										>
											<img
												src="/assets/icons/icon_cloud.webp"
												alt=""
												className="size-5.5"
											/>
										</Link>
									</div>
								</div>
							</li>
						))}
					</ul>
				</section>
			</div>
		</>
	);
};

export default Page;
