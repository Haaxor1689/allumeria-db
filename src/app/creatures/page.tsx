import { type Metadata } from 'next';

import Breadcrumbs from '#components/Breadcrumbs.tsx';

import CreatureFilters from './CreatureFilters';
import CreatureGrid from './CreatureGrid';

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
		<h1 className="mb-3 text-3xl font-bold pixel-shadow md:text-4xl">
			Creatures
		</h1>

		<CreatureFilters />

		<CreatureGrid />
	</div>
);

export default Page;
