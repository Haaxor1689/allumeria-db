'use client';

import z from 'zod';

import ItemSlot from '#components/ItemSlot.tsx';
import VirtualizedGrid from '#components/VirtualizedGrid.tsx';
import items from '#data/items.json';
import { getTranslation } from '#utils/helpers.ts';
import useSearchParams from '#utils/useSearchParams.ts';

const ItemGrid = () => {
	const {
		search = '',
		category = 'all',
		set
	} = useSearchParams(
		z.object({
			search: z.string().optional(),
			category: z.string().optional()
		})
	);

	// Filter items
	const filteredItems = items.filter(item => {
		const matchesSearch =
			search === '' ||
			item.id.toLowerCase().includes(search.toLowerCase()) ||
			getTranslation(`item.${item.id}`)
				.toLowerCase()
				.includes(search.toLowerCase());

		const matchesCategory =
			category === 'all' || item.category?.includes(category);

		return matchesSearch && matchesCategory;
	});

	return filteredItems.length === 0 ? (
		<div className="flex flex-col items-center justify-center gap-2 ns-dialog p-8">
			<p className="text-lg pixel-shadow">No items found</p>
			<button
				onClick={() => {
					set('search');
					set('category');
				}}
				className="cursor-pointer ns-btn px-3 py-1 text-sm pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover"
			>
				Clear filters
			</button>
		</div>
	) : (
		<VirtualizedGrid
			items={filteredItems}
			getItemKey={item => item.id}
			itemMinWidth="calc(var(--spacing) * 18)"
			itemHeight="calc(var(--spacing) * 18)"
			gap={8}
			overscan={0}
			variant="rarity5"
			renderItem={item => <ItemSlot item={item} />}
		/>
	);
};

export default ItemGrid;
