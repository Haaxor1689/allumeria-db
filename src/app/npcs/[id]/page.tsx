import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import BlockLink from '#components/block/BlockLink.tsx';
import Breadcrumbs from '#components/Breadcrumbs.tsx';
import CreatureTooltip from '#components/creature/CreatureTooltip.tsx';
import Img from '#components/Img.tsx';
import CostTooltip from '#components/item/CostTooltip.tsx';
import ItemSlot from '#components/item/ItemSlot.tsx';
import JsonData from '#components/JsonData.tsx';
import LootTooltip from '#components/LootTooltip.tsx';
import EntityRenderer from '#components/renderer/EntityRenderer.tsx';
import ScrollArea from '#components/styled/ScrollArea.tsx';
import blocks from '#data/blocks.json';
import catalogues from '#data/catalogues.json';
import comfortRequirements from '#data/comfort_requirements.json';
import items from '#data/items.json';
import { getCreatureName } from '#utils/helpers.ts';
import { npcDataExt } from '#utils/helpers.ts';

export const generateStaticParams = () =>
	npcDataExt.map(npc => ({ id: npc.entity.id }));

export const generateMetadata = async ({
	params
}: PageProps<'/npcs/[id]'>): Promise<Metadata> => {
	const { id } = await params;
	const npc = npcDataExt.find(c => c.entity.id === id);
	if (!npc) return { title: 'NPC not found' };
	const name = getCreatureName(npc.entity);
	return {
		title: name,
		description: `Discover ${name} in the Allumeria database, including trading, comfort requirements, spawns, and related game data.`,
		alternates: { canonical: `/npcs/${id}` }
	};
};

const Page = async ({ params }: PageProps<'/npcs/[id]'>) => {
	const { id } = await params;
	const npc = npcDataExt.find(c => c.entity.id === id);

	if (!npc) notFound();

	const creature = npc.entity;
	const name = getCreatureName(creature);

	const comfortRequirementsForNpc = comfortRequirements.find(
		requirements => requirements.id === npc.comfortRequirements
	)?.requirements;
	const getCraftingStationBlock = (station: string) =>
		blocks.find(
			block =>
				block.id === station ||
				block.craftingStation ===
					(station === 'workbench' ? 'work_bench' : `${station}s`)
		);

	const catalogue = catalogues
		.find(c => c.id === npc.catalogue)
		?.entries.map(entry => {
			const item = items.find(i => i.id === entry.item);
			if (!item) return null;
			return { item, amount: entry.amount, price: entry.price };
		})
		.filter(v => v !== null);

	return (
		<>
			<Breadcrumbs
				items={[
					{ label: 'Home', href: '/' },
					{ label: 'NPCs', href: '/npcs' },
					{ label: name }
				]}
				className="mx-auto w-full max-w-294"
			/>
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

				<h1 className="-order-1 flex items-center gap-2 pb-4 text-4xl font-bold pixel-shadow md:text-5xl">
					<div className="flex size-18 items-center justify-center ns-borderless-slot">
						<Img
							src="/assets/items/npc_sign.webp"
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

				{comfortRequirementsForNpc && (
					<div className="flex flex-col gap-4">
						<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
							Comfort requirements:
						</h2>

						<p>
							{name} needs following requirements met to start trading with you:
						</p>
						<ul className="list-disc space-y-1 pl-6">
							{comfortRequirementsForNpc.map(requirement => {
								if (requirement.name === 'room_size')
									return (
										<li key={requirement.name}>
											Room size: {requirement.minSize} - {requirement.maxSize}{' '}
											blocks
										</li>
									);

								if (requirement.name === 'room_light')
									return (
										<li key={requirement.name}>
											Light level: {requirement.minLight} -{' '}
											{requirement.maxLight}
										</li>
									);

								if (requirement.name === 'room_sunlight')
									return (
										<li key={requirement.name}>
											Direct sunlight: {requirement.minLight} -{' '}
											{requirement.maxLight}
										</li>
									);

								if (requirement.name === 'room_lava')
									return <li key={requirement.name}>Lava source</li>;

								if (
									'stations' in requirement &&
									Array.isArray(requirement.stations)
								)
									return (
										<li key={requirement.name}>
											Crafting stations:{' '}
											{requirement.stations.map((station, index) => {
												const block = getCraftingStationBlock(station);
												return block ? (
													<span key={station}>
														{index > 0 && ', '}
														<BlockLink block={block} />
													</span>
												) : (
													<span key={station}>
														{index > 0 && ', '}
														{station}
													</span>
												);
											})}
										</li>
									);

								return null;
							})}
						</ul>
					</div>
				)}

				{creature.loot && (
					<div className="flex flex-col gap-4">
						<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
							Loot:
						</h2>

						<p>{name} normally drops following items when killed:</p>
						<ScrollArea offset={32} contentClassName="w-max">
							<LootTooltip id={creature.loot} variant="red" />
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
										<CostTooltip
											value={entry.price ?? 0}
											className="ns-btn-teal"
										/>
									}
								/>
							))}
						</div>
					</div>
				)}

				<JsonData
					data={{
						...npc,
						comfortRequirements: comfortRequirementsForNpc,
						catalogue
					}}
				/>
			</div>
		</>
	);
};

export default Page;
