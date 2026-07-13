'use client';

import Link from 'next/link';

import recipes from '#data/recipes.json';
import { type Item } from '#server/types.ts';
import { getItemIcon, getTranslation } from '#utils/helpers.ts';

import Tooltip from '../styled/Tooltip';
import CostTooltip from './CostTooltip';
import ItemMetaTooltip from './ItemMetaTooltip';
import ItemTooltip from './ItemTooltip';
import RecipeTooltip from './RecipeTooltip';

const ItemSlot = ({ item }: { item: Item }) => {
	const name = getTranslation(`item.${item.id}`);
	return (
		<Tooltip<HTMLAnchorElement>
			tooltip={() => (
				<div className="flex flex-col gap-1">
					<ItemTooltip item={item} />
					{recipes
						.filter(r => r.result === item.id)
						.map((recipe, idx) => (
							<RecipeTooltip key={idx} recipe={recipe} />
						))}
					<CostTooltip value={item.sellValue ?? 0} />
					<ItemMetaTooltip item={item} />
				</div>
			)}
		>
			{props => (
				<Link
					href={`/items/${item.id}`}
					aria-label={name}
					prefetch={false}
					{...props}
					className="group flex size-18 items-center justify-center ns-borderless-slot bg-cover hocus:ns-borderless-slot-hover tooltip-only:ns-borderless-slot!"
				>
					<img
						src={getItemIcon(item)}
						alt={name}
						loading="lazy"
						fetchPriority="low"
						className="size-16 group-hocus:-translate-y-1 tooltip-only:translate-y-0!"
					/>
				</Link>
			)}
		</Tooltip>
	);
};

export default ItemSlot;
