import assert from 'node:assert/strict';
import { test } from 'node:test';

import blocks from '../data/blocks.json';
import effects from '../data/effects.json';
import entities from '../data/entities.json';
import items from '../data/items.json';
import translations from '../data/translations.json';
import {
	getBlockName,
	getCreatureName,
	getTranslation,
	npcDataExt
} from './helpers.ts';
import { toDisplayName } from './index.ts';
import {
	applySearchSuggestion,
	createSearchCatalog,
	filterSearchCatalog,
	getSearchSuggestions,
	parseSearchQuery
} from './searchQuery.ts';

const blockSearch = createSearchCatalog({
	records: blocks,
	getView: block => ({ ...block, name: getBlockName(block) })
});
const creatureSearch = createSearchCatalog({
	records: entities.filter(entity => entity.category === 'creature'),
	getView: creature => ({ ...creature, name: getCreatureName(creature) })
});
const effectSearch = createSearchCatalog({
	records: effects,
	getView: effect => ({
		...effect,
		name: getTranslation(`effect.${effect.id}`, toDisplayName(effect.id))
	})
});
const npcSearch = createSearchCatalog({
	records: npcDataExt,
	getView: npc => ({
		...npc,
		entity: npc.entity.id,
		entityDetails: npc.entity,
		name: getCreatureName(npc.entity)
	})
});

const itemSearch = createSearchCatalog({
	records: items,
	getView: item => {
		const description =
			translations[`item.${item.id}.desc` as keyof typeof translations];
		return {
			...item,
			name: getTranslation(`item.${item.id}`),
			...(description ? { description } : {})
		};
	}
});

const records = [
	{
		id: 'stone_sword',
		name: 'Stone Sword',
		material: 'stone',
		active: false,
		damage: 0,
		nothing: null,
		empty: '',
		list: [],
		object: {},
		category: ['weapons', 'tools'],
		tags: { melee_damage: 5, can_place: true },
		light: [1, 0, 0],
		parts: [{ kind: 'blade' }]
	},
	{
		id: 'sandstone',
		name: 'Sandstone',
		material: 'sandstone',
		active: true,
		damage: 10,
		category: ['blocks'],
		tags: { can_place: false }
	},
	{ id: 'literal', name: '!odd:name "quoted" \\ path' }
];
const catalog = createSearchCatalog({ records, getView: record => record });
const search = (query: string) =>
	filterSearchCatalog(catalog, parseSearchQuery(query, catalog)).map(
		record => record.id
	);

void test('plain text searches only id/name; terms AND and negate', () => {
	assert.deepEqual(search('stone'), ['stone_sword', 'sandstone']);
	assert.deepEqual(search('weapons'), []);
	assert.deepEqual(search('stone !sand'), ['stone_sword']);
	assert.deepEqual(search('!stone'), ['literal']);
	assert.deepEqual(search('"Stone Sword"'), ['stone_sword']);
	assert.deepEqual(search('name:"Stone Sword"'), ['stone_sword']);
});

void test('full text paths override defaults and support nested and array values', () => {
	const custom = createSearchCatalog({
		records,
		getView: record => record,
		fullTextPaths: [
			'category',
			'parts[].kind',
			'tags.melee_damage',
			'active',
			'nothing',
			'missing',
			'object'
		]
	});
	const match = (query: string) =>
		filterSearchCatalog(custom, parseSearchQuery(query, custom)).map(
			record => record.id
		);
	assert.deepEqual(match('WEAP'), ['stone_sword']);
	assert.deepEqual(match('blade'), ['stone_sword']);
	assert.deepEqual(match('5 false null'), ['stone_sword']);
	assert.deepEqual(match('blocks true'), ['sandstone']);
	assert.deepEqual(match('!blade'), ['sandstone', 'literal']);
	assert.deepEqual(match('stone'), []);
	assert.deepEqual(match('name:"Stone Sword"'), ['stone_sword']);
	assert.deepEqual(match('missing'), []);
	assert.deepEqual(match('object'), []);
	const extended = createSearchCatalog({
		records,
		getView: record => record,
		fullTextPaths: ['id', 'name', 'category']
	});
	assert.deepEqual(
		filterSearchCatalog(
			extended,
			parseSearchQuery('stone weapons', extended)
		).map(record => record.id),
		['stone_sword']
	);
	const empty = createSearchCatalog({
		records,
		getView: record => record,
		fullTextPaths: []
	});
	assert.deepEqual(
		filterSearchCatalog(empty, parseSearchQuery('stone', empty)),
		[]
	);
	assert.deepEqual(
		filterSearchCatalog(empty, parseSearchQuery('damage:0', empty)),
		[records[0]]
	);
});

