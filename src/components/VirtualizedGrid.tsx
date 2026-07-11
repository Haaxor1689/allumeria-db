'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import cls from 'classnames';
import {
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode
} from 'react';

import ScrollArea from '#components/styled/ScrollArea.tsx';

type DialogVariant =
	| 'default'
	| 'positive'
	| 'negative'
	| 'rarity0'
	| 'rarity1'
	| 'rarity2'
	| 'rarity3'
	| 'rarity4'
	| 'rarity5';

type Props<T> = {
	items: readonly T[];
	renderItem: (item: T, index: number) => ReactNode;
	getItemKey?: (item: T, index: number) => string | number;
	itemMinWidth?: CSSProperties['width'];
	itemHeight?: CSSProperties['height'];
	rows?: number;
	gap?: number;
	overscan?: number;
	variant?: DialogVariant;
};

const FALLBACK_ITEM_SIZE = 72;

const VirtualizedGrid = <T,>({
	items,
	renderItem,
	getItemKey,
	itemMinWidth = `calc(var(--spacing) * 18)`,
	itemHeight = `calc(var(--spacing) * 18)`,
	rows = 10,
	gap = 8,
	overscan = 0,
	variant = 'default'
}: Props<T>) => {
	const viewportRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const sizeProbeRef = useRef<HTMLDivElement>(null);

	const [containerWidth, setContainerWidth] = useState(0);
	const [contentPaddingY, setContentPaddingY] = useState(0);
	const [measuredWidth, setMeasuredWidth] = useState(FALLBACK_ITEM_SIZE);
	const [measuredHeight, setMeasuredHeight] = useState(FALLBACK_ITEM_SIZE);

	const updateMeasurements = useCallback(() => {
		const content = contentRef.current;
		if (content) {
			const computedStyle = getComputedStyle(content);
			const paddingLeft = Number.parseFloat(computedStyle.paddingLeft) || 0;
			const paddingRight = Number.parseFloat(computedStyle.paddingRight) || 0;
			const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
			const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
			setContainerWidth(
				Math.max(0, content.clientWidth - paddingLeft - paddingRight)
			);
			setContentPaddingY(paddingTop + paddingBottom);
		} else {
			const viewport = viewportRef.current;
			if (viewport) {
				setContainerWidth(Math.max(0, viewport.clientWidth));
				setContentPaddingY(0);
			}
		}

		const probe = sizeProbeRef.current;
		if (probe) {
			const rect = probe.getBoundingClientRect();
			setMeasuredWidth(Math.max(1, rect.width || FALLBACK_ITEM_SIZE));
			setMeasuredHeight(Math.max(1, rect.height || FALLBACK_ITEM_SIZE));
		}
	}, []);

	useLayoutEffect(() => {
		updateMeasurements();

		const observer = new ResizeObserver(() => {
			updateMeasurements();
		});

		if (viewportRef.current) {
			observer.observe(viewportRef.current);
		}
		if (sizeProbeRef.current) {
			observer.observe(sizeProbeRef.current);
		}

		return () => {
			observer.disconnect();
		};
	}, [updateMeasurements]);

	const columnCount = useMemo(() => {
		if (containerWidth <= 0) {
			return 1;
		}

		return Math.max(
			1,
			Math.floor((containerWidth + gap) / (measuredWidth + gap))
		);
	}, [containerWidth, gap, measuredWidth]);

	const rowCount = Math.ceil(items.length / columnCount);
	const rowHeight = measuredHeight + gap;
	const resolvedRows = Math.max(1, rows);
	const visibleRowsHeight =
		resolvedRows * measuredHeight + Math.max(0, resolvedRows - 1) * gap;
	const containerStyle = useMemo(
		() => ({ maxHeight: visibleRowsHeight + contentPaddingY }),
		[contentPaddingY, visibleRowsHeight]
	);
	const getScrollElement = useCallback(() => viewportRef.current, []);
	const estimateSize = useCallback(() => rowHeight, [rowHeight]);

	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement,
		estimateSize,
		overscan
	});

	return (
		<ScrollArea
			ref={viewportRef}
			contentRef={contentRef}
			offset={48}
			showHorizontalScrollbar={false}
			containerStyle={containerStyle}
			containerClassName={cls('relative', {
				'ns-dialog': variant === 'default',
				'ns-dialog-positive': variant === 'positive',
				'ns-dialog-negative': variant === 'negative',
				'ns-dialog-rarity-0': variant === 'rarity0',
				'ns-dialog-rarity-1': variant === 'rarity1',
				'ns-dialog-rarity-2': variant === 'rarity2',
				'ns-dialog-rarity-3': variant === 'rarity3',
				'ns-dialog-rarity-4': variant === 'rarity4',
				'ns-dialog-rarity-5': variant === 'rarity5'
			})}
			contentClassName="relative w-full p-3"
		>
			<div
				ref={sizeProbeRef}
				aria-hidden
				className="pointer-events-none absolute opacity-0"
				style={{ width: itemMinWidth, height: itemHeight }}
			/>
			<div
				className="relative w-full"
				style={{ height: rowVirtualizer.getTotalSize() }}
			>
				{rowVirtualizer.getVirtualItems().map(row => {
					const startIndex = row.index * columnCount;
					const endIndex = Math.min(startIndex + columnCount, items.length);
					const cells: ReactNode[] = [];

					for (let itemIndex = startIndex; itemIndex < endIndex; itemIndex++) {
						const item = items[itemIndex];
						if (item === undefined) {
							continue;
						}
						const key = getItemKey?.(item, itemIndex) ?? itemIndex;

						cells.push(
							<div
								key={key}
								className="flex items-center justify-center"
								style={{
									height: measuredHeight,
									contain: 'layout paint style'
								}}
							>
								{renderItem(item, itemIndex)}
							</div>
						);
					}

					return (
						<div
							key={row.key}
							className="absolute inset-x-0 top-0 grid items-start justify-center"
							style={{
								transform: `translateY(${row.start}px)`,
								height: measuredHeight,
								gridTemplateColumns: `repeat(${columnCount}, ${measuredWidth}px)`,
								columnGap: `${gap}px`,
								contain: 'layout paint style'
							}}
						>
							{cells}
						</div>
					);
				})}
			</div>
		</ScrollArea>
	);
};

export default VirtualizedGrid;
