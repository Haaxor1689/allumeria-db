'use client';

import z from 'zod';

import useSearchParams from '#utils/useSearchParams.ts';

export const NPCFiltersSearchSchema = z.object({
	search: z.string().optional().default('')
});

const NPCFilters = () => {
	const params = useSearchParams(NPCFiltersSearchSchema);

	return (
		<div className="flex flex-wrap items-end gap-3 md:justify-between">
			{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
			<input
				type="search"
				placeholder="Search NPCs..."
				value={params.search}
				onChange={e => params.set('search', e.target.value)}
				className="w-full ns-input px-3 py-2 hover:ns-input-hover focus:ns-input-active md:max-w-sm"
			/>
		</div>
	);
};

export default NPCFilters;
