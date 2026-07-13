'use client';

import Link from 'next/link';

import Tooltip from '#components/styled/Tooltip.tsx';
import { type Effect } from '#server/types.ts';
import { getTranslation } from '#utils/helpers.ts';
import { toDisplayName } from '#utils/index.ts';

import EffectTooltip from './EffectTooltip';

type Props = {
	effect: Effect;
};

const EffectLink = ({ effect }: Props) => {
	const name = getTranslation(`effect.${effect.id}`, toDisplayName(effect.id));
	return (
		<Tooltip<HTMLAnchorElement>
			tooltip={() => <EffectTooltip effect={effect} />}
		>
			{props => (
				<Link
					href={`/effects/${effect.id}`}
					className="text-aqua underline hocus:text-white"
					{...props}
				>
					<img
						src={`/assets/effects/${effect.textureX}x${effect.textureY}.webp`}
						alt={name}
						className="-my-1 mr-0.5 inline size-8 -translate-y-0.5"
					/>
					{name}
				</Link>
			)}
		</Tooltip>
	);
};

export default EffectLink;
