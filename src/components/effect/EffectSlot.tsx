'use client';

import cn from 'classnames';
import Link from 'next/link';

import Img from '#components/Img.tsx';
import Tooltip from '#components/styled/Tooltip.tsx';
import { type Effect } from '#server/types.ts';
import { getTranslation } from '#utils/helpers.ts';
import { toDisplayName } from '#utils/index.ts';

import EffectTooltip from './EffectTooltip';

type Props = {
	effect: Effect;
};

const EffectSlot = ({ effect }: Props) => {
	const name = getTranslation(`effect.${effect.id}`, toDisplayName(effect.id));
	return (
		<Tooltip<HTMLAnchorElement>
			tooltip={() => <EffectTooltip effect={effect} />}
		>
			{props => (
				<Link
					href={`/effects/${effect.id}`}
					{...props}
					className={cn(
						'group flex size-18 items-center justify-center relative before:pointer-events-none before:absolute before:inset-0 before:opacity-50 hover:before:opacity-100 before:bg-cover',
						effect.effectType === 'Debuff'
							? 'before:bg-[url(/assets/icons/effect_debuff.webp)] tooltip-only:before:bg-[url(/assets/icons/effect_debuff.webp)]!'
							: effect.effectType === 'Buff'
								? 'before:bg-[url(/assets/icons/effect_buff.webp)] tooltip-only:before:bg-[url(/assets/icons/effect_buff.webp)]!'
								: 'before:bg-[url(/assets/icons/effect_neutral.webp)] tooltip-only:before:bg-[url(/assets/icons/effect_neutral.webp)]!',
						effect.effectType === 'Hidden' && 'before:grayscale',
						effect.effectType === 'Passive' && 'before:grayscale-50'
					)}
				>
					<Img
						src={`/assets/effects/${effect.textureX}x${effect.textureY}.webp`}
						alt={name}
						fallback="/assets/items/missing.webp"
						className="z-0 size-16 group-hocus:-translate-y-1 tooltip-only:translate-y-0!"
					/>
				</Link>
			)}
		</Tooltip>
	);
};

export default EffectSlot;
