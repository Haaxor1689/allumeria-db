'use client';

import CreatureSlot from '#components/creature/CreatureSlot.tsx';
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
		<div className="grid grid-cols-[repeat(auto-fill,--spacing(54))] justify-center gap-2 ns-dialog p-3">
			{filteredNPCs.map(npc => (
				<CreatureSlot key={npc.id} creature={npc.entity} />
			))}
		</div>
	);
};

export default NPCGrid;
