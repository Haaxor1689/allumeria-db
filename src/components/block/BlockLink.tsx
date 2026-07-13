'use client';

import Link from 'next/link';

import Tooltip from '#components/styled/Tooltip.tsx';
import { type Block } from '#server/types.ts';
import { getBlockName } from '#utils/helpers.ts';

import BlockTooltip from './BlockTooltip';

type Props = {
	block: Block;
};

const BlockLink = ({ block }: Props) => {
	const name = getBlockName(block);
	return (
		<Tooltip<HTMLAnchorElement> tooltip={() => <BlockTooltip block={block} />}>
			{props => (
				<Link
					href={`/blocks/${block.id}`}
					className="text-aqua underline hocus:text-white"
					{...props}
				>
					<img
						src={`/previews/blocks/${block.id}.webp`}
						alt={name}
						onError={e =>
							(e.currentTarget.src = '/previews/blocks/missing.webp')
						}
						className="mr-1 inline size-6 -translate-y-0.5"
					/>
					{name}
				</Link>
			)}
		</Tooltip>
	);
};

export default BlockLink;
