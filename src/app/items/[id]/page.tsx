import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import BlockLink from '#components/block/BlockLink.tsx';
import BlockSlot from '#components/block/BlockSlot.tsx';
import CreatureLink from '#components/creature/CreatureLink.tsx';
import CreatureSlot from '#components/creature/CreatureSlot.tsx';
import EffectLink from '#components/effect/EffectLink.tsx';
import CostTooltip from '#components/item/CostTooltip.tsx';
import ItemSlot from '#components/item/ItemSlot.tsx';
import ItemTooltip from '#components/item/ItemTooltip.tsx';
import RecipeTooltip from '#components/item/RecipeTooltip.tsx';
import LootTooltip from '#components/LootTooltip.tsx';
import BlockRender from '#components/renderer/BlockRender.tsx';
import EntityRenderer from '#components/renderer/EntityRenderer.tsx';
import ScrollArea from '#components/styled/ScrollArea.tsx';
import blocks from '#data/blocks.json';
import catalogues from '#data/catalogues.json';
import effects from '#data/effects.json';
import creatures from '#data/entities.json';
import items from '#data/items.json';
import loot from '#data/loot.json';
import recipeAliases from '#data/recipe_aliases.json';
import recipes from '#data/recipes.json';
import structures from '#data/structures.json';
import { getItemIcon, getTranslation } from '#utils/helpers.ts';
import { toDisplayName } from '#utils/index.ts';

export const generateStaticParams = () =>
	Array.from(new Set(items.map(item => item.id))).map(id => ({ id }));

export const generateMetadata = async ({
	params
}: PageProps<'/items/[id]'>): Promise<Metadata> => {
	const { id } = await params;
	const item = items.find(item => item.id === id);
	if (!item) return { title: 'Item not found' };
	return { title: getTranslation(`item.${item.id}`) };
};

const getLootItemIds = (entries: (typeof loot)[number]['entries']): string[] =>
	entries.flatMap(entry => {
		if ('item' in entry) return entry.item ? [entry.item] : [];
		if ('ref' in entry) {
			const refTable = loot.find(l => l.id === entry.ref);
			return refTable ? getLootItemIds(refTable.entries) : [];
		}
		if ('entries' in entry)
			return getLootItemIds(entry.entries as (typeof loot)[number]['entries']);
		if ('oneOf' in entry)
			return getLootItemIds(entry.oneOf as (typeof loot)[number]['entries']);
		return [];
	});

