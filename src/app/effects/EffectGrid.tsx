'use client';

import { Activity } from 'react';

import EffectSlot from '#components/effect/EffectSlot.tsx';
import { type Effect } from '#server/types.ts';
import { type SearchCatalog } from '#utils/searchQuery.ts';
import useGridSearch from '#utils/useGridSearch.ts';

const EffectGridEntry = ({
	effect,
	visible
}: {
	effect: Effect;
	visible: boolean;
}) => (
	<div hidden={!visible} className="contents">
		<EffectSlot effect={effect} />
	</div>
);

const EffectGrid = ({ catalog }: { catalog: SearchCatalog<Effect> }) => {
	const { visible, reset } = useGridSearch(catalog);

	return (
		<>
			{visible.size === 0 && (
				<div className="flex flex-col items-center justify-center gap-2 ns-dialog p-8">
					<p className="text-lg pixel-shadow">No effects found</p>
					<button
						onClick={reset}
						className="cursor-pointer ns-btn px-3 py-1 text-sm pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover"
					>
						Clear search
					</button>
				</div>
			)}
			<Activity mode={visible.size === 0 ? 'hidden' : 'visible'}>
				<div className="grid grid-cols-[repeat(auto-fill,--spacing(18))] justify-center gap-2 ns-dialog p-3">
					{catalog.entries.map(({ record: effect }) => (
						<EffectGridEntry
							key={effect.id}
							effect={effect}
							visible={visible.has(effect)}
						/>
					))}
				</div>
			</Activity>
		</>
	);
};

export default EffectGrid;
