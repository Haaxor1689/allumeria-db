'use client';

import cn from 'classnames';

import { type Effect } from '#server/types.ts';
import { getTranslation } from '#utils/helpers.ts';
import { toDisplayName } from '#utils/index.ts';

const EffectTooltip = ({ effect }: { effect: Effect }) => {
	const name = getTranslation(`effect.${effect.id}`, toDisplayName(effect.id));
	const description = getTranslation(`effect.desc.${effect.id}`, '');

	return (
		<div
			className={cn(
				'px-2 py-1 text-2xl',
				effect.effectType === 'Buff'
					? 'ns-dialog-positive'
					: effect.effectType === 'Debuff'
						? 'ns-dialog-negative'
						: 'ns-dialog'
			)}
		>
			<p className="font-bold">{name}</p>
			{description && <p className="text-muted">{description}</p>}
			{effect.effectType === 'Hidden' && (
				<p className="text-base text-tooltip">
					This effect is hidden and does not show up in the UI.
				</p>
			)}
		</div>
	);
};

export default EffectTooltip;
