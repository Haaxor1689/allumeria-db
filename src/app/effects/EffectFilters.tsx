'use client';

import z from 'zod';

import Button from '#components/styled/Button.tsx';
import effects from '#data/effects.json';
import useSearchParams from '#utils/useSearchParams.ts';

const EffectTypes = Array.from(
	new Set(effects.map(effect => effect.effectType))
);

export const EffectFiltersSearchSchema = z.object({
	search: z.string().optional().default(''),
	category: z.string().optional().default('all')
});

const EffectFilters = () => {
	const params = useSearchParams(EffectFiltersSearchSchema);

	return (
		<div className="flex flex-wrap items-end gap-3 md:justify-between">
			{/* Search */}
			{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
			<input
				type="search"
				placeholder="Search effects..."
				value={params.search}
				onChange={e => params.set('search', e.target.value)}
				className="w-full ns-input px-3 py-2 hover:ns-input-hover focus:ns-input-active md:max-w-sm"
			/>

			{/* Category filter */}
			<div className="flex flex-wrap gap-1">
				<Button
					variant="teal"
					onClick={() => params.set('category', 'all')}
					active={params.category === 'all'}
					className="py-1 text-xs"
				>
					ALL
				</Button>
				{EffectTypes.map(effectType => (
					<Button
						key={effectType}
						variant="teal"
						onClick={() => params.set('category', effectType)}
						active={params.category === effectType}
						className="py-1 text-xs"
					>
						{effectType}
					</Button>
				))}
			</div>
		</div>
	);
};

export default EffectFilters;
