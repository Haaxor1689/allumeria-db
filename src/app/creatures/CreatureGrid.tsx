'use client';

import CreatureSlot from '#components/creature/CreatureSlot.tsx';
import entities from '#data/entities.json';
import { toDisplayName } from '#utils/index.ts';
import useSearchParams from '#utils/useSearchParams.ts';

import { CreatureFiltersSearchSchema } from './CreatureFilters';

const creatures = entities.filter(e => e.category === 'creature');

const CreatureGrid = () => {
	const params = useSearchParams(CreatureFiltersSearchSchema);

	const filteredCreatures = creatures.filter(e =>
		[
			params.search === '' ||
				e.id.toLowerCase().includes(params.search.toLowerCase()) ||
				toDisplayName(e.id).toLowerCase().includes(params.search.toLowerCase())
		].every(Boolean)
	);

	return filteredCreatures.length === 0 ? (
		<div className="flex flex-col items-center justify-center gap-2 ns-dialog p-8">
			<p className="text-lg pixel-shadow">No creatures found</p>
			<button
				onClick={() => params.reset()}
				className="cursor-pointer ns-btn px-3 py-1 text-sm pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover"
			>
				Clear filters
			</button>
		</div>
	) : (
		<div className="grid grid-cols-[repeat(auto-fill,--spacing(54))] justify-center gap-2 ns-dialog p-3">
			{filteredCreatures.map(creature => (
				<CreatureSlot key={creature.id} creature={creature} />
			))}
		</div>
	);
};

export default CreatureGrid;