void test('field values match exactly with typed boolean/number values', () => {
	assert.deepEqual(search('material:STONE'), ['stone_sword']);
	assert.deepEqual(search('damage:0 active:false'), ['stone_sword']);
	assert.deepEqual(search('damage:10 active:TRUE'), ['sandstone']);
	assert.deepEqual(search('category:tools tags.melee_damage:5'), [
		'stone_sword'
	]);
	assert.deepEqual(search('light:1 light:0 parts[].kind:blade'), [
		'stone_sword'
	]);
	assert.deepEqual(search('parts[].kind:blade'), ['stone_sword']);
	assert.deepEqual(search('nothing:null empty:""'), ['stone_sword']);
	assert.deepEqual(search('!active:true'), ['stone_sword', 'literal']);
});

void test('every category rule must match within the same entry', () => {
	const source = [
		{ id: 'both', name: 'Both', category: ['natural', 'blocks'] },
		{ id: 'natural', name: 'Natural', category: ['natural'] },
		{ id: 'block', name: 'Block', category: ['blocks'] },
		{ id: 'other', name: 'Other', category: ['tools'] },
		{ id: 'empty', name: 'Empty', category: [] },
		{ id: 'missing', name: 'Missing' }
	];
	const categories = createSearchCatalog({
		records: source,
		getView: record => record
	});
	for (const query of [
		'category:natural category:blocks ',
		'category:blocks category:natural',
		'category:natural category:blocks category:natural'
	]) {
		const parsed = parseSearchQuery(query, categories);
		assert.deepEqual(parsed.diagnostics, [], query);
		assert.equal(parsed.terms.length, query.trim().split(' ').length);
		assert.deepEqual(
			filterSearchCatalog(categories, parsed).map(record => record.id),
			['both'],
			query
		);
	}
	const negated = parseSearchQuery(
		'category:natural !category:blocks',
		categories
	);
	assert.deepEqual(negated.diagnostics, []);
	assert.deepEqual(
		filterSearchCatalog(categories, negated).map(record => record.id),
		['natural']
	);
});

void test('array rules match any element without suggesting indexed paths', () => {
	const source = [
		{
			id: 'first',
			name: 'First',
			values: [false, 0, 'alpha'],
			parts: [
				{ kind: 'handle', stats: { power: 1 } },
				{ kind: 'blade', stats: { power: 5 }, flags: [false, true] }
			],
			unrelated: true,
			mixed: ['direct', { kind: 'indirect' }],
			matrix: [[1, 2], [3]]
		},
		{
			id: 'second',
			name: 'Second',
			values: ['beta'],
			parts: [{ kind: 'handle', stats: { power: 2 } }]
		},
		{ id: 'third', name: 'Third', values: [], parts: [] }
	];
	const arrays = createSearchCatalog({
		records: source,
		getView: record => record
	});
	const match = (query: string) => {
		const parsed = parseSearchQuery(query, arrays);
		assert.deepEqual(parsed.diagnostics, [], query);
		return filterSearchCatalog(arrays, parsed).map(record => record.id);
	};
	assert.deepEqual(match('values:false values:0 values:alpha'), ['first']);
	assert.deepEqual(match('parts[].kind:blade'), ['first']);
	assert.deepEqual(match('parts[].stats.power:>=5'), ['first']);
	assert.deepEqual(match('parts[].flags:true'), ['first']);
	assert.deepEqual(match('!parts[].kind:blade'), ['second', 'third']);
	assert.deepEqual(match('HAS:parts[].kind'), ['first', 'second']);
	assert.deepEqual(match('!HAS:parts[].kind'), ['third']);
	assert.deepEqual(match('mixed:direct mixed[].kind:indirect'), ['first']);
	assert.deepEqual(match('matrix[]:3'), ['first']);
	assert.deepEqual(
		getSearchSuggestions('', 0, arrays)
			.filter(suggestion => suggestion.kind === 'attribute')
			.map(suggestion => suggestion.label),
		[
			'id:',
			'name:',
			'values:',
			'parts[].kind:',
			'parts[].stats.power:',
			'parts[].flags:',
			'unrelated:',
			'matrix[]:'
		]
	);
	assert.deepEqual(
		getSearchSuggestions('HAS:parts', 9, arrays).map(value => value.label),
		['parts[].kind', 'parts[].stats.power', 'parts[].flags']
	);
	assert.deepEqual(
		getSearchSuggestions('parts[].kind:', 13, arrays).map(value => value.label),
		['blade', 'handle']
	);
	for (const path of ['values.0', 'parts.0.kind', 'parts.kind']) {
		assert.equal(arrays.fields.has(path), false, path);
	}
});

