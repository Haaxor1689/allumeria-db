'use client';

import Link from 'next/link';

import blockModels from '#data/block_models.json';
import { type Block } from '#server/types.ts';
import { getTranslation } from '#utils/helpers.ts';

import BlockTooltip from './BlockTooltip';
import RotatingSprite from './RotatingSprite';
import Tooltip from './styled/Tooltip';

const BlockSlot = ({ block }: { block: Block }) => {
	const name = getTranslation(`item.${block.id}`);
	const numMeshes =
		blockModels.find(m => m.id === block.blockModel)?.meshes.length ?? 1;

	return (
		<Tooltip tooltip={() => <BlockTooltip block={block} />}>
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
