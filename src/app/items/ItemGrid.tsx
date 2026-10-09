'use client';

import CostTooltip from '#components/item/CostTooltip.tsx';
import ItemMetaTooltip from '#components/item/ItemMetaTooltip.tsx';
import ItemSlot from '#components/item/ItemSlot.tsx';
import RecipeTooltip from '#components/item/RecipeTooltip.tsx';
import recipes from '#data/recipes.json';
import { type Item } from '#server/types.ts';
import { type SearchCatalog } from '#utils/searchQuery.ts';
import useGridSearch from '#utils/useGridSearch.ts';

const recipesByResult = Map.groupBy(recipes, r => r.result);

const ItemGridEntry = ({ item, visible }: { item: Item; visible: boolean }) => (
	<div hidden={!visible} className="contents">
		<ItemSlot
			item={item}
			tooltipExtra={
				<>
					{recipesByResult.get(item.id)?.map((recipe, idx) => (
						<RecipeTooltip key={idx} recipe={recipe} />
					))}
					<CostTooltip value={item.sellValue ?? 0} />
					<ItemMetaTooltip item={item} />
				</>
			}
		/>
	</div>
);

const ItemGrid = ({ catalog }: { catalog: SearchCatalog<Item> }) => {
	const { visible, reset } = useGridSearch(catalog);

	return (
		<>
			{visible.size === 0 && (
				<div className="flex flex-col items-center justify-center gap-2 ns-dialog p-8">
					<p className="text-lg pixel-shadow">No items found</p>
					<button
						onClick={reset}
						className="cursor-pointer ns-btn px-3 py-1 text-sm pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover"
					>
						Clear search
					</button>
				</div>
			)}
			<div
				hidden={visible.size === 0}
				className="grid grid-cols-[repeat(auto-fill,--spacing(18))] justify-between gap-2 ns-dialog p-3"
			>
				{catalog.entries.map(({ record: item }) => (
					<ItemGridEntry
						key={item.id}
						item={item}
						visible={visible.has(item)}
					/>
				))}
			</div>
		</>
	);
};

export default ItemGrid;
