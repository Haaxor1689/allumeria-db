'use client';

import cn from 'classnames';
import { type JSX, type ReactNode } from 'react';

import items from '#data/items.json';
import loot from '#data/loot.json';
import { getTool } from '#utils/helpers.ts';

import ItemSlot from './item/ItemSlot';
import RotatingElements from './RotatingElements';

type LootEntry =
	| {
			amount: number;
			item: string;
	  }
	| {
			min: number;
			max: number;
			item: string;
	  }
	| {
			chance: number;
			entries: LootEntry[];
	  }
	| {
			oneOf: LootEntry[];
	  }
	| {
			needs: string;
			entries: LootEntry[];
	  }
	| {
			ref: string;
	  };

const renderLootEntries = (
	entries: LootEntry[],
	attachments: ReactNode[] = []
) =>
	entries.reduce((acc, entry, i) => {
		if ('amount' in entry) {
			const item = items.find(i => i.id === entry.item);
			if (!item) return acc;
			acc.push(
				<ItemSlot
					key={`${i}_${entry.item}_amount`}
					item={item}
					overlay={[
						...attachments,
						entry.amount > 1 ? (
							<div
								key={`${i}_${entry.item}_amount`}
								className="absolute -right-1 -bottom-2 text-2xl font-bold pixel-shadow"
							>
								{entry.amount}
							</div>
						) : null
					]}
				/>
			);
		} else if ('min' in entry && 'max' in entry) {
			const item = items.find(i => i.id === entry.item);
			if (!item) return acc;
			acc.push(
				<ItemSlot
					key={`${i}_${entry.item}_range`}
					item={item}
					overlay={[
						...attachments,
						<div
							key={`${i}_${entry.item}_range`}
							className="absolute -right-1 -bottom-2 text-2xl font-bold pixel-shadow"
						>
							{entry.min}-{entry.max}
						</div>
					]}
				/>
			);
		} else if ('ref' in entry) {
			const refTable = loot.find(l => l.id === entry.ref);
			if (refTable) {
				acc.push(...renderLootEntries(refTable.entries as never, attachments));
			}
		} else if ('chance' in entry) {
			acc.push(
				...renderLootEntries(entry.entries, [
					...attachments,
					<div
						key={`${i}_chance`}
						className="absolute -top-2 -right-1 font-bold pixel-shadow"
					>
						{Math.round(entry.chance * 100)}%
					</div>
				])
			);
		} else if ('needs' in entry) {
			const tool = getTool(entry.needs);
			acc.push(
				...renderLootEntries(entry.entries, [
					...attachments,
					<img
						key={`${i}_${entry.needs}_needs`}
						src={tool.icon}
						alt={tool.label}
						className="absolute -top-4 -right-4 size-10 ns-borderless-card-negative p-1"
					/>
				])
			);
		} else if ('oneOf' in entry) {
			acc.push(
				<RotatingElements
					key={`${i}_oneOf`}
					entries={renderLootEntries(entry.oneOf, attachments)}
				/>
			);
		}
		return acc;
	}, [] as JSX.Element[]);

type Props = {
	id?: string;
	fallbackItem?: string;
	variant?: 'harvest' | 'monster' | 'monster-override';
};

const LootTooltip = ({ id, fallbackItem, variant }: Props) => {
	if (!id && !fallbackItem) return null;

	const dropTable = loot.find(r => r.id === id);

	const fallback = items.find(i => i.id === fallbackItem);
	const entries = dropTable
		? renderLootEntries(dropTable.entries as never)
		: fallback
			? [<ItemSlot key="item" item={fallback} />]
			: [];

	if (entries.length === 0) return null;

	return (
		<div className="flex items-start">
			<div
				className={cn(
					'flex gap-4 ns-borderless-ingredients items-center p-4 text-xl',
					variant === 'harvest' && 'hue-rotate-260 *:-hue-rotate-260',
					variant?.startsWith('monster') && 'hue-rotate-150 *:-hue-rotate-150'
				)}
			>
				{entries}
			</div>
			{variant === 'harvest' ? (
				<div className="flex gap-2 ns-borderless-ribbon p-3.5 pr-6 pl-2 text-2xl text-muted hue-rotate-260">
					Harvest
				</div>
			) : variant?.startsWith('monster') ? (
				<div className="flex gap-2 ns-borderless-ribbon p-3.5 pr-6 pl-2 text-2xl text-muted hue-rotate-150">
					{variant === 'monster-override' ? 'Spawn specific' : 'Standard Loot'}
				</div>
			) : (
				<div className="flex gap-2 ns-borderless-ribbon p-3.5 pr-6 pl-2 text-2xl text-muted">
					Standard Loot
				</div>
			)}
		</div>
	);
};

export default LootTooltip;
