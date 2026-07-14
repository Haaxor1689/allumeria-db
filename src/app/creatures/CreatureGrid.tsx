'use client';

import CreatureSlot from '#components/creature/CreatureSlot.tsx';
import VirtualizedGrid from '#components/VirtualizedGrid.tsx';
import creatures from '#data/creatures.json';
import { toDisplayName } from '#utils/index.ts';
import useSearchParams from '#utils/useSearchParams.ts';

import { CreatureFiltersSearchSchema } from './CreatureFilters';

const CreatureGrid = () => {
	const params = useSearchParams(CreatureFiltersSearchSchema);

	const filteredCreatures = creatures.filter(creature => {
		const matchesSearch =
			params.search === '' ||
			creature.id.toLowerCase().includes(params.search.toLowerCase()) ||
			toDisplayName(creature.id)
				.toLowerCase()
				.includes(params.search.toLowerCase());

		const matchesCategory =
			params.category === 'all' ||
			(params.category === 'boss' && creature.boss === true) ||
			(params.category === 'regular' && !creature.boss);

		return matchesSearch && matchesCategory;
	});

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
		<VirtualizedGrid
			items={filteredCreatures}
			getItemKey={creature => creature.id}
			itemMinWidth="calc(var(--spacing) * 54)"
			itemHeight="calc(var(--spacing) * 81)"
			gap={8}
			rows={3}
			overscan={0}
			renderItem={creature => <CreatureSlot creature={creature} />}
		/>
	);
};

export default CreatureGrid;
