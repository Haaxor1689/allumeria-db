'use client';

import cn from 'classnames';
import Link from 'next/link';
import { type ReactNode } from 'react';

import { type Item } from '#server/types.ts';
import { getItemIcon, getTranslation } from '#utils/helpers.ts';

import Tooltip from '../styled/Tooltip';
import ItemTooltip from './ItemTooltip';

type Props = {
	item: Item;
	overlay?: ReactNode;
	tooltipExtra?: ReactNode;
	transparent?: boolean;
};

const ItemSlot = ({ item, overlay, tooltipExtra, transparent }: Props) => {
	const name = getTranslation(`item.${item.id}`);
	return (
		<Tooltip<HTMLAnchorElement>
			tooltip={() => (
				<div className="flex flex-col gap-1">
					<ItemTooltip item={item} />
					{tooltipExtra}
				</div>
			)}
		>
			{props => (
				<Link
					href={`/items/${item.id}`}
					aria-label={name}
					prefetch={false}
					{...props}
					className={cn(
						'group relative flex size-18 items-center justify-center',
						!transparent &&
							'ns-borderless-slot hocus:ns-borderless-slot-hover tooltip-only:ns-borderless-slot!'
					)}
				>
					<img
						src={getItemIcon(item)}
						alt={name}
						loading="lazy"
						fetchPriority="low"
						className="size-16 group-hocus:-translate-y-1 tooltip-only:translate-y-0!"
					/>
					{item.hidden && (
						<img
							src="/custom/eye.webp"
							alt="Hidden"
							className="absolute top-1 right-1 size-6"
						/>
					)}
					{overlay}
				</Link>
			)}
		</Tooltip>
	);
};

export default ItemSlot;
