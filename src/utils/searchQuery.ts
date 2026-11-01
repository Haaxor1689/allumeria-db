type Primitive = string | number | boolean | null;

type SearchEntry<RecordType> = {
	record: RecordType;
	text: string[];
	fields: Map<string, Primitive[]>;
};

export type SearchCatalog<RecordType> = {
	entries: SearchEntry<RecordType>[];
	fields: Map<string, Primitive[]>;
	descriptions: Readonly<Record<string, string>>;
};

type Token = {
	start: number;
	end: number;
	raw: string;
	text: string;
	separator: number;
	valueQuoted: boolean;
	complete: boolean;
};

type Term = {
	negated: boolean;
	kind: 'text' | 'has' | 'value';
	field: string;
	value: string;
	comparison?: '>' | '<' | '>=' | '<=';
};

export type ParsedSearchQuery = {
	terms: Term[];
	diagnostics: {
		start: number;
		end: number;
		message: string;
	}[];
};

export type SearchSuggestion = {
	label: string;
	prefix?: string;
	description?: string;
	kind: 'keyword' | 'attribute' | 'value';
	text: string;
	complete: boolean;
};

const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);
const comparisonOperators = ['>=', '<=', '>', '<'] as const;
const comparisonDescriptions = {
	'>': 'Greater than',
	'<': 'Less than',
	'>=': 'Greater than or equal to',
	'<=': 'Less than or equal to'
};

const tokenize = (query: string): Token[] => {
	const tokens: Token[] = [];
	let cursor = 0;
	while (cursor < query.length) {
		if (/\s/.test(query[cursor]!)) {
			cursor++;
			continue;
		}
		const start = cursor;
		let text = '';
		let quoted = false;
		let separator = -1;
		let valueQuoted = false;
		while (cursor < query.length) {
			const character = query[cursor]!;
			if (!quoted && /\s/.test(character)) break;
			if (character === '"') {
				quoted = !quoted;
			} else if (
				quoted &&
				character === '\\' &&
				['"', '\\'].includes(query[cursor + 1] ?? '')
			) {
				text += query[++cursor];
			} else {
				if (!quoted && character === ':' && separator === -1) {
					separator = text.length;
					valueQuoted = query[cursor + 1] === '"';
				}
				text += character;
			}
			cursor++;
		}
		tokens.push({
			start,
			end: cursor,
			raw: query.slice(start, cursor),
			text,
			separator,
			valueQuoted,
			complete: !quoted
		});
	}
	return tokens;
};

export const createSearchCatalog = <RecordType>({
	records,
	getView,
	descriptions = {},
	fullTextPaths = ['id', 'name']
}: {
	records: readonly RecordType[];
	getView?: (record: RecordType) => object;
	descriptions?: Readonly<Record<string, string>>;
	fullTextPaths?: readonly string[];
}): SearchCatalog<RecordType> => {
	const fields = new Map<string, Primitive[]>();
	const entries = records.map(record => {
		const view = getView?.(record) ?? record;
		const entryFields = new Map<string, Primitive[]>();
		const visit = (value: unknown, path: string, includePath = true) => {
			const values = entryFields.get(path) ?? [];
			if (includePath) entryFields.set(path, values);
			if (
				value === null ||
				typeof value === 'string' ||
				typeof value === 'number' ||
				typeof value === 'boolean'
			) {
				values.push(value);
			} else if (Array.isArray(value)) {
				value.forEach((member: unknown) => {
					if (member !== null && typeof member === 'object') {
						visit(member, `${path}[]`, Array.isArray(member));
					} else if (member !== undefined) {
						visit(member, path);
					}
				});
			} else if (value !== null && typeof value === 'object') {
				Object.entries(value).forEach(([key, child]) => {
					if (!forbiddenKeys.has(key) && child !== undefined)
						visit(child, path ? `${path}.${key}` : key);
				});
			}
		};
		visit(view, '');
		entryFields.delete('');
		entryFields.forEach((values, path) => {
			fields.set(path, [...(fields.get(path) ?? []), ...values]);
		});
		return {
			record,
			text: fullTextPaths.flatMap(path =>
				(entryFields.get(path) ?? []).map(value => String(value).toLowerCase())
			),
			fields: entryFields
		};
	});
	fields.forEach((values, path) => fields.set(path, [...new Set(values)]));
	return { entries, fields, descriptions };
};

const canCompare = (actual: Primitive, expected: string) => {
	if (typeof actual === 'string') return true;
	if (typeof actual === 'number')
		return expected.trim() !== '' && Number.isFinite(Number(expected));
	if (typeof actual === 'boolean') return /^(true|false)$/i.test(expected);
	return expected.toLowerCase() === 'null';
};

const equals = (actual: Primitive, expected: string) => {
	if (!canCompare(actual, expected)) return false;
	if (typeof actual === 'string')
		return actual.toLowerCase() === expected.toLowerCase();
	if (typeof actual === 'number') return actual === Number(expected);
	if (typeof actual === 'boolean')
		return actual === (expected.toLowerCase() === 'true');
	return true;
};