void test('presence includes false, zero, null, empty strings and containers', () => {
	assert.deepEqual(search('has:active has:damage'), [
		'stone_sword',
		'sandstone'
	]);
	assert.deepEqual(search('has:nothing has:empty has:list has:object'), [
		'stone_sword'
	]);
	assert.deepEqual(search('has:tags.can_place'), ['stone_sword', 'sandstone']);
	assert.deepEqual(search('!has:tags'), ['literal']);
	assert.deepEqual(search('!has:tags.melee_damage'), ['sandstone', 'literal']);
});

void test('unknown, invalid and unfinished terms are ignored with diagnostics', () => {
	for (const invalid of [
		'material:',
		'has:',
		'!',
		'unknown:yes',
		'damage:no',
		'object:x',
		'name:"unfinished'
	]) {
		const parsed = parseSearchQuery(`stone ${invalid}`, catalog);
		assert.equal(parsed.diagnostics.length, 1, invalid);
		assert.deepEqual(parsed.diagnostics[0], {
			start: 6,
			end: 6 + invalid.length,
			message: `${
				invalid === 'material:' || invalid === 'has:'
					? 'Incomplete term'
					: invalid === 'unknown:yes' || invalid === 'constructor:x'
						? `Unknown field: ${invalid.split(':')[0]}`
						: invalid === 'damage:no' || invalid === 'object:x'
							? `Invalid value for ${invalid.split(':')[0]}`
							: 'Incomplete or invalid term'
			} (${invalid})`
		});
		assert.deepEqual(
			filterSearchCatalog(catalog, parsed).map(record => record.id),
			['stone_sword', 'sandstone']
		);
	}
	assert.deepEqual(
		search('material:'),
		records.map(record => record.id)
	);
	assert.equal(
		parseSearchQuery('constructor:x', catalog).diagnostics.length,
		1
	);
});

void test('quoted literals and escapes do not become operators', () => {
	const literal = records[2]!.name;
	assert.deepEqual(search(JSON.stringify(literal)), ['literal']);
	assert.deepEqual(search(`name:${JSON.stringify(literal)}`), ['literal']);
	assert.deepEqual(search(`!${JSON.stringify(literal)}`), [
		'stone_sword',
		'sandstone'
	]);
});

void test('autocomplete uses the active term and preserves other clauses', () => {
	const query = 'stone !has:tags.ca material:stone';
	const caret = query.indexOf(' material:');
	const suggestions = getSearchSuggestions(query, caret, catalog);
	const suggestion = suggestions.find(
		value => value.label === 'tags.can_place'
	);
	assert.ok(suggestion);
	assert.equal(suggestion.prefix, '!HAS:');
	assert.equal(
		applySearchSuggestion(query, caret, suggestion).query,
		'stone !HAS:tags.can_place material:stone'
	);
	const fields = getSearchSuggestions('tags.ca', 6, catalog);
	assert.equal(fields[0]?.text, 'tags.can_place:');
	assert.equal(
		getSearchSuggestions('material:ST', 11, catalog)[0]?.text,
		'material:stone'
	);
	assert.equal(
		getSearchSuggestions('material:ST', 11, catalog)[0]?.prefix,
		'material:'
	);
	const name = getSearchSuggestions('name:Sto', 8, catalog)[0]!;
	assert.equal(name.prefix, 'name:');
	assert.equal(
		applySearchSuggestion('name:Sto', 8, name).query,
		'name:"Stone Sword" '
	);
	assert.equal(
		getSearchSuggestions('has:', 4, catalog).some(
			value => value.label === 'object'
		),
		false
	);
	assert.equal(getSearchSuggestions('!mat', 4, catalog)[0]?.prefix, '!');
	assert.equal(getSearchSuggestions('!ha', 3, catalog)[0]?.prefix, '!');
});

