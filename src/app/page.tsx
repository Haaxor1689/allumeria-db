import { type Metadata } from 'next';
import Link from 'next/link';

import JsonLd from '#components/JsonLd.tsx';
import summary from '#data/summary.json';
import { env } from '#env.js';
import { DatabaseLinks, SocialLinks, ToolsLinks } from '#utils/constants.ts';

export const metadata: Metadata = {
	title: {
		absolute: 'Allumeria Wiki & Game Database | AllumeriaDB'
	},
	description:
		'Explore the unofficial Allumeria wiki and database: items, crafting recipes, blocks, creatures, loot and NPCs, with data extracted from the game.'
};

const generatedAt = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'medium',
	timeStyle: 'short',
	timeZone: 'UTC'
}).format(new Date(summary.generatedAtUtc));

const Page = () => (
	<>
		<JsonLd
			data={{
				'@context': 'https://schema.org',
				'@type': 'WebSite',
				'name': 'AllumeriaDB',
				'url': env.BASE_URL,
				'description': metadata.description,
				'potentialAction': DatabaseLinks.map(({ href, label }) => ({
					'@type': 'SearchAction',
					'name': `Search ${label}`,
					'target': {
						'@type': 'EntryPoint',
						'urlTemplate': `${new URL(href, env.BASE_URL)}?search={search_term_string}`
					},
					'query-input': 'required name=search_term_string'
				}))
			}}
		/>
		{/* Hero */}
		<section className="relative mx-auto flex w-full max-w-294 flex-col gap-4 ns-card p-8">
			<h1 className="text-2xl font-bold pixel-shadow md:text-3xl">
				Allumeria Wiki &amp; Database
			</h1>
			<p className="text-lg text-muted">
				AllumeriaDB is an unofficial, fan-made Allumeria wiki and searchable
				game database. Find crafting ingredients, compare items and tools,
				explore creature loot and spawns, and look up NPC shops and housing
				requirements.
			</p>
			<p className="text-lg text-muted">
				Browse through the categories below to find information about items,
				blocks, recipes, creatures, effects, loot tables, spawns, item tags,
				structures, shops and NPCs.
			</p>
			<p className="text-muted">
				Reference data is extracted from the game assets and code. AllumeriaDB
				is not affiliated with Infinimelon studio.{' '}
				<Link href="/about" className="text-aqua underline hocus:text-white">
					About the database and how to report issues
				</Link>
				.
			</p>

			<div className="justify-items-start-start grid grid-cols-[auto_1fr] items-center gap-2 text-muted">
				<p>Game version:</p>
				<p className="text-xl font-semibold text-aqua">{summary.gameVersion}</p>
				<p>Last updated:</p>
				<p className="text-xl font-semibold text-aqua">{generatedAt} UTC</p>
			</div>
		</section>

		<section className="mx-auto grid w-full max-w-294 grid-cols-[repeat(auto-fit,minmax(200px,1fr))] flex-col content-center gap-5">
			{/* Database cards */}
			<h2 className="col-span-full text-center text-3xl font-bold pixel-shadow">
				Browse Database
			</h2>
			<div className="col-span-full grid grid-cols-subgrid gap-3">
				{DatabaseLinks.map(cat => (
					<Link
						key={cat.href}
						href={cat.href}
						className="group flex flex-col items-center gap-4 ns-btn-pink p-4 transition-opacity active:ns-btn-pressed hocus:ns-btn-hover"
					>
						<img
							src={cat.icon}
							alt={cat.label}
							width={48}
							height={48}
							className="size-12"
						/>
						<span className="text-center text-xl font-bold pixel-shadow">
							{cat.label}
						</span>
					</Link>
				))}
			</div>

			{/* Tools cards */}
			<h2 className="col-span-full text-center text-3xl font-bold pixel-shadow">
				Browse Tools
			</h2>
			<div className="col-span-full grid grid-cols-subgrid gap-3">
				{ToolsLinks.map(cat => (
					<Link
						key={cat.href}
						href={cat.href}
						className="group flex flex-col items-center gap-4 ns-btn-purple p-4 transition-opacity active:ns-btn-pressed hocus:ns-btn-hover"
					>
						<img
							src={cat.icon}
							alt={cat.label}
							width={48}
							height={48}
							className="size-12"
						/>
						<span className="text-center text-xl font-bold pixel-shadow">
							{cat.label}
						</span>
					</Link>
				))}
			</div>
		</section>

		{/* About */}
		<section className="mx-auto flex max-w-294 flex-col gap-1">
			<div className="flex flex-col gap-2 ns-card p-5 sm:flex-row sm:gap-5">
				<img
					src="/icon_allumeria.png"
					alt="Allumeria logo"
					className="size-16"
				/>
				<div className="flex shrink flex-col gap-2">
					<h2 className="text-2xl font-bold pixel-shadow">About Allumeria</h2>
					<p className="text-muted">
						A classic voxel sandbox combined with in-depth progression through
						exploration, dungeon crawling and boss battles. Spend every minute
						discovering new weapons, abilities, resources, enemies, structures,
						mechanics and tools. With a strong focus on discovery, variety and
						creativity, the world is yours.
					</p>
					<p className="text-muted">
						Find out more about the game on official links below!
					</p>
				</div>
			</div>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] content-center gap-1">
				{SocialLinks.map(link => (
					<Link
						key={link.href}
						href={link.href}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center justify-center gap-2 ns-card font-semibold pixel-shadow active:ns-card-pressed! hocus:ns-card-hover"
					>
						<img src={link.icon} alt={link.label} className="-ml-2 size-8" />
						{link.label}
					</Link>
				))}
			</div>
		</section>
	</>
);

export default Page;
