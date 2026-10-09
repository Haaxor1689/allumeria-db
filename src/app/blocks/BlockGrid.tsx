'use client';

import { Activity } from 'react';

import BlockMetaTooltip from '#components/block/BlockMetaTooltip.tsx';
import LootTooltip from '#components/LootTooltip.tsx';
import { type Block } from '#server/types.ts';
import { type SearchCatalog } from '#utils/searchQuery.ts';
import useGridSearch from '#utils/useGridSearch.ts';

import BlockSlot from '../../components/block/BlockSlot';

const BlockGridEntry = ({
	block,
	visible
}: {
	block: Block;
	visible: boolean;
}) => (
	<div hidden={!visible} className="contents">
		<BlockSlot
			block={block}
			tooltipExtra={[
				<LootTooltip
					key="loot"
					id={block.loot}
					fallbackItem={block.item ?? block.id}
					title="Drops"
				/>,
				<LootTooltip
					key="harvest"
					id={block.harvestLoot}
					variant="green"
					title="Harvest"
				/>,
				<BlockMetaTooltip key="meta" block={block} />
			]}
		/>
	</div>
);

const BlockGrid = ({ catalog }: { catalog: SearchCatalog<Block> }) => {
	const { visible, reset } = useGridSearch(catalog);

	return (
		<>
			{visible.size === 0 && (
				<div className="flex flex-col items-center justify-center gap-2 ns-dialog p-8">
					<p className="text-lg pixel-shadow">No blocks found</p>
					<button
						onClick={reset}
						className="cursor-pointer ns-btn px-3 py-1 text-sm pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover"
					>
						Clear search
					</button>
				</div>
			)}
			<Activity mode={visible.size === 0 ? 'hidden' : 'visible'}>
				<div className="grid grid-cols-[repeat(auto-fill,--spacing(26))] justify-center gap-2 ns-dialog p-3">
					{catalog.entries.map(({ record: block }) => (
						<BlockGridEntry
							key={block.id}
							block={block}
							visible={visible.has(block)}
						/>
					))}
				</div>
			</Activity>
		</>
	);
};

export default BlockGrid;