void test('attribute descriptions appear in ordinary and presence suggestions', () => {
	const descriptions = {
		'damage': 'Damage dealt',
		'tags.melee_damage': 'Melee damage bonus',
		'parts[].kind': 'Type of part',
		'object': 'Object data',
		'unknown': 'Not a searchable attribute'
	};
	const described = createSearchCatalog({
		records,
		getView: record => record,
		descriptions: descriptions
	});
	for (const [path, description] of Object.entries(descriptions)) {
		if (path === 'unknown' || path === 'object') continue;
		const values = described.fields.get(path) ?? [];
		const expected = values.length > 1 && values.some(value => value !== null);
		for (const prefix of ['', '!']) {
			const query = `${prefix}${path}`;
			const suggestion = getSearchSuggestions(
				query,
				query.length,
				described
			).find(value => value.text === `${query}:`);
			assert.equal(suggestion?.description, expected ? description : undefined);
			assert.equal(suggestion?.kind, expected ? 'attribute' : undefined);
		}
	}
	for (const prefix of ['HAS:', '!HAS:']) {
		const suggestions = getSearchSuggestions(prefix, prefix.length, described);
		for (const [path, description] of Object.entries(descriptions)) {
			if (path === 'unknown') continue;
			const values = described.fields.get(path) ?? [];
			const expected =
				values.length > 1 &&
				described.entries.some(entry => !entry.fields.has(path));
			assert.equal(
				suggestions.find(value => value.label === path)?.description,
				expected ? description : undefined
			);
		}
	}
	const suggestions = getSearchSuggestions('', 0, described);
	assert.equal(
		suggestions.find(value => value.label === 'material:')?.description,
		undefined
	);
	assert.equal(
		suggestions.some(value => value.label === 'unknown:'),
		false
	);
	assert.deepEqual(
		getSearchSuggestions('damage:', 7, described),
		getSearchSuggestions('damage:', 7, catalog)
	);
	assert.equal(
		getSearchSuggestions('damage', 6, catalog)[0]?.description,
		undefined
	);
});

void test('autocomplete distinguishes keywords, attributes, and values', () => {
	const initial = getSearchSuggestions('', 0, catalog);
	assert.equal(initial.find(value => value.label === 'HAS:')?.kind, 'keyword');
	assert.equal(initial.find(value => value.label === '!')?.kind, 'keyword');
	assert.ok(
		initial
			.filter(value => value.kind === 'keyword')
			.every(value => value.description)
	);
	assert.equal(
		initial.find(value => value.label === 'material:')?.kind,
		'attribute'
	);
	assert.ok(initial.every(value => value.kind !== 'value'));
	assert.equal(getSearchSuggestions('name:Sto', 8, catalog)[0]?.kind, 'value');
	const rawValues = getSearchSuggestions('Sto', 3, catalog);
	assert.ok(rawValues.some(value => value.text === 'material:stone'));
	assert.ok(rawValues.some(value => value.text === 'name:"Stone Sword"'));
	assert.equal(
		applySearchSuggestion(
			'Sto',
			3,
			rawValues.find(value => value.text === 'name:"Stone Sword"')!
		).query,
		'name:"Stone Sword" '
	);
	assert.ok(
		getSearchSuggestions('!Sto', 4, catalog).some(
			value => value.text === '!material:stone'
		)
	);
	assert.equal(getSearchSuggestions('has:', 4, catalog)[0]?.kind, 'attribute');
	assert.equal(getSearchSuggestions('material:', 9, catalog)[0]?.kind, 'value');
	assert.equal(getSearchSuggestions('!has:', 5, catalog)[0]?.kind, 'attribute');
});

