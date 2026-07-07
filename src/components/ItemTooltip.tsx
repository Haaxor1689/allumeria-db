import cn from 'classnames';
import { type ReactNode } from 'react';

import itemTags from '#data/item_tags.json';
import { type Item } from '#server/types.ts';
import { ItemCategories } from '#utils/constants.ts';
import { getTranslation } from '#utils/helpers.ts';

import CostTooltip from './CostTooltip';
import RecipeTooltip from './RecipeTooltip';

const TooltipEntry = ({
	icon,
	children
}: {
	icon?: string;
	children: ReactNode;
}) => (
	<div className="flex items-center gap-2 text-tooltip">
		{icon && <img src={icon} alt="" className="size-6" />}
		{children}
	</div>
);

const ItemTooltip = ({ item }: { item: Item }) => {
	const name = getTranslation(`item.${item.id}`);
	const rarity = Number(item.rarity);

	const description = getTranslation(`item.${item.id}.desc`);

	const tags = itemTags.map(tag => {
		const value = item.tags?.[tag.id as keyof typeof item.tags];
		if (value === undefined || !tag.iconX || !tag.iconY) return null;
		const label = getTranslation(`item_tag.${tag.label}`);
		return (
			<TooltipEntry
				key={tag.id}
				icon={`/assets/item_tags/${tag.iconX}x${tag.iconY}.webp`}
			>
				{typeof value === 'boolean'
					? label
					: typeof value === 'string'
						? getTranslation(value)
						: `${label}: ${value}`}
			</TooltipEntry>
		);
	});

	const categories = item.category
		?.map(cat => {
			const meta = ItemCategories[cat as keyof typeof ItemCategories];
			if (!meta) return null;
			return (
				<TooltipEntry key={cat} icon={meta.icon}>
					{meta.label}
				</TooltipEntry>
			);
		})
		.filter(v => v !== null);

	return (
		<div className="flex flex-col items-start gap-1">
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
			<RecipeTooltip item={item.id} />
			<CostTooltip value={item.sellValue ?? 0} />
			<div className="ns-dialog px-2 py-1 text-lg">
				<div className="flex shrink flex-wrap gap-x-3 [&_img]:size-4">
					{categories}
				</div>
				<TooltipEntry>Stack size: {item.stackSize ?? 512}</TooltipEntry>
				{item.type && <TooltipEntry>Type: {item.type}</TooltipEntry>}
				{item.rarity && <TooltipEntry>Rarity: {rarity}</TooltipEntry>}
				{item.hidden && <TooltipEntry>Hidden</TooltipEntry>}
				{item.sweeping && <TooltipEntry>Sweeping</TooltipEntry>}
				{item.targetLiquid && <TooltipEntry>Target liquid</TooltipEntry>}
			</div>
		</div>
	);
};

export default ItemTooltip;
