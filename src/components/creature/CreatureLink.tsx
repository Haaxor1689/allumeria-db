'use client';

import Link from 'next/link';

import Img from '#components/Img.tsx';
import Tooltip from '#components/styled/Tooltip.tsx';
import { type Entity } from '#server/types.ts';
import { getCreatureIcon } from '#utils/helpers.ts';
import { toDisplayName } from '#utils/index.ts';

import CreatureTooltip from './CreatureTooltip';

type Props = {
	creature: Entity;
};

const CreatureLink = ({ creature }: Props) => {
	const name = toDisplayName(creature.id);
	return (
		<Tooltip<HTMLAnchorElement>
			tooltip={() => <CreatureTooltip creature={creature} />}
		>
			{props => (
				<Link
					href={`/creatures/${creature.id}`}
					className="text-aqua underline hocus:text-white"
					{...props}
				>
					<Img
						src={getCreatureIcon(creature.id)}
						alt={name}
						fallback="/previews/creatures/missing.webp"
						className="mr-1 inline size-6 -translate-y-0.5"
					/>
					{name}
				</Link>
			)}
		</Tooltip>
	);
};

export default CreatureLink;
