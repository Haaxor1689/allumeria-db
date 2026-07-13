'use client';

import Link from 'next/link';

import ItemTooltip from '#components/item/ItemTooltip.tsx';
import Tooltip from '#components/styled/Tooltip.tsx';
import { type Item } from '#server/types.ts';
import { getTranslation, getItemIcon } from '#utils/helpers.ts';

const ItemLink = ({ item }: { item: Item }) => {
	const name = getTranslation(`item.${item.id}`);
	return (
		<Tooltip<HTMLAnchorElement> tooltip={() => <ItemTooltip item={item} />}>
			{props => (
				<Link
					href={`/items/${item.id}`}
					className="text-aqua underline hocus:text-white"
					{...props}
				>
					<img
						src={getItemIcon(item)}
						alt={name}
						className="mr-1 inline size-6 -translate-y-0.5"
					/>
					{name}
				</Link>
			)}
		</Tooltip>
	);
};

export default ItemLink;
