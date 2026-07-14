'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';

import blockModels from '#data/block_models.json';
import { type Block } from '#server/types.ts';
import { getBlockName } from '#utils/helpers.ts';

import RotatingSprite from '../RotatingSprite';
import ButtonLink from '../styled/ButtonLink';
import Tooltip from '../styled/Tooltip';
import BlockTooltip from './BlockTooltip';

type Props = {
	block: Block;
	overlay?: ReactNode;
	tooltipExtra?: ReactNode;
};

const BlockSlot = ({ block, overlay, tooltipExtra }: Props) => {
	const name = getBlockName(block);
	const numMeshes =
		blockModels.find(m => m.id === block.blockModel)?.meshes.length ?? 1;

	return (
		<Tooltip<HTMLAnchorElement>
			tooltip={() => (
				<div className="flex flex-col items-start gap-1">
					<BlockTooltip block={block} />
					{tooltipExtra}
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
					className="group relative flex size-26 items-center justify-center ns-borderless-slot bg-cover hocus:ns-borderless-slot-hover tooltip-only:ns-borderless-slot!"
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
					{block.hidden && (
						<img
							src="/custom/eye.webp"
							alt="Hidden"
							className="absolute top-2 right-2 size-6"
						/>
					)}
					{overlay}
				</Link>
			)}
		</Tooltip>
	);
};

export default BlockSlot;
