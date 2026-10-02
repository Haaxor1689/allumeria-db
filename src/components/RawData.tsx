'use client';

import cn from 'classnames';
import { Check, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';

import Button from '#components/styled/Button.tsx';
import { DataTagNumber } from '#utils/parseDataTag.ts';

type Props = {
	data: unknown;
};

type JsonPrimitive = string | number | boolean | null;

const BRACKET_COLORS = [
	'text-[#ffd700]',
	'text-[#da70d6]',
	'text-[#179fff]'
] as const;

type Line = {
	id: string;
	lineNumber: number;
	depth: number;
	bracketDepth: number;
	isFoldable?: boolean;
	isCollapsed?: boolean;
	path?: string;
	keyName?: string;
	value?: JsonPrimitive | Uint8Array | DataTagNumber;
	hasValue?: boolean;
	openBracket?: '{' | '[';
	closeBracket?: '}' | ']';
	collapsedSummary?: string;
	isLast?: boolean;
};

const collectFoldablePaths = (
	data: unknown,
	path = '$',
	result: string[] = []
): string[] => {
	if (data instanceof Uint8Array || data instanceof DataTagNumber)
		return result;
	if (typeof data === 'object' && data !== null) {
		const isArray = Array.isArray(data);
		const entries = isArray
			? Array.from(
					data as ArrayLike<unknown>,
					(value, index) => [String(index), value] as const
				)
			: Object.entries(data as Record<string, unknown>);
		if (entries.length > 0) {
			if (path !== '$') result.push(path);
			for (const [k, v] of entries) {
				collectFoldablePaths(v, `${path}.${k}`, result);
			}
		}
	}
	return result;
};

const buildVisibleLines = (
	data: unknown,
	collapsedPaths: Set<string>
): Line[] => {
	const lines: Line[] = [];
	let lineCounter = 1;

	const traverse = (
		val: unknown,
		keyName: string | undefined,
		depth: number,
		bracketDepth: number,
		path: string,
		isLast: boolean
	) => {
		const isObject = typeof val === 'object' && val !== null;
		const isArray = Array.isArray(val);

		if (
			!isObject ||
			val instanceof Uint8Array ||
			val instanceof DataTagNumber
		) {
			lines.push({
				id: `${path}-val`,
				lineNumber: lineCounter++,
				depth,
				bracketDepth,
				keyName,
				value: val as JsonPrimitive | Uint8Array | DataTagNumber,
				hasValue: true,
				isLast
			});
			return;
		}

		const entries = isArray
			? Array.from(
					val as ArrayLike<unknown>,
					(value, index) => [String(index), value] as const
				)
			: Object.entries(val as Record<string, unknown>);

		const openBracket = isArray ? '[' : '{';
		const closeBracket = isArray ? ']' : '}';

		if (entries.length === 0) {
			lines.push({
				id: `${path}-empty`,
				lineNumber: lineCounter++,
				depth,
				bracketDepth,
				keyName,
				openBracket,
				closeBracket,
				isLast
			});
			return;
		}

		const isRoot = path === '$';
		const isCollapsed = !isRoot && collapsedPaths.has(path);
		const countText = isArray
			? `${entries.length} item${entries.length === 1 ? '' : 's'}`
			: `${entries.length} key${entries.length === 1 ? '' : 's'}`;

		const currentLine = lineCounter++;

		if (isCollapsed) {
			lines.push({
				id: `${path}-start`,
				lineNumber: currentLine,
				depth,
				bracketDepth,
				isFoldable: !isRoot,
				isCollapsed: true,
				path,
				keyName,
				openBracket,
				closeBracket,
				collapsedSummary: countText,
				isLast
			});

			// Skip counting inner lines so remaining lines retain true original line numbers
			const countInnerLines = (innerVal: unknown) => {
				if (
					typeof innerVal !== 'object' ||
					innerVal === null ||
					innerVal instanceof Uint8Array ||
					innerVal instanceof DataTagNumber
				) {
					lineCounter++;
					return;
				}
				const innerEntries = Array.isArray(innerVal)
					? Array.from(
							innerVal as ArrayLike<unknown>,
							(value, index) => [String(index), value] as const
						)
					: Object.entries(innerVal as Record<string, unknown>);
				if (innerEntries.length === 0) {
					lineCounter++;
					return;
				}
				lineCounter++; // start bracket
				for (const [, v] of innerEntries) {
					countInnerLines(v);
				}
				lineCounter++; // end bracket
			};

			for (const [, v] of entries) {
				countInnerLines(v);
			}
			lineCounter++; // end bracket for this node
			return;
		}

		// Expanded start line
		lines.push({
			id: `${path}-start`,
			lineNumber: currentLine,
			depth,
			bracketDepth,
			isFoldable: !isRoot,
			isCollapsed: false,
			path,
			keyName,
			openBracket
		});

		// Children
		for (let i = 0; i < entries.length; i++) {
			const [k, v] = entries[i]!;
			const isChildLast = i === entries.length - 1;
			traverse(
				v,
				isArray ? undefined : k,
				depth + 1,
				bracketDepth + 1,
				`${path}.${k}`,
				isChildLast
			);
		}

		// Closing line
		lines.push({
			id: `${path}-end`,
			lineNumber: lineCounter++,
			depth,
			bracketDepth,
			closeBracket,
			isLast
		});
	};

	traverse(data, undefined, 0, 0, '$', true);
	return lines;
};

const BufferValue = ({ value }: { value: Uint8Array }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const preview = Array.from(isExpanded ? value : value.subarray(0, 16), byte =>
		byte.toString(16).padStart(2, '0')
	).join(' ');
	return (
		<span>
			<span className="whitespace-nowrap">
				{value.byteLength > 16 && (
					<button
						type="button"
						onClick={() => setIsExpanded(previous => !previous)}
						aria-expanded={isExpanded}
						aria-label={isExpanded ? 'Collapse buffer' : 'Expand buffer'}
						title={isExpanded ? 'Collapse buffer' : 'Expand buffer'}
						className="mr-1 inline-flex size-5 cursor-pointer items-center justify-center rounded align-middle text-[#858585] hover:bg-white/15 hover:text-white"
					>
						{isExpanded ? (
							<ChevronDown className="size-3.5" />
						) : (
							<ChevronRight className="size-3.5" />
						)}
					</button>
				)}
				<span className="text-[#4ec9b0]">Buffer</span>
				<span className="text-[#858585]">
					({value.byteLength} {value.byteLength === 1 ? 'byte' : 'bytes'}){' '}
				</span>
			</span>
			<span className="text-[#b5cea8]">
				{'<'}
				{preview}
				{!isExpanded && value.byteLength > 16 ? ' ...' : ''}
				{'>'}
			</span>
		</span>
	);
};

const JsonValue = ({
	value
}: {
	value: JsonPrimitive | Uint8Array | DataTagNumber;
}) => {
	if (value instanceof Uint8Array) return <BufferValue value={value} />;
	if (value instanceof DataTagNumber) {
		return (
			<span className="text-[#b5cea8]" title={value.type}>
				{value.toString()}
			</span>
		);
	}
	if (value === null) {
		return <span className="text-[#569cd6]">null</span>;
	}
	if (typeof value === 'string') {
		return <span className="text-[#ce9178]">"{value}"</span>;
	}
	if (typeof value === 'number') {
		return <span className="text-[#b5cea8]">{value}</span>;
	}
	if (typeof value === 'boolean') {
		return <span className="text-[#569cd6]">{value ? 'true' : 'false'}</span>;
	}
	return <span className="text-[#d4d4d4]">{String(value)}</span>;
};

const RawData = ({ data }: Props) => {
	const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(
		() => new Set(data ? collectFoldablePaths(data) : [])
	);
	const [copied, setCopied] = useState(false);

	const allFoldablePaths = useMemo(
		() => (data ? collectFoldablePaths(data) : []),
		[data]
	);

	const visibleLines = useMemo(
		() => (data ? buildVisibleLines(data, collapsedPaths) : []),
		[data, collapsedPaths]
	);

	if (!data) return null;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(
				JSON.stringify(
					data,
					(_key, value: unknown) =>
						value instanceof Uint8Array
							? { $type: 'Binary', $value: Array.from(value) }
							: value,
					2
				)
			);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy raw data:', err);
		}
	};

	const togglePath = (path: string, shiftKey = false) => {
		setCollapsedPaths(prev => {
			const next = new Set(prev);
			const paths = shiftKey
				? allFoldablePaths.filter(
						foldablePath =>
							foldablePath === path || foldablePath.startsWith(`${path}.`)
					)
				: [path];

			if (next.has(path)) {
				paths.forEach(foldablePath => next.delete(foldablePath));
			} else {
				paths.forEach(foldablePath => next.add(foldablePath));
			}
			return next;
		});
	};

	return (
		<div className="group relative ns-slot">
			<div className="absolute top-0 right-0 hidden justify-end gap-1 opacity-50 group-hover:flex hover:opacity-100">
				<Button
					variant="purple"
					className="text-xs"
					onClick={() => setCollapsedPaths(new Set())}
				>
					Expand all
				</Button>
				<Button
					variant="purple"
					className="text-xs"
					onClick={() => setCollapsedPaths(new Set(allFoldablePaths))}
				>
					Collapse all
				</Button>
				<Button
					variant="pink"
					className="flex items-center gap-1.5 text-xs"
					onClick={handleCopy}
				>
					{copied ? (
						<>
							<Check className="size-3.5 text-aqua" />
							<span>Copied!</span>
						</>
					) : (
						<>
							<Copy className="size-3.5" />
							<span>Copy JSON</span>
						</>
					)}
				</Button>
			</div>

			<div className="min-w-0 overflow-x-auto font-mono text-sm leading-6 text-[#d4d4d4]">
				{visibleLines.map(line => {
					const bracketColor =
						BRACKET_COLORS[line.bracketDepth % BRACKET_COLORS.length];
					const isBuffer = line.value instanceof Uint8Array;

					return (
						<div
							key={line.id}
							className={cn(
								'group/line flex hover:bg-white/5',
								isBuffer ? 'items-start' : 'items-center'
							)}
						>
							<div className="flex shrink-0 items-center select-none">
								<span className="w-8 pr-2 text-right text-xs text-[#858585] group-hover/line:text-[#c6c6c6]">
									{line.lineNumber}
								</span>
								<div className="flex w-6 items-center justify-center">
									{line.isFoldable && (
										<button
											type="button"
											onClick={e => togglePath(line.path!, e.shiftKey)}
											className={cn(
												'flex size-5 cursor-pointer items-center justify-center rounded text-[#858585] transition-colors hover:bg-white/15 hover:text-white',
												line.isCollapsed
													? 'opacity-100'
													: 'opacity-0 group-hover/line:opacity-100'
											)}
											aria-label={
												line.isCollapsed ? 'Expand section' : 'Collapse section'
											}
										>
											{line.isCollapsed ? (
												<ChevronRight className="size-3.5" />
											) : (
												<ChevronDown className="size-3.5" />
											)}
										</button>
									)}
								</div>
							</div>

							<div
								className={
									isBuffer
										? 'min-w-0 flex-1 wrap-break-word whitespace-normal'
										: 'flex items-center whitespace-pre'
								}
								style={{ paddingLeft: `${line.depth * 16}px` }}
							>
								{line.keyName !== undefined && (
									<>
										<span className="text-[#9cdcfe]">"{line.keyName}"</span>
										<span className="text-[#d4d4d4]">: </span>
									</>
								)}

								{line.openBracket && (
									<span className={bracketColor}>{line.openBracket}</span>
								)}

								{line.isCollapsed && (
									<button
										type="button"
										onClick={e => togglePath(line.path!, e.shiftKey)}
										className="mx-1 cursor-pointer rounded bg-white/10 px-1.5 py-0.5 text-xs text-muted hover:bg-white/20 hover:text-white"
									>
										... {line.collapsedSummary} ...
									</button>
								)}

								{line.closeBracket && (
									<span className={bracketColor}>{line.closeBracket}</span>
								)}

								{line.hasValue && <JsonValue value={line.value!} />}

								{line.isLast === false && (
									<span className="text-[#d4d4d4]">,</span>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default RawData;
