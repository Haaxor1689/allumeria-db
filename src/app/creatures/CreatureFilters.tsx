'use client';

import z from 'zod';

import Button from '#components/styled/Button.tsx';
import useSearchParams from '#utils/useSearchParams.ts';

export const CreatureFiltersSearchSchema = z.object({
	search: z.string().optional().default(''),
	category: z.string().optional().default('all')
});

const CreatureFilters = () => {
	const params = useSearchParams(CreatureFiltersSearchSchema);

	return (
		<div className="flex flex-wrap items-end gap-3 md:justify-between">
			{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
			<input
				type="search"
				placeholder="Search creatures..."
				value={params.search}
				onChange={e => params.set('search', e.target.value)}
				className="w-full ns-input px-3 py-2 hover:ns-input-hover focus:ns-input-active md:max-w-sm"
			/>

			<div className="flex flex-wrap gap-1">
				<Button
					variant="teal"
					onClick={() => params.set('category', 'all')}
					active={params.category === 'all'}
					className="py-1 text-xs"
				>
					ALL
				</Button>
				<Button
					variant="teal"
					onClick={() => params.set('category', 'boss')}
					active={params.category === 'boss'}
					className="py-1 text-xs"
				>
					BOSS
				</Button>
				<Button
					variant="teal"
					onClick={() => params.set('category', 'regular')}
					active={params.category === 'regular'}
					className="py-1 text-xs"
				>
					REGULAR
				</Button>
			</div>
		</div>
	);
};

export default CreatureFilters;
