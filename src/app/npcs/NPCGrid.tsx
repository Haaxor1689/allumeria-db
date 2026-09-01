'use client';

import CreatureSlot from '#components/creature/CreatureSlot.tsx';
import VirtualizedGrid from '#components/VirtualizedGrid.tsx';
import { npcDataExt } from '#utils/helpers.ts';
import useSearchParams from '#utils/useSearchParams.ts';

import { NPCFiltersSearchSchema } from './NPCFilters';

const NPCGrid = () => {
	const params = useSearchParams(NPCFiltersSearchSchema);

	const filteredNPCs = npcDataExt.filter(e =>
		[
			params.search === '' ||
				e.id.toLowerCase().includes(params.search.toLowerCase())
		].every(Boolean)
	);

	return filteredNPCs.length === 0 ? (
		<div className="flex flex-col items-center justify-center gap-2 ns-dialog p-8">
			<p className="text-lg pixel-shadow">No NPCs found</p>
			<button
				onClick={() => params.reset()}
				className="cursor-pointer ns-btn px-3 py-1 text-sm pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover"
			>
				Clear filters
			</button>
		</div>
	) : (
		<VirtualizedGrid
			items={filteredNPCs}
			getItemKey={npc => npc.id}
			itemMinWidth="calc(var(--spacing) * 54)"
			itemHeight="calc(var(--spacing) * 81)"
			gap={8}
			rows={3}
			overscan={0}
			renderItem={npc => <CreatureSlot creature={npc.entity} />}
		/>
	);
};

export default NPCGrid;
