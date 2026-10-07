'use client';

import CostTooltip from '#components/item/CostTooltip.tsx';
import ItemMetaTooltip from '#components/item/ItemMetaTooltip.tsx';
import ItemSlot from '#components/item/ItemSlot.tsx';
import RecipeTooltip from '#components/item/RecipeTooltip.tsx';
import items from '#data/items.json';
import recipes from '#data/recipes.json';
import { getTranslation } from '#utils/helpers.ts';
import useSearchParams from '#utils/useSearchParams.ts';

import { ItemFiltersSearchSchema } from './ItemFilters';

const ItemGrid = () => {
	const params = useSearchParams(ItemFiltersSearchSchema);

	// Filter items
	const filteredItems = items.filter(item => {
		const matchesSearch =
			params.search === '' ||
			item.id.toLowerCase().includes(params.search.toLowerCase()) ||
			getTranslation(`item.${item.id}`)
				.toLowerCase()
				.includes(params.search.toLowerCase());

		const matchesCategory =
			params.category === 'all' || item.category?.includes(params.category);

		return matchesSearch && matchesCategory;
	});

	return filteredItems.length === 0 ? (
		<div className="flex flex-col items-center justify-center gap-2 ns-dialog p-8">
			<p className="text-lg pixel-shadow">No items found</p>
			<button
				onClick={() => params.reset()}
				className="cursor-pointer ns-btn px-3 py-1 text-sm pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover"
			>
				Clear filters
			</button>
		</div>
	) : (
		<div className="grid grid-cols-[repeat(auto-fill,calc(var(--spacing)*18))] justify-center gap-2 ns-dialog p-3">
			{filteredItems.map(item => (
				<ItemSlot
					key={item.id}
					item={item}
					tooltipExtra={
						<>
							{recipes
								.filter(r => r.result === item.id)
								.map((recipe, idx) => (
									<RecipeTooltip key={idx} recipe={recipe} />
								))}
							<CostTooltip value={item.sellValue ?? 0} />
							<ItemMetaTooltip item={item} />
						</>
					}
				/>
			))}
		</div>
	);
};

export default ItemGrid;
