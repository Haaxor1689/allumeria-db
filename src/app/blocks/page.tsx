import { type Metadata } from 'next';

import Breadcrumbs from '#components/Breadcrumbs.tsx';
import QuerySearch from '#components/QuerySearch.tsx';
import blocks from '#data/blocks.json';
import { getBlockName } from '#utils/helpers.ts';
import { createSearchCatalog } from '#utils/searchQuery.ts';

import BlockGrid from './BlockGrid';

const blockSearch = createSearchCatalog({
	records: blocks,
	getView: block => ({
		...block,
		name: getBlockName(block)
	}),
	descriptions: {
		id: 'String identifier',
		name: 'English block name',
		class: 'Class name of the custom block subclass',
		blockModel: 'Static identifier of the block model',
		material: 'Material and mining properties',
		hidden: 'Whether the block is hidden in creative menu',
		textures: 'Array of texture file resources, depends on the block model',
		spawn: 'Natural spawn location',
		craftingStation: 'Crafting station associated with the block',
		harvestLoot: 'On harvest loot table static identifier',
		catalogue: 'Shop catalogue static identifier',
		decorationScore: 'Comfort value as a decoration',
		canBeShaped: 'Whether the block can be shaped',
		canBeFelled: 'Whether the block can be felled with an axe',
		needsSupport: 'Whether the block requires solid block beneath it',
		interactible: 'Whether the block can be interacted with using right click',
		loot: 'On break loot table static identifier (overrides item if set)',
		item: 'Override of an item the block drops',
		standOnEffect: 'Effect applied while standing on the block',
		isMutated: 'Whether the block is a mutated variant',
		keyItem: 'KeyItem needed to unlocked this block'
	}
});

export const metadata: Metadata = {
	title: 'Blocks',
	description:
		'Browse Allumeria blocks, materials, crafting stations, drops, spawning, and related properties.',
	alternates: { canonical: '/blocks' }
};

const Page = () => (
	<div className="mx-auto flex w-full max-w-294 flex-col gap-1">
		<Breadcrumbs
			items={[{ label: 'Home', href: '/' }, { label: 'Blocks' }]}
			className="self-start"
		/>
		<div className="my-3 grid grid-cols-1 items-start gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-6">
			<h1 className="text-3xl font-bold pixel-shadow md:text-4xl">Blocks</h1>
			<QuerySearch catalog={blockSearch} label="Search blocks" />
		</div>

		<BlockGrid catalog={blockSearch} />
	</div>
);

export default Page;
