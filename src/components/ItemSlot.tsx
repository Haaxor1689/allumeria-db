'use client';

import Link from 'next/link';

import { type Item } from '#server/types.ts';
import { getItemIcon, getTranslation } from '#utils/helpers.ts';

import ItemTooltip from './ItemTooltip';
import Tooltip from './styled/Tooltip';

const ItemSlot = ({ item }: { item: Item }) => {
	const name = getTranslation(`item.${item.id}`);
	return (
		<Tooltip tooltip={() => <ItemTooltip item={item} />}>
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
