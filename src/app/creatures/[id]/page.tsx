import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import BlockSlot from '#components/block/BlockSlot.tsx';
import CreatureTooltip from '#components/creature/CreatureTooltip.tsx';
import Img from '#components/Img.tsx';
import ItemLink from '#components/item/ItemLink.tsx';
import LootTooltip from '#components/LootTooltip.tsx';
import EntityRenderer from '#components/renderer/EntityRenderer.tsx';
import AlertMessage from '#components/styled/AlertMessage.tsx';
import ScrollArea from '#components/styled/ScrollArea.tsx';
import blocks from '#data/blocks.json';
import entities from '#data/entities.json';
import items from '#data/items.json';
import spawn from '#data/spawn.json';
import { getCreatureIcon } from '#utils/helpers.ts';
import { toDisplayName } from '#utils/index.ts';

const creatures = entities.filter(e =>
	['creature', 'boss'].includes(e.category)
);

export const generateStaticParams = () =>
	creatures.map(creature => ({ id: creature.id }));

export const generateMetadata = async ({
	params
}: PageProps<'/creatures/[id]'>): Promise<Metadata> => {
	const { id } = await params;
	const creature = creatures.find(c => c.id === id);
	if (!creature) return { title: 'Creature not found' };
	return { title: toDisplayName(creature.id) };
};

const Page = async ({ params }: PageProps<'/creatures/[id]'>) => {
	const { id } = await params;
	const creature = creatures.find(c => c.id === id);

	if (!creature) notFound();

	const name = toDisplayName(creature.id);

	const spawnsOn = spawn
		.flatMap(c => {
			const entry = c.entries.find(e => e.monster === creature.id);
			if (!entry) return null;
			return blocks
				.filter(b => b.spawn === c.id)
				.map(block => ({
					block,
					loot: 'loot' in entry ? (entry.loot as string) : undefined
				}));
		})
		.filter(v => v !== null);

	const spawnedBy = items.find(i => i.entityType === creature.id);

	return (
		<div className="mx-auto flex w-full max-w-294 flex-col gap-10 ns-dialog p-4 2xl:block 2xl:space-y-10">
			<div className="mx-auto -mt-6 mb-0 w-full max-w-90 2xl:float-right 2xl:mt-0 2xl:ml-6">
				{creature.model && creature.texture ? (
					<EntityRenderer model={creature.model} texture={creature.texture} />
				) : (
					<div className="flex aspect-2/3 w-full items-center ns-slot">
						<p className="font bold mx-auto w-min text-center text-4xl text-tooltip/50 select-none pixel-shadow">
							Preview unavailable
						</p>
					</div>
				)}
			</div>

			<Link
				href="/creatures"
				className="-order-1 -mb-8 block self-start text-muted underline 2xl:mb-2 hocus:text-aqua"
			>
				&lt; Back to creatures
			</Link>
			<h1 className="-order-1 flex items-center gap-2 pb-4 text-4xl font-bold pixel-shadow md:text-5xl">
				<div className="flex size-18 items-center justify-center ns-borderless-slot">
					<Img
						src={getCreatureIcon(creature.id)}
						alt={name}
						fallback="/previews/blocks/missing.webp"
						className="size-16"
					/>
				</div>
				{name}
			</h1>

			<div className="-order-1 -mt-12 w-fit self-start">
				<CreatureTooltip creature={creature} />
			</div>

			<div className="flex flex-col gap-4">
				<p>No community description available yet.</p>

				{spawnedBy && (
					<AlertMessage>
						{name} can also be spawned using <ItemLink item={spawnedBy} /> in
						creative mode.
					</AlertMessage>
				)}
			</div>

			{creature.loot && (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						Loot:
					</h2>

					<p>{name} normally drops following items when killed:</p>
					<ScrollArea>
						<LootTooltip id={creature.loot} variant="monster" />
					</ScrollArea>
				</div>
			)}

			{spawnsOn.length > 0 && (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						Spawns on:
					</h2>

					<p>
						{name} can spawn on the following blocks. Some blocks may change
						what loot is dropped:
					</p>
					<div className="flex flex-wrap gap-2">
						{spawnsOn.map(s => (
							<BlockSlot
								key={s.block.id}
								block={s.block}
								tooltipExtra={
									s.loot ? (
										<LootTooltip id={s.loot} variant="monster-override" />
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
