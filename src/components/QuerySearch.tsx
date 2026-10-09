'use client';

import cls from 'classnames';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import ScrollArea from '#components/styled/ScrollArea.tsx';
import {
	applySearchSuggestion,
	getSearchSuggestions,
	parseSearchQuery,
	type SearchCatalog,
	type SearchSuggestion
} from '#utils/searchQuery.ts';
import useGridSearch from '#utils/useGridSearch.ts';

type Props<RecordType> = {
	catalog: SearchCatalog<RecordType>;
	label: string;
};

const getSelectionOffsets = (element: HTMLElement) => {
	const selection = window.getSelection();
	if (
		!selection?.anchorNode ||
		!selection.focusNode ||
		!element.contains(selection.anchorNode) ||
		!element.contains(selection.focusNode)
	)
		return {
			start: element.textContent?.length ?? 0,
			end: element.textContent?.length ?? 0
		};

	const getOffset = (node: Node, offset: number) => {
		const range = document.createRange();
		range.selectNodeContents(element);
		range.setEnd(node, offset);
		return range.toString().length;
	};
	const anchor = getOffset(selection.anchorNode, selection.anchorOffset);
	const focus = getOffset(selection.focusNode, selection.focusOffset);
	return { start: Math.min(anchor, focus), end: Math.max(anchor, focus) };
};

const setSelectionOffsets = (
	element: HTMLElement,
	start: number,
	end = start
) => {
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	const points: { node: Node; offset: number }[] = [];
	const remaining = [start, end];
	let node: Node | null;
	while ((node = walker.nextNode())) {
		const length = node.textContent?.length ?? 0;
		for (const [index, value] of remaining.entries()) {
			if (value <= length) points[index] ??= { node, offset: value };
			else remaining[index] = value - length;
		}
	}
	if (points.length < 2 || !points[0] || !points[1]) {
		const textNode = document.createTextNode('');
		element.append(textNode);
		points[0] ??= { node: textNode, offset: 0 };
		points[1] ??= points[0];
	}
	const range = document.createRange();
	range.setStart(points[0].node, points[0].offset);
	range.setEnd(points[1].node, points[1].offset);
	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);
};

