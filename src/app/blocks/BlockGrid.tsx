'use client';

import VirtualizedGrid from '#components/VirtualizedGrid.tsx';
import blocks from '#data/blocks.json';
import { getTranslation } from '#utils/helpers.ts';
import useSearchParams from '#utils/useSearchParams.ts';

import BlockSlot from '../../components/BlockSlot';
import { BlockFiltersSearchSchema } from './BlockFilters';

const BlockGrid = () => {
	const params = useSearchParams(BlockFiltersSearchSchema);

	const searchTerm = params.search.toLowerCase();

	const filteredBlocks = blocks.filter(block => {
		const translatedName = getTranslation(
			`item.${block.item ?? block.id}`
		).toLowerCase();
		const matchesSearch =
			params.search === '' ||
			block.id.toLowerCase().includes(searchTerm) ||
			translatedName.includes(searchTerm);

		const matchesCategory =
			params.category === 'all' || block.material === params.category;

		return matchesSearch && matchesCategory;
	});

	return filteredBlocks.length === 0 ? (
		<div className="flex flex-col items-center justify-center gap-2 ns-dialog p-8">
			<p className="text-lg pixel-shadow">No blocks found</p>
			<button
				onClick={() => {
					params.set('search');
					params.set('category');
				}}
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
			renderItem={block => <BlockSlot block={block} />}
		/>
	);
};

export default BlockGrid;