void test('negation and HAS keywords autocomplete before other suggestions', () => {
	assert.deepEqual(search('stone !sand'), ['stone_sword']);
	assert.deepEqual(search('!active:true'), ['stone_sword', 'literal']);
	assert.deepEqual(search('HAS:active HAS:damage'), [
		'stone_sword',
		'sandstone'
	]);
	assert.deepEqual(search('!HAS:tags'), ['literal']);
	assert.deepEqual(search('!has:tags'), ['literal']);
	assert.equal(parseSearchQuery('!', catalog).diagnostics.length, 1);
	assert.equal(
		parseSearchQuery('!material:', catalog).diagnostics[0]?.start,
		0
	);
	assert.equal(parseSearchQuery('NOT', catalog).terms[0]?.negated, false);
	assert.deepEqual(
		getSearchSuggestions('', 0, catalog)
			.slice(0, 2)
			.map(value => value.label),
		['!', 'HAS:']
	);
	const keyword = getSearchSuggestions('', 0, catalog)[0]!;
	assert.equal(keyword.label, '!');
	assert.equal(applySearchSuggestion('', 0, keyword).query, '!');
	const presence = getSearchSuggestions('!ha', 3, catalog)[0]!;
	assert.equal(presence.label, 'HAS:');
	assert.equal(presence.prefix, '!');
	assert.equal(applySearchSuggestion('!ha', 3, presence).query, '!HAS:');
	const attribute = getSearchSuggestions('!HAS:tags.ca', 12, catalog)[0]!;
	assert.equal(attribute.prefix, '!HAS:');
	assert.equal(
		applySearchSuggestion('!HAS:tags.ca', 12, attribute).query,
		'!HAS:tags.can_place '
	);
	assert.equal(getSearchSuggestions('!', 1, catalog)[0]?.label, 'HAS:');
	assert.ok(
		getSearchSuggestions('!', 1, catalog).every(value => value.label !== '!')
	);
});

void test('numeric comparison prefixes respect boundaries, types, and negation', () => {
	assert.deepEqual(search('damage:>0'), ['sandstone']);
	assert.deepEqual(search('damage:>=10'), ['sandstone']);
	assert.deepEqual(search('damage:<10'), ['stone_sword']);
	assert.deepEqual(search('damage:<=0'), ['stone_sword']);
	assert.deepEqual(search('damage:>10'), []);
	assert.deepEqual(search('damage:<0'), []);
	assert.deepEqual(search('damage:>=0 damage:<=10'), [
		'stone_sword',
		'sandstone'
	]);
	assert.deepEqual(search('!damage:>0'), ['stone_sword', 'literal']);
	assert.deepEqual(search('light:>=1'), ['stone_sword']);
	assert.deepEqual(search('light:<=0'), ['stone_sword']);
	for (const invalid of [
		'damage:>',
		'damage:<=',
		'damage:>no',
		'damage:>=Infinity',
		'material:>5',
		'active:<1'
	]) {
		assert.equal(
			parseSearchQuery(invalid, catalog).diagnostics.length,
			1,
			invalid
		);
	}
	const mixed = createSearchCatalog({
		records: [
			{ id: 'number', name: 'Number', value: 10 },
			{ id: 'string', name: 'String', value: '>5' }
		],
		getView: record => record
	});
	assert.deepEqual(
		filterSearchCatalog(mixed, parseSearchQuery('value:>5', mixed)).map(
			record => record.id
		),
		['number']
	);
	assert.deepEqual(
		filterSearchCatalog(mixed, parseSearchQuery('value:">5"', mixed)).map(
			record => record.id
		),
		['string']
	);
});

void test('numeric autocomplete offers operators first and preserves their prefixes', () => {
	const suggestions = getSearchSuggestions('damage:', 7, catalog);
	assert.deepEqual(
		new Set(suggestions.slice(0, 4).map(value => value.label)),
		new Set(['>', '<', '>=', '<='])
	);
	assert.ok(
		suggestions
			.slice(0, 4)
			.every(value => value.kind === 'keyword' && !value.complete)
	);
	assert.ok(suggestions.slice(0, 4).every(value => value.description));
	for (const operator of ['>', '<', '>=', '<=']) {
		for (const prefix of ['', '!']) {
			const query = `${prefix}damage:${operator}`;
			const values = getSearchSuggestions(query, query.length, catalog);
			assert.ok(values.length > 0, query);
			assert.ok(
				values.every(value => value.kind === 'value'),
				query
			);
			assert.ok(
				values.every(value => value.prefix === query),
				query
			);
		}
	}
	const operator = suggestions.find(value => value.label === '>=')!;
	assert.equal(
		applySearchSuggestion('damage:', 7, operator).query,
		'damage:>='
	);
	const value = getSearchSuggestions('stone !damage:>=1', 17, catalog)[0]!;
	assert.equal(value.prefix, '!damage:>=');
	assert.equal(value.label, '10');
	assert.equal(
		applySearchSuggestion('stone !damage:>=1', 17, value).query,
		'stone !damage:>=10 '
	);
	assert.ok(
		getSearchSuggestions('material:', 9, catalog).every(
			value => value.kind !== 'keyword'
		)
	);
});

