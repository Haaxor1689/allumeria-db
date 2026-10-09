import { type Metadata } from 'next';

import { creatureEntityDescriptions } from '#app/creatures/page.tsx';
import Breadcrumbs from '#components/Breadcrumbs.tsx';
import QuerySearch from '#components/QuerySearch.tsx';
import { npcDataExt } from '#utils/helpers.ts';
import { createSearchCatalog } from '#utils/searchQuery.ts';

import NPCGrid from './NPCGrid';

const npcSearch = createSearchCatalog({
	records: npcDataExt,
	descriptions: {
		'id': 'NPC static name',
		'entity.id': 'Creature entity class name',
		'catalogue': 'Shop catalogue',
		'comfortRequirements': 'Room comfort requirements',
		...Object.fromEntries(
			Object.entries(creatureEntityDescriptions).map(([key, value]) => [
				`entity.${key}`,
				value
			])
		)
	}
});

export const metadata: Metadata = {
	title: 'NPCs',
	description:
		'Browse Allumeria NPCs, shops, trading catalogues, comfort requirements, and related game data.',
	alternates: { canonical: '/npcs' }
};

const Page = () => (
	<div className="mx-auto flex w-full max-w-294 flex-col gap-1">
		<Breadcrumbs
			items={[{ label: 'Home', href: '/' }, { label: 'NPCs' }]}
			className="self-start"
		/>
		<div className="my-3 grid grid-cols-1 items-start gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-6">
			<h1 className="text-3xl font-bold pixel-shadow md:text-4xl">NPCs</h1>
			<QuerySearch catalog={npcSearch} label="Search NPCs" />
		</div>

		<NPCGrid catalog={npcSearch} />
	</div>
);

export default Page;
