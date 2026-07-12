'use client';

import z from 'zod';

import Select from '#components/styled/Select.tsx';
import blocks from '#data/blocks.json';
import useSearchParams from '#utils/useSearchParams.ts';

const blockMaterialKeys = Array.from(
	new Set(blocks.map(block => block.material).filter(material => !!material))
).filter(v => v !== undefined);

export const BlockFiltersSearchSchema = z.object({
	search: z.string().optional().default(''),
	category: z.string().optional().default('all')
});

const BlockFilters = () => {
	const params = useSearchParams(BlockFiltersSearchSchema);

	return (
		<div className="flex flex-wrap items-end gap-3 md:justify-between">
			{/* Search */}
			{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
			<input
				type="search"
				placeholder="Search blocks..."
				value={params.search}
				onChange={e => params.set('search', e.target.value)}
				className="w-full ns-input px-3 py-2 hover:ns-input-hover focus:ns-input-active md:max-w-sm"
			/>

			{/* Material filter */}
			<Select
				label="Material"
				value={params.category}
				onChange={value => params.set('category', value ?? 'all')}
				options={['all', ...blockMaterialKeys]}
				getKey={material => material}
				getLabel={material => material.replaceAll('_', ' ')}
			/>
		</div>
	);
};

export default BlockFilters;
