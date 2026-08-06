'use client';

import cn from 'classnames';
import { type CSSProperties, type ReactNode } from 'react';

import items from '#data/items.json';
import loot from '#data/loot.json';
import type { LootEntry } from '#utils/helpers.ts';
import { getTool } from '#utils/helpers.ts';

import ItemSlot from './item/ItemSlot';

type LootVariant = 'green' | 'red';

const LootEntries = ({
	entry,
	depth,
	variant
}: {
	entry: LootEntry;
	depth: number;
	variant?: LootVariant;
}) => {
	if (!entry) return null;

	const chanceRibbon = entry.chance ? (
		<div
			className={cn(
				'z-1 ns-borderless-ribbon p-3.5 pr-6 pl-2 pixel-shadow font-bold',
				variant === 'green' && 'hue-rotate-260',
				variant === 'red' && 'hue-rotate-150'
			)}
		>
			{Math.round(entry.chance * 100)}%
		</div>
	) : null;

	const item = items.find(i => i.id === entry.item);
	if (item) {
		const component = (
			<ItemSlot
				key={entry.item}
				item={item}
				overlay={[
					(entry.amount ?? 0) > 1 ? (
						<div
							key={`${entry.item}_amount`}
							className="absolute -right-1 -bottom-2 text-2xl font-bold pixel-shadow"
						>
							{entry.amount}
						</div>
					) : entry.min && entry.max ? (
						<div
							key={`${entry.item}_range`}
							className="absolute -right-1 -bottom-2 text-2xl font-bold pixel-shadow"
						>
							{entry.min}-{entry.max}
						</div>
					) : null,
					entry.needs ? (
						<img
							key={`${entry.item}_needs`}
							src={getTool(entry.needs).icon}
							alt={getTool(entry.needs).label}
							className="absolute -top-2 -right-2 size-8 ns-borderless-card-negative"
						/>
					) : null
				]}
			/>
		);
		return (
			<div className="z-1 flex flex-row items-start">
				{depth > 0 ? (
					component
				) : (
					<LootRow variant={variant}>{component}</LootRow>
				)}
				{chanceRibbon}
			</div>
		);
	}

	const count = entry.entries?.length ?? 0;
	const rows = Math.ceil(count / 7);
	const cols = Math.ceil(count / rows);
	const isLeafRoot = entry.entries?.every(e => !e.entries?.length) ?? true;
	return (
		<div className="flex flex-col items-start">
			{entry.oneOf && (
				<div className="z-0 -mb-5 ml-2 ns-btn-orange font-bold pixel-shadow">
					One Of
				</div>
			)}
			<div className="flex items-start">
				<LootRow
					variant={variant}
					style={
						isLeafRoot
							? {
									gridTemplateColumns: [...Array(cols).keys()]
										.map(() => 'min-content')
										.join(' ')
								}
							: undefined
					}
				>
					{(entry.entries ?? []).flatMap((e, i) => (
						<LootEntries
							key={i}
							entry={e}
							depth={depth + 1}
							variant={variant}
						/>
					))}
				</LootRow>
				{chanceRibbon}
			</div>
		</div>
	);
};

const LootRow = ({
	variant,
	style,
	children
}: {
	variant?: LootVariant;
	style?: CSSProperties;
	children: ReactNode;
}) => (
	<div
		className={cn('relative p-4 grid items-start gap-2 flex-col self-start')}
		style={style}
	>
		<div
			className={cn(
				'absolute inset-0',
				variant === 'green'
					? 'ns-borderless-dialog-positive'
					: variant === 'red'
						? 'ns-borderless-dialog-negative'
						: 'ns-borderless-dialog'
			)}
		/>
		{children}
	</div>
);

type Props = {
	id?: string;
	fallbackItem?: string;
	title?: string;
	variant?: 'green' | 'red';
};

const LootTooltip = ({ id, fallbackItem, title, variant }: Props) => {
	if (!id && !fallbackItem) return null;

	const dropTable = loot.find(r => r.id === id);
	if (!dropTable && !fallbackItem) return null;

	return (
		<>
			{title && (
				<div
					className={cn(
						'-mb-5 ml-2 ns-btn-teal font-bold pixel-shadow w-fit',
						variant === 'green' && 'hue-rotate-260',
						variant === 'red' && 'hue-rotate-150'
					)}
				>
					{title}
				</div>
			)}
			<LootEntries
				entry={dropTable ?? ({ item: fallbackItem } as never)}
				depth={0}
				variant={variant}
			/>
		</>
	);
};

export default LootTooltip;
