import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import BlockRender from '#components/block/BlockRender.tsx';
import BlockSlot from '#components/block/BlockSlot.tsx';
import EffectLink from '#components/effect/EffectLink.tsx';
import CostTooltip from '#components/item/CostTooltip.tsx';
import ItemSlot from '#components/item/ItemSlot.tsx';
import ItemTooltip from '#components/item/ItemTooltip.tsx';
import RecipeTooltip from '#components/item/RecipeTooltip.tsx';
import ButtonLink from '#components/styled/ButtonLink.tsx';
import blocks from '#data/blocks.json';
import creatures from '#data/creatures.json';
import effects from '#data/effects.json';
import items from '#data/items.json';
import loot from '#data/loot.json';
import recipes from '#data/recipes.json';
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

const Page = async ({ params }: PageProps<'/items/[id]'>) => {
	const { id } = await params;
	const item = items.find(item => item.id === id);

	if (!item) notFound();

	const name = getTranslation(`item.${item.id}`);

	const block = blocks.find(b => b.id === item.block);

	const primaryEffect = item.effect
		? effects.find(e => e.id === item.effect)
		: null;
	const secondaryEffect = item.secondaryEffect
		? effects.find(e => e.id === item.secondaryEffect)
		: null;

	const itemRecipes = recipes.filter(r => r.result === item.id);
	const ingredientFor = recipes
		.filter(r => Object.keys(r.requirements).includes(item.id))
		.map(r => items.find(i => i.id === r.result))
		.filter(i => i !== undefined);

	const getLootItemIds = (
		entries: (typeof loot)[number]['entries']
	): string[] =>
		entries.flatMap(entry => {
			if ('item' in entry) return entry.item ? [entry.item] : [];
			if ('ref' in entry) {
				const refTable = loot.find(l => l.id === entry.ref);
				return refTable ? getLootItemIds(refTable.entries) : [];
			}
			if ('entries' in entry)
				return getLootItemIds(
					entry.entries as (typeof loot)[number]['entries']
				);
			if ('oneOf' in entry)
				return getLootItemIds(entry.oneOf as (typeof loot)[number]['entries']);
			return [];
		});

	const lootTableIds = new Set(
		loot.filter(l => getLootItemIds(l.entries).includes(item.id)).map(l => l.id)
	);

	const dropsFromBlocks = blocks.filter(
		b => !b.hidden && lootTableIds.has(b.loot ?? b.item ?? b.id)
	);
	const dropsFromCreatures = creatures.filter(
		c => c.loot && lootTableIds.has(c.loot)
	);

	return (
		<div className="container mx-auto flex w-full max-w-292 grow flex-col gap-10 ns-dialog p-4 2xl:block 2xl:space-y-10">
			{block && (
				<div className="relative mx-auto -mt-6 mb-0 w-full max-w-120 2xl:float-right 2xl:mt-0 2xl:ml-6">
					<BlockRender block={block} />
					<ButtonLink
						href={`/blocks/${block.id}`}
						className="absolute top-1 left-1 z-10 md:top-3 md:left-3"
					>
						View Block
					</ButtonLink>
				</div>
			)}

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
			</div>

			{(!!primaryEffect || !!secondaryEffect) && (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						Effects:
					</h2>
					<div className="flex flex-wrap gap-4">
						{primaryEffect && (
							<p className="text-muted">
								Grants <EffectLink effect={primaryEffect} />
								{item.ticks ? ` for ${item.ticks} ticks` : ''}
							</p>
						)}
						{secondaryEffect && (
							<p className="text-muted">
								Also grants <EffectLink effect={secondaryEffect} />
								{item.secondaryTicks ? ` for ${item.secondaryTicks} ticks` : ''}
							</p>
						)}
					</div>
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
							<ItemSlot key={idx} item={item} />
						))}
					</div>
				</div>
			)}

			{(dropsFromBlocks.length > 0 || dropsFromCreatures.length > 0) && (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						Drops from:
					</h2>

					<p>{name} can be obtained from the following sources:</p>

					{dropsFromBlocks.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{dropsFromBlocks.map(block => (
								<BlockSlot key={block.id} block={block} />
							))}
						</div>
					)}

					{dropsFromCreatures.length > 0 && (
						<div className="flex flex-wrap gap-3">
							{dropsFromCreatures.map(creature => (
								<div
									key={creature.id}
									className="flex items-center gap-2 rounded border border-white/20 bg-white/5 px-3 py-2 text-sm"
								>
									{toDisplayName(creature.id)}
								</div>
							))}
						</div>
					)}
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
		</div>
	);
};

export default Page;
