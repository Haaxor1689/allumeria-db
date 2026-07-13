'use client';

import EffectSlot from '#components/effect/EffectSlot.tsx';
import VirtualizedGrid from '#components/VirtualizedGrid.tsx';
import effects from '#data/effects.json';
import { getTranslation } from '#utils/helpers.ts';
import { toDisplayName } from '#utils/index.ts';
import useSearchParams from '#utils/useSearchParams.ts';

import { EffectFiltersSearchSchema } from './EffectFilters';

const EffectGrid = () => {
	const params = useSearchParams(EffectFiltersSearchSchema);

	// Filter effects
	const filteredEffects = effects.filter(effect => {
		const matchesSearch =
			params.search === '' ||
			effect.id.toLowerCase().includes(params.search.toLowerCase()) ||
			getTranslation(`effect.${effect.id}`, toDisplayName(effect.id))
				.toLowerCase()
				.includes(params.search.toLowerCase());

		const matchesCategory =
			params.category === 'all' || effect.effectType === params.category;

		return matchesSearch && matchesCategory;
	});

	return filteredEffects.length === 0 ? (
		<div className="flex flex-col items-center justify-center gap-2 ns-dialog p-8">
			<p className="text-lg pixel-shadow">No effects found</p>
			<button
				onClick={() => params.reset()}
				className="cursor-pointer ns-btn px-3 py-1 text-sm pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover"
			>
				Clear filters
			</button>
		</div>
	) : (
		<VirtualizedGrid
			items={filteredEffects}
			getItemKey={effect => effect.id}
			itemMinWidth="calc(var(--spacing) * 18)"
			itemHeight="calc(var(--spacing) * 18)"
			gap={8}
			overscan={0}
			variant="rarity5"
			renderItem={effect => <EffectSlot effect={effect} />}
		/>
	);
};

export default EffectGrid;
