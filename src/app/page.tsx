import Link from 'next/link';

import Button from '#components/styled/Button.tsx';
import summary from '#data/summary.json';
import { SocialLinks } from '#utils/constants.ts';

const generatedAt = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'medium',
	timeStyle: 'short',
	timeZone: 'UTC'
}).format(new Date(summary.generatedAtUtc));

const categories = [
	{
		href: '/items',
		label: 'Items',
		description: 'Weapons, armor, tools, consumables and more.',
		icon: '/assets/items/big_sword.webp',
		count: summary.itemCount,
		unit: 'items'
	},
	{
		href: '/blocks',
		label: 'Blocks',
		description: 'Every placeable block found in the world.',
		icon: '/assets/items/grass.webp',
		count: summary.blockCount,
		unit: 'blocks'
	},
	{
		href: '/creatures',
		label: 'Creatures',
		description: 'Enemies, animals and NPCs that roam Allumeria.',
		icon: '/assets/items/ominous_deer_skull.webp',
		count: summary.creatureCount,
		unit: 'creatures'
	},
	{
		href: '/effects',
		label: 'Effects',
		description: 'Status effects, buffs and debuffs.',
		icon: '/assets/effects/112x368.webp',
		count: summary.effectCount,
		unit: 'effects'
	}
];

const stats = [
	{ label: 'Items', value: summary.itemCount },
	{ label: 'Blocks', value: summary.blockCount },
	{ label: 'Block Models', value: summary.blockModelCount },
	{ label: 'Recipes', value: summary.recipeCount },
	{ label: 'Recipe Aliases', value: summary.recipeAliasCount },
	{ label: 'Creatures', value: summary.creatureCount },
	{ label: 'Effects', value: summary.effectCount },
	{ label: 'Loot', value: summary.lootCount },
	{ label: 'Spawns', value: summary.spawnCount },
	{ label: 'Item Tags', value: summary.itemTagCount }
];

const Page = () => (
	<>
		{/* Hero */}
		<section className="relative mx-auto flex w-full max-w-400 flex-col items-center gap-4 ns-dialog p-8 text-center">
			<p className="text-sm font-semibold tracking-widest text-aqua uppercase">
				{summary.gameVersion}
			</p>
			<p className="-mt-3 text-xs text-muted">
				Data snapshot: {generatedAt} UTC
			</p>
			<h1 className="text-4xl font-bold pixel-shadow md:text-5xl">
				AllumeriaDB
			</h1>
			<p className="max-w-xl text-lg">
				A community database for{' '}
				<a
					href="https://store.steampowered.com/app/3516590/Allumeria/"
					target="_blank"
					rel="noopener noreferrer"
					className="text-aqua underline-offset-2 hocus:underline"
				>
					Allumeria
				</a>{' '}
				— a classic voxel sandbox with in-depth progression through exploration,
				dungeon crawling and boss battles. Discover weapons, abilities,
				resources, enemies, structures and more.
			</p>

			{/* Search */}
			{/* TODO: Client to client side form so it doesn't trigger hard navigation */}
			<form
				action="/search"
				className="flex w-full max-w-lg items-center gap-2"
			>
				{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
				<input
					type="search"
					name="q"
					placeholder="Search items, blocks, creatures…"
					autoComplete="off"
					className="grow ns-input px-2 py-3 placeholder:text-muted hover:ns-input-hover focus:ns-input-active"
				/>
				<Button type="submit" variant="purple">
					Search
				</Button>
			</form>

			{/* Stats bar */}
			<div className="mt-2 flex flex-wrap justify-center gap-6">
				{stats.map(stat => (
					<div key={stat.label} className="flex flex-col items-center gap-0.5">
						<span className="text-2xl font-bold text-aqua pixel-shadow">
							{stat.value.toLocaleString()}
						</span>
						<span className="text-xs">{stat.label}</span>
					</div>
				))}
			</div>
		</section>

		{/* Category cards */}
		<section className="mx-auto flex w-full max-w-400 flex-col gap-3">
			<h2 className="text-xl font-bold pixel-shadow">Browse the Database</h2>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{categories.map(cat => (
					<Link
						key={cat.href}
						href={cat.href}
						className="group flex items-center gap-4 ns-card p-4 transition-opacity active:ns-card-pressed hocus:ns-card-hover"
					>
						<img
							src={cat.icon}
							alt={cat.label}
							width={48}
							height={48}
							className="size-12"
						/>
						<div className="flex shrink flex-col gap-0.5">
							<div className="flex items-baseline gap-2">
								<span className="text-lg font-bold pixel-shadow">
									{cat.label}
								</span>
								<span className="shrink text-xs text-muted">
									{cat.count.toLocaleString()} {cat.unit}
								</span>
							</div>
							<p className="shrink text-sm text-muted">{cat.description}</p>
						</div>
					</Link>
				))}
			</div>
		</section>

		{/* About */}
		<section className="mx-auto flex max-w-400 flex-col gap-3 ns-card p-5">
			<h2 className="text-lg font-bold pixel-shadow">About Allumeria</h2>
			<p className="shrink text-sm leading-relaxed text-muted">
				Allumeria is a classic voxel sandbox with in-depth progression through
				exploration, dungeon crawling and boss battles. With a strong focus on
				discovery, variety and creativity — spend every minute uncovering new
				weapons, abilities, resources, enemies, structures, mechanics and tools.
				This database is automatically generated from game data to help players
				discover items, plan builds, and understand game mechanics.
			</p>
			<div className="flex flex-wrap gap-1">
				{SocialLinks.map(link => (
					<Link
						key={link.href}
						href={link.href}
						target="_blank"
						rel="noopener noreferrer"
						className="-m-1 flex items-center gap-2 transparent-btn pr-2 font-semibold pixel-shadow active:ns-btn-pressed! hocus:ns-btn-hover"
					>
						<img
							src={link.icon}
							alt={link.label}
							width={16}
							height={16}
							className="size-8"
						/>
						{link.label}
					</Link>
				))}
			</div>
		</section>
	</>
);

export default Page;
