import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Fragment } from 'react/jsx-runtime';

import BlockRender from '#components/block/BlockRender.tsx';
import CreatureSlot from '#components/creature/CreatureSlot.tsx';
import EffectLink from '#components/effect/EffectLink.tsx';
import Img from '#components/Img.tsx';
import CostTooltip from '#components/item/CostTooltip.tsx';
import ItemSlot from '#components/item/ItemSlot.tsx';
import RecipeTooltip from '#components/item/RecipeTooltip.tsx';
import LootTooltip from '#components/LootTooltip.tsx';
import AlertMessage from '#components/styled/AlertMessage.tsx';
import ScrollArea from '#components/styled/ScrollArea.tsx';
import TooltipEntry from '#components/TooltipEntry.tsx';
import blockMaterials from '#data/block_materials.json';
import blocks from '#data/blocks.json';
import catalogues from '#data/catalogues.json';
import creatures from '#data/creatures.json';
import effects from '#data/effects.json';
import items from '#data/items.json';
import recipes from '#data/recipes.json';
import spawn from '#data/spawn.json';
import structures from '#data/structures.json';
import { getBlockName, getTool, getTranslation } from '#utils/helpers.ts';
import { toDisplayName } from '#utils/index.ts';

import ItemLink from '../../../components/item/ItemLink';

export const generateStaticParams = () =>
	Array.from(new Set(blocks.map(block => block.id))).map(id => ({ id }));

export const generateMetadata = async ({
	params
}: PageProps<'/blocks/[id]'>): Promise<Metadata> => {
	const { id } = await params;
	const block = blocks.find(block => block.id === id);
	if (!block) return { title: 'Block not found' };
	return { title: getBlockName(block) };
};