void test('catalog discovers sparse fields across records and preserves order', () => {
	assert.ok(catalog.fields.has('tags.can_place'));
	assert.deepEqual(
		filterSearchCatalog(catalog, parseSearchQuery('', catalog)),
		records
	);
	assert.equal(
		getSearchSuggestions('', 0, catalog).length,
		[...catalog.fields.values()].filter(
			values => values.length > 1 && values.some(value => value !== null)
		).length + 2
	);
});

void test('autocomplete returns all matching fields and values without a cap', () => {
	const values = Array.from({ length: 40 }, (_, index) => index);
	const large = createSearchCatalog({
		records: [
			{ id: 'many', name: 'Many', values },
			{ id: 'other', name: 'Other' }
		],
		getView: record => record
	});
	assert.deepEqual(
		getSearchSuggestions('', 0, large)
			.filter(value => value.kind === 'attribute')
			.map(value => value.label),
		[...large.fields.keys()].map(field => `${field}:`)
	);
	assert.deepEqual(
		getSearchSuggestions('HAS:', 4, large).map(value => value.label),
		[...large.fields.keys()].filter(field => field !== 'id' && field !== 'name')
	);
	assert.deepEqual(
		new Set(
			getSearchSuggestions('values:', 7, large)
				.filter(value => value.kind === 'value')
				.map(value => value.label)
		),
		new Set(values.map(String))
	);
});

void test('attribute suggestions retain source order including nested and sparse fields', () => {
	const ordered = createSearchCatalog({
		records: [
			{
				id: 'first',
				name: 'First',
				zeta: 1,
				alpha: 2,
				nested: { zebra: 3, apple: 4 }
			},
			{ id: 'second', name: 'Second', sparse: true }
		],
		getView: record => record
	});
	const fields = [
		'id',
		'name',
		'zeta',
		'alpha',
		'nested',
		'nested.zebra',
		'nested.apple',
		'sparse'
	];
	assert.deepEqual([...ordered.fields.keys()], fields);
	for (const [query, fragment] of [
		['', ''],
		['a', 'a'],
		['!a', 'a'],
		['HAS:', ''],
		['HAS:a', 'a'],
		['!HAS:a', 'a']
	] as const) {
		assert.deepEqual(
			getSearchSuggestions(query, query.length, ordered)
				.filter(value => value.kind === 'attribute')
				.map(value => value.label),
			fields
				.filter(field => {
					const values = ordered.fields.get(field)!;
					const missing = ordered.entries.some(
						entry => !entry.fields.has(field)
					);
					return (
						(values.length > 1 ||
							(values.length === 1 && values[0] === true && missing)) &&
						(query.includes(':')
							? missing
							: values.some(value => value !== null)) &&
						field.includes(fragment)
					);
				})
				.map(field => (query.includes(':') ? field : `${field}:`)),
			query
		);
	}
});

