'use client';

import z from 'zod';

import Button from '#components/styled/Button.tsx';
import blocks from '#data/blocks.json';
import useSearchParams from '#utils/useSearchParams.ts';

const blockMaterialKeys = Array.from(
	new Set(blocks.map(block => block.material).filter(material => !!material))
);

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
			<div className="flex shrink flex-wrap gap-1">
				<Button
					variant="teal"
					onClick={() => params.set('category', 'all')}
					active={params.category === 'all'}
					className="text-xs"
				>
					ALL
				</Button>
				{blockMaterialKeys.map(material => (
					<Button
						key={material}
						variant="teal"
						onClick={() => params.set('category', material)}
						active={params.category === material}
						className="px-2 text-xs capitalize"
					>
						{material?.replaceAll('_', ' ')}
					</Button>
				))}
			</div>
		</div>
	);
};

export default BlockFilters;
