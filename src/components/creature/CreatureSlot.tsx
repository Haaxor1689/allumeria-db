'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';

import Img from '#components/Img.tsx';
import { type Creature } from '#server/types.ts';
import { getCreatureIcon } from '#utils/helpers.ts';
import { toDisplayName } from '#utils/index.ts';

import ButtonLink from '../styled/ButtonLink';
import Tooltip from '../styled/Tooltip';
import CreatureTooltip from './CreatureTooltip';

type Props = {
	creature: Creature;
	overlay?: ReactNode;
	tooltipExtra?: ReactNode;
};

const CreatureSlot = ({ creature, overlay, tooltipExtra }: Props) => {
	const name = toDisplayName(creature.id);

	return (
		<Tooltip<HTMLAnchorElement>
			tooltip={() => (
				<div className="flex flex-col items-start gap-1">
					<CreatureTooltip creature={creature} />
					{tooltipExtra}
				</div>
			)}
			actions={() => (
				<ButtonLink href={`/creatures/${creature.id}`}>Open detail</ButtonLink>
			)}
		>
			{props => (
				<Link
					href={`/creatures/${creature.id}`}
					aria-label={name}
					prefetch={false}
					{...props}
					className="group relative flex aspect-2/3 w-54 items-center justify-center ns-borderless-slot bg-cover hocus:ns-borderless-slot-hover tooltip-only:ns-borderless-slot!"
				>
					<Img
						src={getCreatureIcon(creature.id)}
						alt={name}
						loading="lazy"
						fetchPriority="low"
						fallback="/previews/blocks/missing.webp"
						className="size-24 group-hocus:-translate-y-1 tooltip-only:translate-y-0!"
					/>
					{overlay}
				</Link>
			)}
		</Tooltip>
	);
};

export default CreatureSlot;
