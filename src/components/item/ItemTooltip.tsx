import cn from 'classnames';

import TooltipEntry from '#components/TooltipEntry.tsx';
import { type Item } from '#server/types.ts';
import { getTranslation, itemTagsExt } from '#utils/helpers.ts';

const ItemTooltip = ({ item }: { item: Item }) => {
	const name = getTranslation(`item.${item.id}`);

	const description = getTranslation(`item.${item.id}.desc`);

	const tags = itemTagsExt.map(tag => {
		const value = item.tags?.[tag.id as keyof typeof item.tags];
		if (value === undefined || !tag.icon) return null;
		return (
			<TooltipEntry key={tag.id} icon={tag.icon}>
				{typeof value === 'boolean'
					? tag.label
					: typeof value === 'string'
						? getTranslation(value)
						: `${tag.label}: ${value}`}
			</TooltipEntry>
		);
	});

	return (
		<div
			className={cn('px-2 py-1 text-2xl', {
				'ns-dialog-rarity-0': !item.rarity,
				'ns-dialog-rarity-1': item.rarity === 1,
				'ns-dialog-rarity-2': item.rarity === 2,
				'ns-dialog-rarity-3': item.rarity === 3,
				'ns-dialog-rarity-4': item.rarity === 4,
				'ns-dialog-rarity-5': item.rarity === 5
			})}
		>
			<p className="font-bold">{name}</p>
			{tags}
			{description !== `item.${item.id}.desc` && (
				<p className="text-muted">{description}</p>
			)}
		</div>
	);
};

export default ItemTooltip;
