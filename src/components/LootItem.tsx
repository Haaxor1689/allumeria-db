'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';

import items from '#data/items.json';
import { getItemIcon, getTranslation } from '#utils/helpers.ts';

import ItemTooltip from './item/ItemTooltip';
import Tooltip from './styled/Tooltip';

type Props = {
	id: string;
	attachments: ReactNode[];
};

const LootItem = ({ id, attachments }: Props) => {
	const item = items.find(i => i.id === id);
	if (!item) return null;
	return (
		<Tooltip<HTMLAnchorElement> tooltip={() => <ItemTooltip item={item} />}>
			{props => (
				<Link
					href={`/items/${item.id}`}
					prefetch={false}
					{...props}
					className="relative block size-16 select-none"
				>
					<img
						src={getItemIcon(item)}
						alt={getTranslation(`item.${item.id}`)}
						className="size-16"
					/>
					{attachments}
				</Link>
			)}
		</Tooltip>
	);
};

export default LootItem;
