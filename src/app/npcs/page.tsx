import { type Metadata } from 'next';

import Breadcrumbs from '#components/Breadcrumbs.tsx';

import NPCFilters from './NPCFilters';
import NPCGrid from './NPCGrid';

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
		<h1 className="mb-3 text-3xl font-bold pixel-shadow md:text-4xl">NPCs</h1>

		<NPCFilters />

		<NPCGrid />
	</div>
);

export default Page;
