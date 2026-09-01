'use client';

import Link from 'next/link';

import Img from '#components/Img.tsx';
import ButtonLink from '#components/styled/ButtonLink.tsx';
import Tooltip from '#components/styled/Tooltip.tsx';
import { type Block } from '#server/types.ts';
import { getBlockName } from '#utils/helpers.ts';

import BlockTooltip from './BlockTooltip';

type Props = {
	block: Block;
};

const BlockLink = ({ block }: Props) => {
	const name = getBlockName(block);
	const link = `/blocks/${block.id}`;
	return (
		<Tooltip<HTMLAnchorElement>
			tooltip={() => <BlockTooltip block={block} />}
			actions={() => <ButtonLink href={link}>Open detail</ButtonLink>}
		>
			{props => (
				<Link
					href={link}
					className="text-aqua underline hocus:text-white"
					{...props}
				>
					<Img
						src={`/previews/blocks/${block.id}.webp`}
						alt={name}
						fallback="/previews/blocks/missing.webp"
						className="mr-1 inline size-6 -translate-y-0.5"
					/>
					{name}
				</Link>
			)}
		</Tooltip>
	);
};

export default BlockLink;