export const parseSearchQuery = <RecordType>(
	query: string,
	catalog: SearchCatalog<RecordType>
): ParsedSearchQuery => {
	const terms: Term[] = [];
	const diagnostics: ParsedSearchQuery['diagnostics'] = [];
	for (const token of tokenize(query)) {
		const negated = token.raw.startsWith('!');
		const text = negated ? token.text.slice(1) : token.text;
		const separator = token.separator - Number(negated);
		let diagnostic = '';
		if (!token.complete || !text || token.raw.startsWith('!!')) {
			diagnostic = 'Incomplete or invalid term';
		} else if (token.separator < 0) {
			terms.push({ negated, kind: 'text', field: '', value: text });
			continue;
		} else {
			const field = text.slice(0, separator);
			const value = text.slice(separator + 1);
			const isPresence = field.toUpperCase() === 'HAS';
			const path = isPresence ? value : field;
			const comparison =
				!isPresence && !token.valueQuoted
					? comparisonOperators.find(operator => value.startsWith(operator))
					: undefined;
			const operand = comparison ? value.slice(comparison.length) : value;
			if (!field || token.raw.endsWith(':') || (comparison && !operand)) {
				diagnostic = 'Incomplete term';
			} else if (!catalog.fields.has(path)) {
				diagnostic = `Unknown field: ${path}`;
			} else if (
				!isPresence &&
				!catalog.fields
					.get(path)!
					.some(actual =>
						comparison
							? typeof actual === 'number' && canCompare(actual, operand)
							: canCompare(actual, operand)
					)
			) {
				diagnostic = `Invalid value for ${path}`;
			} else {
				terms.push({
					negated,
					kind: isPresence ? 'has' : 'value',
					field: path,
					value: operand,
					comparison
				});
				continue;
			}
		}
		diagnostics.push({
			start: token.start,
			end: token.end,
			message: `${diagnostic} (${token.raw})`
		});
	}
	return { terms, diagnostics };
};

const matchesValue = (actual: Primitive, term: Term) => {
	if (!term.comparison) return equals(actual, term.value);
	if (typeof actual !== 'number') return false;
	const expected = Number(term.value);
	switch (term.comparison) {
		case '>':
			return actual > expected;
		case '<':
			return actual < expected;
		case '>=':
			return actual >= expected;
		case '<=':
			return actual <= expected;
	}
};

export const filterSearchCatalog = <RecordType>(
	catalog: SearchCatalog<RecordType>,
	query: ParsedSearchQuery
): RecordType[] =>
	catalog.entries
		.filter(entry =>
			query.terms.every(term => {
				const matches =
					term.kind === 'text'
						? entry.text.some(text => text.includes(term.value.toLowerCase()))
						: term.kind === 'has'
							? entry.fields.has(term.field)
							: (entry.fields.get(term.field) ?? []).some(actual =>
									matchesValue(actual, term)
								);
				return term.negated ? !matches : matches;
			})
		)
		.map(entry => entry.record);

