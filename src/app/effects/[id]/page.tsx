import cn from 'classnames';
import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import BlockSlot from '#components/block/BlockSlot.tsx';
import EffectTooltip from '#components/effect/EffectTooltip.tsx';
import ItemSlot from '#components/item/ItemSlot.tsx';
import ScrollArea from '#components/styled/ScrollArea.tsx';
import TooltipEntry from '#components/TooltipEntry.tsx';
import blocks from '#data/blocks.json';
import effects from '#data/effects.json';
import items from '#data/items.json';
import { getTranslation } from '#utils/helpers.ts';
import { toDisplayName } from '#utils/index.ts';

export const generateStaticParams = () =>
	Array.from(new Set(effects.map(effect => effect.id))).map(id => ({ id }));

export const generateMetadata = async ({
	params
}: PageProps<'/effects/[id]'>): Promise<Metadata> => {
	const { id } = await params;
	const effect = effects.find(effect => effect.id === id);
	if (!effect) return { title: 'Effect not found' };
	return {
		title: getTranslation(`effect.${effect.id}`, toDisplayName(effect.id))
	};
};

const Page = async ({ params }: PageProps<'/effects/[id]'>) => {
	const { id } = await params;
	const effect = effects.find(effect => effect.id === id);

	if (!effect) notFound();

	const name = getTranslation(`effect.${effect.id}`, toDisplayName(effect.id));

	const sourceItems = items.filter(
		item => item.effect === effect.id || item.secondaryEffect === effect.id
	);
	const sourceBlocks = blocks.filter(
		block => block.standOnEffect === effect.id
	);

	return (
		<div className="mx-auto flex w-full max-w-294 flex-col gap-10 ns-dialog p-4">
			<Link
				href="/effects"
				className="-mb-8 block self-start text-muted underline hocus:text-aqua"
			>
				&lt; Back to effects
			</Link>
			<h1 className="flex items-center gap-2 pb-4 text-4xl font-bold pixel-shadow md:text-5xl">
				<div
					className={cn(
						'relative flex size-18 items-center justify-center before:pointer-events-none before:absolute before:inset-0 before:bg-cover',
						effect.effectType === 'Debuff'
							? 'before:bg-[url(/assets/icons/effect_debuff.webp)]'
							: effect.effectType === 'Buff'
								? 'before:bg-[url(/assets/icons/effect_buff.webp)]'
								: 'before:bg-[url(/assets/icons/effect_neutral.webp)]',
						effect.effectType === 'Hidden' && 'before:grayscale',
						effect.effectType === 'Passive' && 'before:grayscale-50'
					)}
				>
					<img
						src={`/assets/effects/${effect.textureX}x${effect.textureY}.webp`}
						alt={effect.id}
						loading="lazy"
						fetchPriority="low"
						className="z-0 size-16"
					/>
				</div>
				{name}
			</h1>

			<div className="-mt-12 self-start">
				<EffectTooltip effect={effect} />
			</div>

			<div className="flex flex-col gap-4">
				<p>No community description available yet.</p>

				<TooltipEntry>Numeric Id: {effect.intId}</TooltipEntry>

				{effect.speedModifier !== undefined && (
					<TooltipEntry>Speed modifier: {effect.speedModifier}x</TooltipEntry>
				)}
				{effect.delay !== undefined && (
					<TooltipEntry>Delay: {effect.delay} ticks</TooltipEntry>
				)}
			</div>

			{(sourceItems.length > 0 || sourceBlocks.length > 0) && (
				<div className="flex flex-col gap-4">
					<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
						Granted by:
					</h2>

					{sourceItems.length > 0 && (
						<>
							<p>Following items grant this effect when consumed or used:</p>
							<ScrollArea offset={32} contentClassName="flex flex-wrap gap-2">
								{sourceItems.map(item => (
									<ItemSlot key={item.id} item={item} />
								))}
							</ScrollArea>
						</>
					)}

					{sourceBlocks.length > 0 && (
						<>
							<p>Standing on the following blocks grants this effect:</p>
							<ScrollArea offset={32} contentClassName="flex flex-wrap gap-2">
								{sourceBlocks.map(block => (
									<BlockSlot key={block.id} block={block} />
								))}
							</ScrollArea>
						</>
					)}
				</div>
			)}
		</div>
	);
};

export default Page;
