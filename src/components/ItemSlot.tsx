'use client';

import { type Item } from '#server/types.ts';
import { getItemIcon, getTranslation } from '#utils/helpers.ts';

import ItemTooltip from './ItemTooltip';
import Tooltip from './styled/Tooltip';

const ItemSlot = ({ item }: { item: Item }) => {
	const name = getTranslation(`item.${item.id}`);
	return (
		<Tooltip tooltip={() => <ItemTooltip item={item} />}>
			{props => (
				<a
					href={`/items/${item.id}`}
					aria-label={name}
					{...props}
					className="group flex size-18 items-center justify-center bg-[url('/assets/icons/slot_empty.webp')] bg-cover hocus:bg-[url('/assets/icons/slot_hover.webp')] tooltip-only:bg-[url('/assets/icons/slot_empty.webp')]!"
				>
					<img
						src={getItemIcon(item)}
						alt={name}
						loading="lazy"
						fetchPriority="low"
						className="size-16 group-hocus:-translate-y-1 tooltip-only:translate-y-0!"
					/>
				</a>
			)}
		</Tooltip>
	);
};

export default ItemSlot;