const QuerySearch = <RecordType,>({ catalog, label }: Props<RecordType>) => {
	const { search, setSearch, reset } = useGridSearch(catalog);

	const [inputValue, setInputValue] = useState(search);
	const [caret, setCaret] = useState(inputValue.length);
	const [selection, setSelection] = useState({
		start: inputValue.length,
		end: inputValue.length
	});
	const [highlightedIdx, setHighlightedIdx] = useState(-1);
	const [focused, setFocused] = useState(false);

	const editor = useRef<HTMLDivElement>(null);
	const suggestionsViewport = useRef<HTMLDivElement>(null);
	const highlightedOption = useRef<HTMLDivElement>(null);
	const pendingSelection = useRef<{ start: number; end: number } | null>(null);
	const pointerDownTarget = useRef<EventTarget | null>(null);
	const composing = useRef(false);

	const suggestions = getSearchSuggestions(inputValue, caret, catalog);

	const visibleSuggestions = focused ? suggestions : [];
	const activeSuggestion = visibleSuggestions[highlightedIdx];

	useLayoutEffect(() => {
		const viewport = suggestionsViewport.current;
		const option = highlightedOption.current;
		if (!viewport || !option) return;
		const viewportBounds = viewport.getBoundingClientRect();
		const optionBounds = option.getBoundingClientRect();
		if (optionBounds.top < viewportBounds.top) {
			viewport.scrollTop += optionBounds.top - viewportBounds.top;
		} else if (optionBounds.bottom > viewportBounds.bottom) {
			viewport.scrollTop += optionBounds.bottom - viewportBounds.bottom;
		}
	}, [highlightedIdx, focused, activeSuggestion?.text]);

	useEffect(() => {
		const trackPointerDown = (event: PointerEvent) => {
			pointerDownTarget.current = event.target;
		};
		const clearPointerDown = () => {
			pointerDownTarget.current = null;
		};
		document.addEventListener('pointerdown', trackPointerDown, true);
		document.addEventListener('pointerup', clearPointerDown, true);
		return () => {
			document.removeEventListener('pointerdown', trackPointerDown, true);
			document.removeEventListener('pointerup', clearPointerDown, true);
		};
	}, []);

	useLayoutEffect(() => {
		const element = editor.current;
		if (!element) return;
		const wasFocused = document.activeElement === element;
		const currentSelection = wasFocused ? getSelectionOffsets(element) : null;
		const { diagnostics } = parseSearchQuery(inputValue, catalog);
		const boundaries = [
			...new Set([
				0,
				inputValue.length,
				...diagnostics.flatMap(({ start, end }) => [start, end])
			])
		]
			.filter(position => position >= 0 && position <= inputValue.length)
			.toSorted((left, right) => left - right);
		const segments = boundaries.slice(0, -1).map((start, index) => {
			const end = boundaries[index + 1]!;
			const diagnostic = diagnostics.find(
				item => item.start <= start && item.end >= end
			);
			const editingDiagnostic =
				focused &&
				diagnostic &&
				diagnostic.start <= caret &&
				caret <= diagnostic.end;
			const span = document.createElement('span');
			span.textContent = inputValue.slice(start, end);
			span.className =
				diagnostic && !editingDiagnostic
					? 'text-muted line-through'
					: 'text-white';
			if (diagnostic && !editingDiagnostic) span.title = diagnostic.message;
			return span;
		});
		element.replaceChildren(...segments);
		const nextSelection = pendingSelection.current;
		pendingSelection.current = null;
		if (wasFocused && (nextSelection || currentSelection)) {
			element.focus();
			const selectionToRestore = nextSelection ?? currentSelection!;
			setSelectionOffsets(
				element,
				selectionToRestore.start,
				selectionToRestore.end
			);
		}
	}, [inputValue, catalog, caret, focused]);

	const updateCaret = () => {
		const current = editor.current;
		if (!current) return;
		const offsets = getSelectionOffsets(current);
		setCaret(offsets.start);
		setSelection(offsets);
	};

	const updateQueryFromEditor = (element: HTMLDivElement) => {
		if (composing.current) return;
		const value = (element.textContent ?? '').replace(/[\r\n]/g, '');
		const offsets = getSelectionOffsets(element);
		pendingSelection.current = {
			start: Math.min(offsets.start, value.length),
			end: Math.min(offsets.end, value.length)
		};
		setCaret(pendingSelection.current.start);
		setSelection(pendingSelection.current);
		setInputValue(value);
		setHighlightedIdx(-1);
	};

	const chooseSuggestion = (suggestion: SearchSuggestion) => {
		const offsets = editor.current
			? getSelectionOffsets(editor.current)
			: { start: caret, end: selection.end };
		const replacement = applySearchSuggestion(
			inputValue,
			offsets.start,
			suggestion,
			offsets.end
		);
		pendingSelection.current = {
			start: replacement.caret,
			end: replacement.caret
		};
		setCaret(replacement.caret);
		setSelection(pendingSelection.current);
		setInputValue(replacement.query);
		setSearch(replacement.query);
		setHighlightedIdx(-1);
		editor.current?.focus();
	};

	return (
		<form
			className="-my-2.5 w-full px-1"
			onSubmit={event => {
				event.preventDefault();
				if (composing.current) return;
				setSearch(inputValue);
				pendingSelection.current = null;
				editor.current?.blur();
			}}
		>
			<div className="relative flex w-full items-center">
				<div
					ref={editor}
					// oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
					role="textbox"
					aria-label={label}
					aria-multiline="false"
					tabIndex={0}
					aria-autocomplete="list"
					aria-controls="query-search-suggestions"
					aria-activedescendant={
						activeSuggestion ? `query-suggestion-${highlightedIdx}` : undefined
					}
					contentEditable
					suppressContentEditableWarning
					data-placeholder={`${label}...`}
					className="w-full min-w-0 overflow-x-auto ns-input p-2 pr-10 text-base whitespace-pre caret-white empty:before:pointer-events-none empty:before:text-muted empty:before:content-[attr(data-placeholder)] hover:ns-input-hover focus:ns-input-active"
					onFocus={event => {
						const target = pointerDownTarget.current;
						if (
							target instanceof Node &&
							!event.currentTarget.contains(target)
						) {
							event.currentTarget.blur();
							return;
						}
						if (target instanceof Node) return;
						setFocused(true);
					}}
					onBlur={() => {
						if (pendingSelection.current) return;
						setFocused(false);
						setHighlightedIdx(-1);
					}}
					onClick={() => {
						updateCaret();
					}}
					onInput={event => updateQueryFromEditor(event.currentTarget)}
					onMouseUp={() => {
						updateCaret();
						setFocused(true);
					}}
					onKeyUp={updateCaret}
					onPaste={event => {
						event.preventDefault();
						const text = event.clipboardData
							.getData('text/plain')
							.replace(/[\r\n]/g, '');
						document.execCommand('insertText', false, text);
					}}
					onCompositionStart={() => {
						composing.current = true;
					}}
					onCompositionEnd={event => {
						composing.current = false;
						updateQueryFromEditor(event.currentTarget);
					}}
					onKeyDown={event => {
						if (event.nativeEvent.isComposing || composing.current) return;
						if (event.key === 'ArrowDown' && suggestions.length) {
							event.preventDefault();
							setHighlightedIdx(index => (index + 1) % suggestions.length);
							return;
						}
						if (event.key === 'ArrowUp' && suggestions.length) {
							event.preventDefault();
							setHighlightedIdx(index =>
								index <= 0 ? suggestions.length - 1 : index - 1
							);
							return;
						}
						if (event.key === 'Escape') {
							event.preventDefault();
							setHighlightedIdx(-1);
							event.currentTarget.blur();
							return;
						}
						if (event.key !== 'Enter') return;
						event.preventDefault();
						if (activeSuggestion) chooseSuggestion(activeSuggestion);
						else editor.current?.closest('form')?.requestSubmit();
					}}
				/>
				{!!inputValue && (
					<button
						type="button"
						aria-label="Clear search"
						title="Clear search"
						onClick={() => {
							reset();
							pendingSelection.current = { start: 0, end: 0 };
							setInputValue('');
							setCaret(0);
							setSelection({ start: 0, end: 0 });
							setHighlightedIdx(-1);
							editor.current?.focus();
						}}
						className="absolute right-2 -mb-1 flex cursor-pointer transparent-btn p-1 active:ns-btn-pressed hocus:ns-btn-hover"
					>
						<img
							src="/assets/icons/icon_cross.webp"
							alt=""
							aria-hidden
							className="size-2.75"
						/>
					</button>
				)}
				{visibleSuggestions.length > 0 && (
					<div
						id="query-search-suggestions"
						// oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
						role="listbox"
						tabIndex={-1}
						className="absolute top-full left-0 z-50 w-full pt-1"
						onMouseDown={event => event.preventDefault()}
					>
						<ScrollArea
							ref={suggestionsViewport}
							tabIndex={-1}
							containerClassName="max-h-[min(48rem,70vh)] ns-borderless-btn-dark p-2 pb-3"
							contentClassName="flex min-w-max w-full flex-col whitespace-nowrap"
							offset={24}
						>
							{visibleSuggestions.map((suggestion, index) => (
								<div
									key={suggestion.text}
									ref={index === highlightedIdx ? highlightedOption : undefined}
									id={`query-suggestion-${index}`}
									// oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
									role="option"
									aria-selected={index === highlightedIdx}
									className={cls(
										'flex cursor-pointer items-center gap-8 transparent-btn px-2 text-lg font-bold select-none pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover hocus:*:text-white!',
										index === highlightedIdx && 'ns-btn-hover *:text-white!'
									)}
									tabIndex={-1}
									onMouseEnter={() => setHighlightedIdx(index)}
									onKeyDown={event => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault();
											chooseSuggestion(suggestion);
										}
									}}
									onClick={() => chooseSuggestion(suggestion)}
								>
									<span>
										{suggestion.prefix && (
											<span className="text-muted">{suggestion.prefix}</span>
										)}
										<span
											className={cls(
												suggestion.kind === 'keyword'
													? 'text-alert'
													: suggestion.kind === 'attribute'
														? ''
														: 'italic'
											)}
										>
											{suggestion.label}
										</span>
									</span>
									{suggestion.description && (
										<span className="text-base text-muted italic">
											{suggestion.description}
										</span>
									)}
								</div>
							))}
						</ScrollArea>
					</div>
				)}
			</div>
		</form>
	);
};

export default QuerySearch;
