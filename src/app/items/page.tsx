import { type Metadata } from 'next';

import ItemFilters from './ItemFilters';
import ItemGrid from './ItemGrid';

export const metadata: Metadata = {
	title: 'Items'
};

const Page = () => (
	<div className="mx-auto flex w-full max-w-292 flex-col gap-1">
		{/* Header */}
		<h1 className="mb-3 text-3xl font-bold pixel-shadow md:text-4xl">Items</h1>

		{/* Search & Filter */}
		<ItemFilters />

		{/* Results */}
		<ItemGrid />
	</div>
);

export default Page;
