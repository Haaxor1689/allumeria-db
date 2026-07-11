'use client';

import z from 'zod';

import Button from '#components/styled/Button.tsx';
import { ItemCategories } from '#utils/constants.ts';
import useSearchParams from '#utils/useSearchParams.ts';

export const ItemFiltersSearchSchema = z.object({
	search: z.string().optional().default(''),
	category: z.string().optional().default('all')
});

const ItemFilters = () => {
	const params = useSearchParams(ItemFiltersSearchSchema);

	return (
		<div className="flex flex-wrap items-end gap-3 md:justify-between">
			{/* Search */}
			{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
			<input
				type="search"
				placeholder="Search items…"
				value={params.search}
				onChange={e => params.set('search', e.target.value)}
				className="w-full ns-input px-3 py-2 hover:ns-input-hover focus:ns-input-active md:max-w-sm"
			/>

			{/* Category filter */}
			<div className="flex flex-wrap gap-1">
				<Button
					variant="teal"
					size="icon"
					onClick={() => params.set('category', 'all')}
					active={params.category === 'all'}
					className="text-xs"
				>
					ALL
				</Button>
				{Object.entries(ItemCategories)
					.filter(([cat]) => cat !== 'all')
					.map(([key, { label, icon }]) => (
						<Button
							key={key}
							variant="teal"
							size="icon"
							onClick={() => params.set('category', key)}
							active={params.category === key}
						>
							<img src={icon} alt={label} width={16} height={16} />
						</Button>
					))}
			</div>
		</div>
	);
};

export default ItemFilters;