void test('nested suggestions stay grouped when later entries add children', () => {
	const grouped = createSearchCatalog({
		records: [
			{
				id: 'first',
				name: 'First',
				tags: { zeta: true, nested: { first: 1 }, alpha: false },
				unrelated: 1,
				tagsExtra: { value: 'separate' }
			},
			{
				id: 'second',
				name: 'Second',
				tags: { nested: { later: 2 }, later: true },
				sparse: true
			},
			{ id: 'third', name: 'Third' }
		],
		getView: record => record
	});
	const fields = [
		'id',
		'name',
		'tags',
		'tags.zeta',
		'tags.nested',
		'tags.nested.first',
		'tags.nested.later',
		'tags.alpha',
		'tags.later',
		'unrelated',
		'tagsExtra',
		'tagsExtra.value',
		'sparse'
	];
	for (const query of ['', '!', 'tags', 'HAS:', '!HAS:', 'HAS:tags']) {
		const presence = query.includes(':');
		const fragment = query.includes('tags') ? 'tags' : '';
		assert.deepEqual(
			getSearchSuggestions(query, query.length, grouped)
				.filter(suggestion => suggestion.kind === 'attribute')
				.map(suggestion => suggestion.label),
			fields
				.filter(field => {
					const values = grouped.fields.get(field)!;
					const missing = grouped.entries.some(
						entry => !entry.fields.has(field)
					);
					return (
						(values.length > 1 ||
							(values.length === 1 && values[0] === true && missing)) &&
						(presence ? missing : values.some(value => value !== null))
					);
				})
				.filter(field => field.includes(fragment))
				.map(field => (presence ? field : `${field}:`)),
			query
		);
	}
});

void test('attribute suggestions require searchable primitive values', () => {
	const searchable = createSearchCatalog({
		records: [
			{
				id: 'first',
				name: 'First',
				active: false,
				count: 0,
				empty: '',
				nothing: null,
				missing: undefined,
				canBeFelled: true,
				list: [],
				object: {},
				nested: { value: 'searchable' },
				values: [false, 0, ''],
				nulls: [null],
				parts: [{ kind: 'blade' }],
				sparse: null
			},
			{ id: 'second', name: 'Second', sparse: 'present' }
		],
		getView: record => record
	});
	const fields = ['id', 'name', 'canBeFelled', 'values', 'sparse'];
	for (const query of ['', '!']) {
		assert.deepEqual(
			getSearchSuggestions(query, query.length, searchable)
				.filter(suggestion => suggestion.kind === 'attribute')
				.map(suggestion => suggestion.label),
			fields.map(field => `${field}:`),
			query
		);
	}
	for (const query of ['HAS:', '!HAS:']) {
		assert.deepEqual(
			getSearchSuggestions(query, query.length, searchable).map(
				suggestion => suggestion.label
			),
			['canBeFelled', 'values'],
			query
		);
	}
	assert.equal(
		parseSearchQuery('HAS:object', searchable).diagnostics.length,
		0
	);
});

void test('HAS suggests only fields missing from some source entries', () => {
	const records = [
		{
			id: 'first',
			name: 'First',
			active: false,
			count: 0,
			text: '',
			nothing: null,
			list: [],
			object: {},
			nested: { optional: true },
			optionalNull: null,
			optionalList: [],
			optionalObject: {}
		},
		{
			id: 'second',
			name: 'Second',
			active: true,
			count: 1,
			text: 'value',
			nothing: null,
			list: [],
			object: {},
			nested: {}
		}
	];
	const presence = createSearchCatalog({ records, getView: record => record });
	for (const query of ['HAS:', '!HAS:', 'has:']) {
		assert.deepEqual(
			getSearchSuggestions(query, query.length, presence).map(
				suggestion => suggestion.label
			),
			['nested.optional'],
			query
		);
	}
	assert.equal(parseSearchQuery('HAS:active', presence).diagnostics.length, 0);
	for (const source of [[], records.slice(0, 1)]) {
		const uniform = createSearchCatalog({
			records: source,
			getView: record => record
		});
		assert.deepEqual(getSearchSuggestions('HAS:', 4, uniform), []);
		assert.deepEqual(getSearchSuggestions('!HAS:', 5, uniform), []);
	}
});

void test('all dataset catalogs preserve baseline membership and order', () => {
	assert.deepEqual(
		filterSearchCatalog(blockSearch, parseSearchQuery('', blockSearch)),
		blocks
	);
	assert.deepEqual(
		filterSearchCatalog(itemSearch, parseSearchQuery('', itemSearch)),
		items
	);
	assert.deepEqual(
		filterSearchCatalog(effectSearch, parseSearchQuery('', effectSearch)),
		effects
	);
	assert.deepEqual(
		filterSearchCatalog(creatureSearch, parseSearchQuery('', creatureSearch)),
		entities.filter(entity => entity.category === 'creature')
	);
	assert.deepEqual(
		filterSearchCatalog(npcSearch, parseSearchQuery('', npcSearch)),
		npcDataExt
	);
});