const Page = async ({ params }: PageProps<'/blocks/[id]'>) => {
	const { id } = await params;
	const block = blocks.find(block => block.id === id);

	if (!block) notFound();

	const name = getBlockName(block);

	const keyItem = items.find(item => item.id === block.keyItem);

	const material = blockMaterials.find(mat => mat.id === block.material);
	const preferredTool = getTool(material?.preferredTool ?? 'hand');
	const hammerTool = getTool('hammer');

	const effect = block.standOnEffect
		? effects.find(e => e.id === block.standOnEffect)
		: null;

	const spawnTable = spawn
		.find(s => s.id === block.spawn)
		?.entries.map(s => {
			const monster = creatures.find(c => c.id === s.monster);
			if (!monster) return null;
			return { ...s, monster };
		})
		.filter(v => v !== null);

	const canContain = structures
		.flatMap(s =>
			s.chests
				.filter(c => c.chest === block.id)
				.map(c => ({ loot: c.loot, structure: s.id }))
		)
		.filter(
			(v, i, arr) =>
				arr.findIndex(
					item => item.loot === v.loot && item.structure === v.structure
				) === i
		);

	const catalogue = catalogues
		.find(c => c.id === block.catalogue)
		?.entries.map(entry => {
			const item = items.find(i => i.id === entry.item);
			if (!item) return null;
			return { item, amount: entry.amount, price: entry.price };
		})
		.filter(v => v !== null);

	const canCraft = recipes
		.filter(r => r.station === block.craftingStation)
		.map(r => {
			const item = items.find(i => i.id === r.result);
			if (!item) return null;
			return { ...r, item };
		})
		.filter(v => v !== null);

	return (
		<div className="mx-auto flex w-full max-w-294 flex-col gap-10 ns-dialog p-4 2xl:block 2xl:space-y-10">
			<div className="mx-auto -mt-6 mb-0 w-full max-w-120 2xl:float-right 2xl:mt-0 2xl:ml-6">
				<BlockRender block={block} />
			</div>

			<Link
				href="/blocks"
				className="-order-1 -mb-8 block self-start text-muted underline 2xl:mb-2 hocus:text-aqua"
			>
				&lt; Back to blocks
			</Link>
			<h1 className="-order-1 flex items-center gap-2 pb-4 text-4xl font-bold pixel-shadow md:text-5xl">
				<div className="flex size-18 items-center justify-center ns-borderless-slot">
					<Img
						src={`/previews/blocks/${block.id}.webp`}
						alt={name}
						fallback="/previews/blocks/missing.webp"
						className="size-16"
					/>
				</div>
				{name}
			</h1>

			<div className="flex flex-col gap-4">
				<p>No community description available yet.</p>
				{block.decorationScore ? (
					<TooltipEntry
						key="decoration"
						icon="/assets/icons/category_decoration.webp"
					>
						Decoration: {block.decorationScore}
					</TooltipEntry>
				) : null}
				{block.needsSupport ? (
					<TooltipEntry key="needsSupport" icon="/assets/item_tags/48x320.webp">
						Needs support
					</TooltipEntry>
				) : null}
				{block.harvestLoot ? (
					<TooltipEntry
						key="harvestLoot"
						icon="/assets/icons/category_natural.webp"
					>
						Harvestable
					</TooltipEntry>
				) : block.interactible ? (
					<TooltipEntry key="interactible" icon="/assets/item_tags/56x320.webp">
						Interactible
					</TooltipEntry>
				) : null}

				{keyItem && (
					<AlertMessage>
						Can be unlocked with <ItemLink item={keyItem} />
					</AlertMessage>
				)}
				{block.spreadsSelf ? (
					<AlertMessage>Spreads itself to nearby blocks</AlertMessage>
				) : null}
				{block.lightEmission ? (
					<TooltipEntry key="lightEmission" icon="/custom/light.webp">
						Emits light:{' '}
						<div
							className="size-5 border border-white"
							style={{
								backgroundColor: `rgb(${block.lightEmission.map(v => v * 256).join(',')})`
							}}
						/>
					</TooltipEntry>
				) : null}
				{effect ? (
					<p key="effect" className="text-muted">
						You will gain <EffectLink effect={effect} /> effect when standing on{' '}
						{name} block
					</p>
				) : null}
				{block.craftingStation ? (
					<p key="craftingStation" className="text-muted">
						Serves as a{' '}
						{getTranslation(`crafting_station.${block.craftingStation}`)}
					</p>
				) : null}
				{block.isMutated && (
					<AlertMessage>
						{name} block can be obtained through the crop mutation mechanic.
					</AlertMessage>
				)}
			</div>

			{material && (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						Material:
					</h2>

					<p>
						{name} block is made of{' '}
						<span className="text-aqua">{toDisplayName(material.id)}</span>{' '}
						material which is best mined with a{' '}
						<span className="text-aqua">
							<img
								src={preferredTool.icon}
								alt={preferredTool.label}
								className="inline size-6"
							/>{' '}
							{preferredTool.label} {material.miningLevel}
						</span>
						, requires{' '}
						<span className="text-aqua">
							{material.punchesRequired} hit
							{material.punchesRequired > 1 ? 's' : ''}
						</span>{' '}
						to be broken with a{' '}
						<span className="text-aqua">
							{material.swingMultiplier.toFixed(2)} swing multiplier
						</span>{' '}
						and{' '}
						<span className="text-aqua">overcharge {material.overcharge}</span>.
					</p>

					<p>
						{name} block{' '}
						{block.canBeShaped ? (
							<>
								<span className="text-aqua">can be shaped</span> and requires{' '}
								<span className="text-aqua">
									<img
										src={hammerTool.icon}
										alt={hammerTool.label}
										className="inline size-6"
									/>{' '}
									{hammerTool.label} {material.hammerLevel}
								</span>{' '}
								to do so
							</>
						) : (
							<span className="text-aqua">can't be shaped</span>
						)}
						{!material.canBeBlownUp ? (
							<>
								{' '}
								and is <span className="text-aqua"> immune to explosions</span>
							</>
						) : null}
						.
					</p>
				</div>
			)}

			<div className="flex flex-col gap-4">
				<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
					Drops:
				</h2>

				<p>
					{name} block can drop the following items when mined
					{block.harvestLoot ? ' or harvested' : ''}:
				</p>

				<ScrollArea offset={24}>
					<LootTooltip id={block.loot} fallbackItem={block.item ?? block.id} />
				</ScrollArea>

				{block.harvestLoot && (
					<ScrollArea offset={24}>
						<LootTooltip id={block.harvestLoot} variant="harvest" />
					</ScrollArea>
				)}
			</div>

			{canContain.length > 0 && (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						Can contain:
					</h2>

					<p>
						{name} block can be found in the following structures and can
						contain the following loot tables:
					</p>

					{canContain.map(entry => (
						<Fragment key={`${entry.structure}_${entry.loot}`}>
							<p className="mt-2 -mb-2 text-2xl font-bold text-aqua pixel-shadow">
								{toDisplayName(entry.structure)}
							</p>
							<ScrollArea offset={24}>
								<LootTooltip id={entry.loot} />
							</ScrollArea>
						</Fragment>
					))}
				</div>
			)}

			{spawnTable && (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						Spawns:
					</h2>

					<p>
						{name} block can spawn the following monsters if it is within a
						certain distance from the player, spawn conditions are met, and
						chunk monster limits are not reached:
					</p>

					<ScrollArea offset={32} contentClassName="flex gap-2">
						{spawnTable.map(e => (
							<CreatureSlot
								key={e.monster.id}
								creature={e.monster}
								tooltipExtra={
									'loot' in e ? (
										<LootTooltip id={e.loot} variant="monster-override" />
									) : (
										<LootTooltip id={e.monster.loot} variant="monster" />
									)
								}
							/>
						))}
					</ScrollArea>
				</div>
			)}

			{catalogue && (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						Sells:
					</h2>

					<p>You can buy following items at the {name} block:</p>

					<div className="flex flex-wrap gap-2">
						{catalogue.map(entry => (
							<ItemSlot
								key={entry.item.id}
								item={entry.item}
								overlay={
									entry.amount > 1 ? (
										<div
											key="amount"
											className="absolute -right-1 -bottom-2 text-2xl font-bold pixel-shadow"
										>
											{entry.amount}
										</div>
									) : undefined
								}
								tooltipExtra={
									<CostTooltip value={entry.price} className="ns-btn-teal" />
								}
							/>
						))}
					</div>
				</div>
			)}

			{canCraft.length > 0 && (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						Can craft:
					</h2>

					<p>{name} block can be used to craft the following items:</p>

					<div className="flex flex-wrap gap-2">
						{canCraft.map(r => (
							<ItemSlot
								key={r.item.id}
								item={r.item}
								tooltipExtra={<RecipeTooltip recipe={r} />}
								overlay={
									r.amount > 1 ? (
										<div
											key="amount"
											className="absolute -right-1 -bottom-2 text-2xl font-bold pixel-shadow"
										>
											{r.amount}
										</div>
									) : undefined
								}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default Page;