const quoteValue = (value: string) =>
	value === '' || /[\s":\\!<>]/.test(value) ? JSON.stringify(value) : value;

const getOrderedFields = (fields: Map<string, Primitive[]>) => {
	const children = new Map<string, Set<string>>();
	for (const path of fields.keys()) {
		let parent = '';
		for (const segment of path.replaceAll('[]', '.[]').split('.')) {
			const child =
				segment === '[]'
					? `${parent}[]`
					: parent
						? `${parent}.${segment}`
						: segment;
			const siblings = children.get(parent) ?? new Set<string>();
			siblings.add(child);
			children.set(parent, siblings);
			parent = child;
		}
	}
	const ordered: string[] = [];
	const visit = (parent: string) => {
		for (const path of children.get(parent) ?? []) {
			if (fields.has(path)) ordered.push(path);
			visit(path);
		}
	};
	visit('');
	return ordered;
};

const maxValueSuggestions = 20;

export const getSearchSuggestions = <RecordType>(
	query: string,
	caret: number,
	catalog: SearchCatalog<RecordType>
): SearchSuggestion[] => {
	const token = tokenize(query).find(
		candidate => candidate.start <= caret && candidate.end >= caret
	);
	const raw = token ? query.slice(token.start, caret) : '';
	const partial = tokenize(raw)[0];
	const negated = raw.startsWith('!');
	const prefix = negated ? '!' : '';
	const text = partial?.text.slice(Number(negated)) ?? '';
	const separator = (partial?.separator ?? -1) - Number(negated);
	const orderedFields = getOrderedFields(catalog.fields);
	const hasMissingEntries = (path: string) =>
		catalog.entries.some(entry => !entry.fields.has(path));
	const hasMultipleValues = (path: string) =>
		catalog.fields.get(path)!.length > 1;
	const isOptionalTrue = (path: string) =>
		catalog.fields.get(path)!.length === 1 &&
		catalog.fields.get(path)![0] === true &&
		hasMissingEntries(path);
	const isSuggestibleAttribute = (path: string) =>
		hasMultipleValues(path) || isOptionalTrue(path);
	const fields = orderedFields.filter(
		path =>
			isSuggestibleAttribute(path) &&
			catalog.fields.get(path)!.some(value => value !== null)
	);
	const getValueSuggestions = (
		field: string,
		needle: string,
		comparison = ''
	): SearchSuggestion[] => {
		const lower = needle.toLowerCase();
		const matches: SearchSuggestion[] = [];
		const seen = new Set<string>();
		for (const value of catalog.fields.get(field) ?? []) {
			if (comparison && typeof value !== 'number') continue;
			const label = String(value);
			if (!label.toLowerCase().includes(lower)) continue;
			const text = `${prefix}${field}:${comparison}${quoteValue(label)}`;
			if (seen.has(text)) continue;
			seen.add(text);
			matches.push({
				label,
				prefix: `${prefix}${field}:${comparison}`,
				kind: 'value',
				text,
				complete: true
			});
			if (matches.length === maxValueSuggestions) break;
		}
		return matches;
	};
	let candidates: SearchSuggestion[];
	let needle = text;
	if (partial && partial.separator >= 0) {
		const field = text.slice(0, separator);
		needle = text.slice(separator + 1);
		const values = catalog.fields.get(field) ?? [];
		const comparison = !partial.valueQuoted
			? comparisonOperators.find(operator => needle.startsWith(operator))
			: undefined;
		if (comparison) needle = needle.slice(comparison.length);
		candidates =
			field.toUpperCase() === 'HAS'
				? orderedFields
						.filter(
							path => isSuggestibleAttribute(path) && hasMissingEntries(path)
						)
						.map(path => ({
							label: path,
							prefix: `${prefix}HAS:`,
							description: catalog.descriptions[path],
							kind: 'attribute' as const,
							text: `${prefix}HAS:${path}`,
							complete: true
						}))
				: [
						...(needle === '' &&
						!comparison &&
						!partial.valueQuoted &&
						values.some(value => typeof value === 'number')
							? comparisonOperators.map(operator => ({
									label: operator,
									prefix: `${prefix}${field}:`,
									description: comparisonDescriptions[operator],
									kind: 'keyword' as const,
									text: `${prefix}${field}:${operator}`,
									complete: false
								}))
							: []),
						...getValueSuggestions(field, needle, comparison)
					];
	} else {
		candidates = [
			{
				label: 'HAS:',
				prefix,
				description: 'Attribute exists',
				kind: 'keyword',
				text: `${prefix}HAS:`,
				complete: false
			},
			...fields.map(field => ({
				label: `${field}:`,
				prefix,
				description: catalog.descriptions[field],
				kind: 'attribute' as const,
				text: `${prefix}${field}:`,
				complete: false
			})),
			...(negated
				? []
				: [
						{
							label: '!',
							description: 'Exclude matches',
							kind: 'keyword' as const,
							text: '!',
							complete: false
						}
					]),
			...(needle.length >= 2
				? fields.flatMap(field => getValueSuggestions(field, needle))
				: [])
		];
	}
	const lower = needle.toLowerCase();
	const seen = new Set<string>();
	const lowerLabels = new Map<SearchSuggestion, string>();
	const valueGroups = new Map<string | undefined, number>();
	const matches = candidates.filter(candidate => {
		const label = candidate.label.toLowerCase();
		if (!label.includes(lower) || seen.has(candidate.text)) return false;
		seen.add(candidate.text);
		lowerLabels.set(candidate, label);
		if (candidate.kind === 'value' && !valueGroups.has(candidate.prefix)) {
			valueGroups.set(candidate.prefix, valueGroups.size);
		}
		return true;
	});
	return matches.toSorted(
		(left, right) =>
			Number(right.kind === 'keyword') - Number(left.kind === 'keyword') ||
			Number(right.kind === 'attribute') - Number(left.kind === 'attribute') ||
			(left.kind === 'value' && right.kind === 'value'
				? valueGroups.get(left.prefix)! - valueGroups.get(right.prefix)!
				: 0) ||
			(left.kind === 'attribute' && right.kind === 'attribute'
				? 0
				: Number(lowerLabels.get(right)!.startsWith(lower)) -
						Number(lowerLabels.get(left)!.startsWith(lower)) ||
					Number(left.complete) - Number(right.complete) ||
					left.label.localeCompare(right.label))
	);
};

export const applySearchSuggestion = (
	query: string,
	caret: number,
	suggestion: SearchSuggestion,
	selectionEnd = caret
) => {
	const tokens = tokenize(query);
	const token = tokens.find(
		candidate => candidate.start <= caret && candidate.end >= caret
	);
	const start = token?.start ?? caret;
	const end = Math.max(token?.end ?? caret, selectionEnd);
	const suffix = query.slice(end);
	const replacement =
		suggestion.text +
		(suggestion.complete && (!suffix || !/^\s/.test(suffix)) ? ' ' : '');
	return {
		query: query.slice(0, start) + replacement + suffix,
		caret: start + replacement.length
	};
};
