'use client';

import BlockMetaTooltip from '#components/block/BlockMetaTooltip.tsx';
import LootTooltip from '#components/LootTooltip.tsx';
import VirtualizedGrid from '#components/VirtualizedGrid.tsx';
import blocks from '#data/blocks.json';
import { getBlockName } from '#utils/helpers.ts';
import useSearchParams from '#utils/useSearchParams.ts';

import BlockSlot from '../../components/block/BlockSlot';
import { BlockFiltersSearchSchema } from './BlockFilters';

const BlockGrid = () => {
	const params = useSearchParams(BlockFiltersSearchSchema);

	const searchTerm = params.search.toLowerCase();

	const filteredBlocks = blocks.filter(block =>
		[
			params.search === '' ||
				block.id.toLowerCase().includes(searchTerm) ||
				getBlockName(block).toLowerCase().includes(searchTerm),
			params.material === 'all' || block.material === params.material,
			!params.canSpawn || !!block.spawn,
			!params.canShape || !!block.canBeShaped,
			!params.needsSupport || !!block.needsSupport,
			!params.decoration || !!block.decorationScore,
			!params.interactable || !!block.interactible,
			!params.craftingStation || !!block.craftingStation,
			!params.crop || !!block.harvestLoot,
			!params.lightSource || !!block.lightEmission
		].every(Boolean)
	);

	return filteredBlocks.length === 0 ? (
		<div className="flex flex-col items-center justify-center gap-2 ns-dialog p-8">
			<p className="text-lg pixel-shadow">No blocks found</p>
			<button
				onClick={() => params.reset()}
				className="cursor-pointer ns-btn px-3 py-1 text-sm pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover"
			>
				Clear filters
			</button>
		</div>
	) : (
		<VirtualizedGrid
			items={filteredBlocks}
			getItemKey={block => block.id}
			itemMinWidth="calc(var(--spacing) * 26)"
			itemHeight="calc(var(--spacing) * 26)"
			rows={8}
			gap={8}
			overscan={0}
			variant="rarity5"
			renderItem={block => (
				<BlockSlot
					block={block}
					tooltipExtra={[
						<LootTooltip
							key="loot"
							id={block.loot}
							fallbackItem={block.item ?? block.id}
						/>,
						<LootTooltip
							key="harvest"
							id={block.harvestLoot}
							variant="harvest"
						/>,
						<BlockMetaTooltip key="meta" block={block} />
					]}
				/>
			)}
		/>
	);
};

export default BlockGrid;
