'use client';

import Link from 'next/link';

import blockModels from '#data/block_models.json';
import { type Block } from '#server/types.ts';
import { getBlockName } from '#utils/helpers.ts';

import LootTooltip from '../LootTooltip';
import RotatingSprite from '../RotatingSprite';
import ButtonLink from '../styled/ButtonLink';
import Tooltip from '../styled/Tooltip';
import BlockMetaTooltip from './BlockMetaTooltip';
import BlockTooltip from './BlockTooltip';

const BlockSlot = ({ block }: { block: Block }) => {
	const name = getBlockName(block);
	const numMeshes =
		blockModels.find(m => m.id === block.blockModel)?.meshes.length ?? 1;

	return (
		<Tooltip<HTMLAnchorElement>
			tooltip={() => (
				<div className="flex flex-col items-start gap-1">
					<BlockTooltip block={block} />
					<LootTooltip id={block.loot} fallbackItem={block.item ?? block.id} />
					<LootTooltip id={block.harvestLoot} variant="harvest" />
					<BlockMetaTooltip block={block} />
				</div>
			)}
			actions={() => (
				<ButtonLink href={`/blocks/${block.id}`}>Open detail</ButtonLink>
			)}
		>
			{props => (
				<Link
					href={`/blocks/${block.id}`}
					aria-label={name}
					prefetch={false}
					{...props}
					className="group flex size-26 items-center justify-center ns-borderless-slot bg-cover hocus:ns-borderless-slot-hover tooltip-only:ns-borderless-slot!"
				>
					<RotatingSprite
						src={Array.from(
							{ length: numMeshes },
							(_, i) =>
								`/previews/blocks/${block.id}${i === 0 ? '' : `_${i}`}.webp`
						)}
						alt={() => name}
						loading="lazy"
						fetchPriority="low"
						fallback="/previews/blocks/missing.webp"
						className="size-24 group-hocus:-translate-y-1 tooltip-only:translate-y-0!"
					/>
				</Link>
			)}
		</Tooltip>
	);
};

export default BlockSlot;
