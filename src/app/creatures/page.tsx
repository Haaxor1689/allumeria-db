import { type Metadata } from 'next';

import Breadcrumbs from '#components/Breadcrumbs.tsx';
import QuerySearch from '#components/QuerySearch.tsx';
import entities from '#data/entities.json';
import { getCreatureName } from '#utils/helpers.ts';
import { createSearchCatalog } from '#utils/searchQuery.ts';

import CreatureGrid from './CreatureGrid';

export const creatureEntityDescriptions = {
	id: 'Creature entity class name',
	health: 'Maximum health',
	defence: 'Damage reduction',
	baseDamage: 'Base attack damage',
	walkSpeed: 'Movement speed',
	flying: 'Whether the creature can fly',
	canSpawnInSunlight: 'Whether it can spawn in sunlight',
	model: 'Model resource key (relative path to /res/models)',
	texture: 'Texture resource key (relative path to /res/textures)',
	minCoinDrop: 'Minimum coins droped on death',
	maxCoinDrop: 'Maximum coins drop on death',
	loot: 'Items dropped when defeated'
};

const creatureSearch = createSearchCatalog({
	records: entities.filter(entity => entity.category === 'creature'),
	getView: creature => ({ ...creature, name: getCreatureName(creature) }),
	descriptions: creatureEntityDescriptions
});

export const metadata: Metadata = {
	title: 'Creatures',
	description:
		'Browse Allumeria creatures, monsters, spawn locations, loot drops, and related game data.',
	alternates: { canonical: '/creatures' }
};

const Page = () => (
	<div className="mx-auto flex w-full max-w-294 flex-col gap-1">
		<Breadcrumbs
			items={[{ label: 'Home', href: '/' }, { label: 'Creatures' }]}
			className="self-start"
		/>
		<div className="my-3 grid grid-cols-1 items-start gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-6">
			<h1 className="text-3xl font-bold pixel-shadow md:text-4xl">Creatures</h1>
			<QuerySearch catalog={creatureSearch} label="Search creatures" />
		</div>

		<CreatureGrid catalog={creatureSearch} />
	</div>
);

export default Page;
