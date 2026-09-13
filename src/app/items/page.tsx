import { type Metadata } from 'next';

import Breadcrumbs from '#components/Breadcrumbs.tsx';

import ItemFilters from './ItemFilters';
import ItemGrid from './ItemGrid';

export const metadata: Metadata = {
	title: 'Items',
	description:
		'Browse Allumeria items, weapons, tools, materials, recipes, effects, and loot sources.',
	alternates: { canonical: '/items' }
};

const Page = () => (
	<div className="mx-auto flex w-full max-w-294 flex-col gap-1">
		<Breadcrumbs
			items={[{ label: 'Home', href: '/' }, { label: 'Items' }]}
			className="self-start"
		/>
		<h1 className="my-3 text-3xl font-bold pixel-shadow md:text-4xl">Items</h1>

		<ItemFilters />

		<ItemGrid />
	</div>
);

export default Page;