const Page = async ({ params }: PageProps<'/items/[id]'>) => {
	const { id } = await params;
	const item = items.find(item => item.id === id);

	if (!item) notFound();

	const name = getTranslation(`item.${item.id}`);

	const block = blocks.find(b => b.id === item.block);

	const itemEffecs = [
		{
			effect: item.effect,
			ticks: item.ticks,
			action: item.type === 'MeleeEffect' ? 'Applies' : 'Grants'
		},
		{
			effect: item.secondaryEffect,
			ticks: item.secondaryTicks,
			action: 'Grants'
		},
		{ effect: item.passiveEffect, ticks: -1, action: 'Grants' }
	]
		.map((v, idx) => {
			const effect = effects.find(e => e.id === v.effect);
			if (!effect) return undefined;
			if (!v.ticks || v.ticks === 1)
				return (
					<p key={idx} className="text-muted">
						{v.action} <EffectLink effect={effect} /> instantly.
					</p>
				);
			if (v.ticks > 1)
				return (
					<p key={idx} className="text-muted">
						{v.action} <EffectLink effect={effect} /> for {v.ticks} ticks.
					</p>
				);
			return (
				<p key={idx} className="text-muted">
					{v.action} <EffectLink effect={effect} /> passively.
				</p>
			);
		})
		.filter(v => v !== undefined);

	const itemRecipes = recipes.filter(r => r.result === item.id);

	const inAliases = recipeAliases
		.filter(r => r.entries?.includes(item.id))
		.map(r => r.id);
	const ingredientFor = recipes
		.filter(r =>
			[item.id, ...inAliases].some(id =>
				Object.keys(r.requirements).includes(id)
			)
		)
		.map(r => items.find(i => i.id === r.result))
		.filter(i => i !== undefined);

	const lootTableIds = new Set(
		loot.filter(l => getLootItemIds(l.entries).includes(item.id)).map(l => l.id)
	);

	const dropsFrom = {
		blocks: blocks.filter(b => lootTableIds.has(b.loot ?? '')),
		creatures: creatures.filter(c => lootTableIds.has(c.loot ?? '')),
		structures: structures.filter(s =>
			s.chests.some(c => lootTableIds.has(c.loot ?? ''))
		)
	};

	const creature = creatures.find(c => c.id === item.entityType);

	const joinedEffects = [
		...itemEffecs,
		creature ? (
			<p key="creature">
				Spawns a <CreatureLink creature={creature} /> creature.
			</p>
		) : null
	].filter(v => v !== null);

	const soldBy = catalogues
		.flatMap(c => {
			const entry = c.entries.find(e => e.item === item.id);
			if (!entry) return null;
			return blocks
				.filter(b => b.catalogue === c.id)
				.map(block => ({ block, price: entry.price, amount: entry.amount }));
		})
		.filter(v => v !== null);

	return (
		<div className="container mx-auto flex w-full max-w-294 flex-col gap-10 ns-dialog p-4 2xl:block 2xl:space-y-10">
			{item.model && item.texture ? (
				<div className="mx-auto -mt-6 mb-0 w-full max-w-90 2xl:float-right 2xl:mt-0 2xl:ml-6">
					<EntityRenderer model={item.model} texture={item.texture} />
				</div>
			) : creature?.model && creature?.texture ? (
				<div className="mx-auto -mt-6 mb-0 w-full max-w-90 2xl:float-right 2xl:mt-0 2xl:ml-6">
					<EntityRenderer model={creature.model} texture={creature.texture} />
				</div>
			) : block ? (
				<div className="relative mx-auto -mt-6 mb-0 w-full max-w-120 2xl:float-right 2xl:mt-0 2xl:ml-6">
					<BlockRender block={block} />
				</div>
			) : null}

			<Link
				href="/items"
				className="-order-1 -mb-8 block self-start text-muted underline 2xl:mb-2 hocus:text-aqua"
			>
				&lt; Back to items
			</Link>
			<h1 className="-order-1 flex items-center gap-2 pb-4 text-4xl font-bold pixel-shadow md:text-5xl">
				<div className="flex size-18 items-center justify-center ns-borderless-slot">
					<img
						src={getItemIcon(item)}
						alt={item.id}
						loading="lazy"
						fetchPriority="low"
						className="size-16"
					/>
				</div>
				{name}
			</h1>

			<div className="-order-1 -mt-12 w-fit self-start">
				<ItemTooltip item={item} />
			</div>

			<div className="flex flex-col gap-4">
				<p>No community description available yet.</p>

				{block && (
					<p>
						This item is also a <BlockLink block={block} /> block. For more
						information about its material, drops, and other properties, please
						visit the block's detail page.
					</p>
				)}

				{item.slotType && (
					<p>
						{name} can be equipped in the{' '}
						<span className="text-aqua">
							<img
								src={`/assets/icons/slot_${item.slotType.toLocaleLowerCase()}.webp`}
								alt={item.slotType}
								className="-m-1.5 inline size-8"
							/>{' '}
							{item.slotType}
						</span>{' '}
						slot.
					</p>
				)}
			</div>

			{joinedEffects.length > 0 && (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						Effects:
					</h2>
					{joinedEffects}
				</div>
			)}

			{itemRecipes.length > 0 && (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						How to make:
					</h2>

					<p>You can craft {name} using the following ingredients:</p>

					{itemRecipes.map((recipe, idx) => (
						<RecipeTooltip key={idx} recipe={recipe} />
					))}
				</div>
			)}

			{ingredientFor.length > 0 && (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						Used to make:
					</h2>

					<p>{name} is used to craft the following items:</p>
					<div className="flex flex-wrap gap-2">
						{ingredientFor.map((item, idx) => (
							<ItemSlot
								key={idx}
								item={item}
								tooltipExtra={recipes
									.filter(r => r.result === item.id)
									.map((recipe, idx) => (
										<RecipeTooltip key={idx} recipe={recipe} />
									))}
							/>
						))}
					</div>
				</div>
			)}

			{item.sellValue ? (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						Sell value:
					</h2>

					<p>{name} can be sold for the following value:</p>
					<CostTooltip value={item.sellValue} />
				</div>
			) : null}

			{(dropsFrom.blocks.length > 0 ||
				dropsFrom.creatures.length > 0 ||
				dropsFrom.structures.length > 0) && (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						Drops from:
					</h2>

					<p>{name} can be obtained from the following sources:</p>

					{(dropsFrom.blocks.length > 0 || dropsFrom.structures.length > 0) && (
						<div className="flex flex-wrap gap-2">
							{dropsFrom.blocks.map(block => (
								<BlockSlot
									key={block.id}
									block={block}
									tooltipExtra={[
										<LootTooltip
											key="loot"
											id={block.loot}
											fallbackItem={block.item ?? block.id}
										/>,
										<LootTooltip
											key="harvest"
											id={block.harvestLoot}
											variant="harvest"
										/>
									]}
								/>
							))}
							{dropsFrom.structures.map(s =>
								s.chests.map(c => {
									const chest = blocks.find(b => b.id === c.chest);
									if (!chest) return null;
									return (
										<BlockSlot
											key={`${s.id}-${c.chest}-${'type' in c ? c.type : 'base'}`}
											block={chest}
											tooltipExtra={
												<div className="flex gap-2 ns-borderless-ribbon p-3.5 pr-6 pl-2 text-muted">
													{toDisplayName(s.id)}
													{'type' in c ? ` (${toDisplayName(c.type)})` : ''}
												</div>
											}
										/>
									);
								})
							)}
						</div>
					)}

					{dropsFrom.creatures.length > 0 && (
						<ScrollArea offset={32} contentClassName="flex gap-2">
							{dropsFrom.creatures.map(creature => (
								<CreatureSlot key={creature.id} creature={creature} />
							))}
						</ScrollArea>
					)}
				</div>
			)}

			{soldBy.length > 0 && (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						Sold by:
					</h2>

					<p>{name} can be purchased from the following blocks:</p>

					<div className="flex flex-wrap gap-2">
						{soldBy.map(({ block, price, amount }) => (
							<BlockSlot
								key={block.id}
								block={block}
								overlay={
									amount > 1 ? (
										<div
											key="amount"
											className="absolute right-0 -bottom-1 text-2xl font-bold pixel-shadow"
										>
											{amount}
										</div>
									) : undefined
								}
								tooltipExtra={
									<CostTooltip value={price} className="ns-btn-teal" />
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
