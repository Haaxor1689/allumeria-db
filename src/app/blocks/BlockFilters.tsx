'use client';

import { Fragment } from 'react/jsx-runtime';
import z from 'zod';

import Button from '#components/styled/Button.tsx';
import Dialog, { closeDialog } from '#components/styled/Dialog.tsx';
import Select from '#components/styled/Select.tsx';
import blocks from '#data/blocks.json';
import { toDisplayName } from '#utils/index.ts';
import useSearchParams from '#utils/useSearchParams.ts';

const blockMaterialKeys = Array.from(
	new Set(blocks.map(block => block.material).filter(material => !!material))
).filter(v => v !== undefined);

export const BlockFiltersSearchSchema = z.object({
	search: z.string().optional().default(''),
	material: z.string().optional().default('all'),
	canSpawn: z.coerce
		.boolean()
		.optional()
		.default(false)
		.describe('Allows monster spawning'),
	canShape: z.coerce
		.boolean()
		.optional()
		.default(false)
		.describe('Can be shaped'),
	needsSupport: z.coerce
		.boolean()
		.optional()
		.default(false)
		.describe('Needs support block'),
	decoration: z.coerce
		.boolean()
		.optional()
		.default(false)
		.describe('Is a decoration'),
	interactable: z.coerce
		.boolean()
		.optional()
		.default(false)
		.describe('Is interactable'),
	craftingStation: z.coerce
		.boolean()
		.optional()
		.default(false)
		.describe('Is a crafting station'),
	crop: z.coerce.boolean().optional().default(false).describe('Is a crop'),
	lightSource: z.coerce
		.boolean()
		.optional()
		.default(false)
		.describe('Is a light source')
});

const BlockFilters = () => {
	const params = useSearchParams(BlockFiltersSearchSchema);

	return (
		<div className="flex flex-wrap items-end gap-2">
			<div className="grow">
				{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
				<input
					type="search"
					placeholder="Search blocks..."
					value={params.search}
					onChange={e => params.set('search', e.target.value)}
					className="w-full ns-input px-3 py-2 hover:ns-input-hover focus:ns-input-active md:max-w-sm"
				/>
			</div>

			<Select
				label="Material"
				value={params.material}
				onChange={value => params.set('material', value ?? 'all')}
				options={['all', ...blockMaterialKeys]}
				getKey={v => v}
				getLabel={toDisplayName}
			/>
			<Dialog
				trigger={open => (
					<Button variant="purple" onClick={open}>
						Filters:{' '}
						{
							Object.entries(BlockFiltersSearchSchema.shape).filter(
								([key, schema]) =>
									schema.description && params[key as keyof typeof params]
							).length
						}
					</Button>
				)}
				containerClassName="w-screen max-w-160"
				contentClassName="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 ns-dialog p-2 md:p-4"
			>
				<p className="col-span-2 mb-2 text-4xl font-bold pixel-shadow">
					Filter by:
				</p>
				{Object.entries(BlockFiltersSearchSchema.shape).map(([key, schema]) => {
					const value = params[key as keyof typeof params];
					return schema.description ? (
						<Fragment key={key}>
							<p className="grow text-lg font-bold pixel-shadow">
								{schema.description}:
							</p>
							<Button
								variant={value ? 'positive' : 'negative'}
								onClick={() => params.set(key, !value)}
								className="-mr-2 px-0 text-start md:w-32"
							>
								{value ? 'On' : 'Off'}
							</Button>
						</Fragment>
					) : null;
				})}
				<Button
					onClick={closeDialog}
					className="col-span-2 -mx-2 -mb-2 self-stretch"
				>
					Back
				</Button>
			</Dialog>
			<Button variant="red" onClick={() => params.reset()}>
				Clear all
			</Button>
		</div>
	);
};

export default BlockFilters;