void test('real blocks and items support exact, negated, sparse and nested fields', () => {
	const material = blocks.find(block => block.material)?.material;
	assert.ok(material);
	assert.deepEqual(
		filterSearchCatalog(
			blockSearch,
			parseSearchQuery(`material:${material}`, blockSearch)
		),
		blocks.filter(block => block.material === material)
	);
	assert.deepEqual(
		filterSearchCatalog(
			blockSearch,
			parseSearchQuery('!hidden:true has:harvestLoot', blockSearch)
		),
		blocks.filter(
			block => block.hidden !== true && Object.hasOwn(block, 'harvestLoot')
		)
	);
	assert.deepEqual(
		filterSearchCatalog(
			itemSearch,
			parseSearchQuery('tags.can_place:true', itemSearch)
		),
		items.filter(item => item.tags?.can_place === true)
	);
	assert.deepEqual(
		filterSearchCatalog(
			itemSearch,
			parseSearchQuery('!has:tags.melee_damage', itemSearch)
		),
		items.filter(
			item => !item.tags || !Object.hasOwn(item.tags, 'melee_damage')
		)
	);
	const category = items.find(item => item.category?.length)?.category?.[0];
	assert.ok(category);
	assert.deepEqual(
		filterSearchCatalog(
			itemSearch,
			parseSearchQuery(`category:${category}`, itemSearch)
		),
		items.filter(item => item.category?.includes(category))
	);
});

void test('item descriptions are indexed without missing translation keys', () => {
	const getDescription = (id: string) =>
		translations[`item.${id}.desc` as keyof typeof translations];
	const described = items.filter(item => !!getDescription(item.id));
	assert.ok(described.length > 0);
	assert.ok(described.length < items.length);
	assert.deepEqual(
		filterSearchCatalog(
			itemSearch,
			parseSearchQuery('has:description', itemSearch)
		),
		described
	);
	assert.deepEqual(
		filterSearchCatalog(
			itemSearch,
			parseSearchQuery('!has:description', itemSearch)
		),
		items.filter(item => !getDescription(item.id))
	);
	const description = getDescription(described[0]!.id);
	assert.ok(description);
	assert.deepEqual(
		filterSearchCatalog(
			itemSearch,
			parseSearchQuery(`description:${JSON.stringify(description)}`, itemSearch)
		),
		items.filter(
			item =>
				getDescription(item.id)?.toLowerCase() === description.toLowerCase()
		)
	);
	assert.ok(
		getSearchSuggestions('desc', 4, itemSearch).some(
			suggestion => suggestion.text === 'description:'
		)
	);
	assert.ok(getSearchSuggestions('description:', 12, itemSearch).length > 0);
	assert.ok(
		itemSearch.fields
			.get('description')!
			.every(value => typeof value === 'string' && !value.startsWith('item.'))
	);
});

void test('real effects, creature names and NPC raw/joined attributes are searchable', () => {
	assert.deepEqual(
		filterSearchCatalog(
			effectSearch,
			parseSearchQuery('effectType:Buff', effectSearch)
		),
		effects.filter(effect => effect.effectType === 'Buff')
	);
	const creature = creatureSearch.entries[0]!;
	assert.ok(
		filterSearchCatalog(
			creatureSearch,
			parseSearchQuery(
				`name:${JSON.stringify(creature.fields.get('name')![0])}`,
				creatureSearch
			)
		).includes(creature.record)
	);
	const npc = npcDataExt[0]!;
	assert.deepEqual(
		filterSearchCatalog(
			npcSearch,
			parseSearchQuery(`entity:${npc.entity.id}`, npcSearch)
		),
		npcDataExt.filter(record => record.entity.id === npc.entity.id)
	);
	assert.deepEqual(
		filterSearchCatalog(
			npcSearch,
			parseSearchQuery('has:entityDetails.health', npcSearch)
		),
		npcDataExt.filter(record => Object.hasOwn(record.entity, 'health'))
	);
	assert.ok(
		filterSearchCatalog(
			npcSearch,
			parseSearchQuery(
				`name:${JSON.stringify(npcSearch.entries[0]!.fields.get('name')![0])}`,
				npcSearch
			)
		).includes(npc)
	);
});
