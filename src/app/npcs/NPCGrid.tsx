'use client';

import { Activity } from 'react';

import CreatureSlot from '#components/creature/CreatureSlot.tsx';
import { type npcDataExt } from '#utils/helpers.ts';
import { type SearchCatalog } from '#utils/searchQuery.ts';
import useGridSearch from '#utils/useGridSearch.ts';

type NPC = (typeof npcDataExt)[number];

const NPCGridEntry = ({ npc, visible }: { npc: NPC; visible: boolean }) => (
	<div hidden={!visible} className="contents">
		<CreatureSlot creature={npc.entity} />
	</div>
);

const NPCGrid = ({ catalog }: { catalog: SearchCatalog<NPC> }) => {
	const { visible, reset } = useGridSearch(catalog);

	return (
		<>
			{visible.size === 0 && (
				<div className="flex flex-col items-center justify-center gap-2 ns-dialog p-8">
					<p className="text-lg pixel-shadow">No NPCs found</p>
					<button
						onClick={reset}
						className="cursor-pointer ns-btn px-3 py-1 text-sm pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover"
					>
						Clear search
					</button>
				</div>
			)}
			<Activity mode={visible.size === 0 ? 'hidden' : 'visible'}>
				<div className="grid grid-cols-[repeat(auto-fill,--spacing(54))] justify-center gap-2 ns-dialog p-3">
					{catalog.entries.map(({ record: npc }) => (
						<NPCGridEntry key={npc.id} npc={npc} visible={visible.has(npc)} />
					))}
				</div>
			</Activity>
		</>
	);
};

export default NPCGrid;
