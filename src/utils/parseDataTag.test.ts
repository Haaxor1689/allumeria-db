import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { gzipSync } from 'fflate';

import {
	DataTagNumber,
	fromDataTagBuffer,
	toDataTagBuffer
} from './parseDataTag.ts';

const fixture = Uint8Array.from([
	20, 4, 115, 97, 118, 101, 3, 0, 0, 0, 2, 0, 255, 255, 9, 1, 112, 0, 0, 128,
	63, 0, 0, 0, 64, 0, 0, 64, 64, 8, 1, 98, 2, 0, 0, 0, 0, 255
]);

const fixtureJson = {
	save: {
		'': new DataTagNumber('Short', -1),
		'p': { $type: 'Vector', x: 1, y: 2, z: 3 },
		'b': Uint8Array.from([0, 255])
	}
};

const jsonReplacer = (_key: string, value: unknown) =>
	value instanceof Uint8Array
		? { $type: 'Binary', $value: Array.from(value) }
		: value;

const roundTrip = (tag: unknown): void => {
	const binary = toDataTagBuffer(tag);
	const exported = fromDataTagBuffer(binary);
	assert.deepEqual(exported, tag);
	assert.deepEqual(
		toDataTagBuffer(JSON.parse(JSON.stringify(exported, jsonReplacer))),
		binary
	);
};

void test('independent binary fixture preserves root, unnamed tag, vector and bytes', () => {
	assert.deepEqual(fromDataTagBuffer(fixture), fixtureJson);
	assert.deepEqual(
		toDataTagBuffer(JSON.parse(JSON.stringify(fixtureJson, jsonReplacer))),
		fixture
	);
	assert.deepEqual(fromDataTagBuffer(gzipSync(fixture)), fixtureJson);
});

void test('numeric classes retain types and ordinary values stay flat', () => {
	for (const [$type, values] of [
		['Byte', [0, 255]],
		['Short', [-32768, 32767]],
		[
			'Long',
			['-9223372036854775808', '9223372036854775807', '9007199254740993']
		],
		['Float', [42, 1.25]],
		['Double', [42, 1.25, 1.1]]
	] as const) {
		for (const $value of values) {
			const parsed = fromDataTagBuffer(
				toDataTagBuffer({ number: { $type, $value } })
			).number;
			assert.ok(parsed instanceof DataTagNumber);
			assert.equal(parsed.type, $type);
			assert.equal(parsed.value, $type === 'Long' ? BigInt($value) : $value);
			assert.deepEqual(parsed.toJSON(), { $type, $value });
			roundTrip({ number: parsed });
		}
	}
	roundTrip({
		world: {
			count: 42,
			minimum: -2147483648,
			maximum: 2147483647,
			fraction: new DataTagNumber('Double', 1.1),
			name: 'NaN',
			enabled: true,
			disabled: false,
			empty: {},
			list: [1, 'two', false, { number: new DataTagNumber('Float', 1.25) }],
			vectorLike: { x: 1, y: 2, z: 3 },
			vector: { $type: 'Vector', x: 1.25, y: -2, z: 0 },
			bytes: new Uint8Array()
		}
	});
});

void test('numeric display suffixes and JSON tagging exclude Int', () => {
	const cases = [
		[new DataTagNumber('Byte', 255), '255b', 255],
		[new DataTagNumber('Short', 12), '12s', 12],
		[
			new DataTagNumber('Long', 9007199254740993n),
			'9007199254740993L',
			'9007199254740993'
		],
		[new DataTagNumber('Float', 1.25), '1.25f', 1.25],
		[new DataTagNumber('Double', 1.25), '1.25d', 1.25]
	] as const;
	for (const [value, display, payload] of cases) {
		assert.equal(String(value), display);
		assert.deepEqual(JSON.parse(JSON.stringify(value)), {
			$type: value.type,
			$value: payload
		});
	}
	const values = fromDataTagBuffer(
		toDataTagBuffer({ root: { integer: 42, fraction: 1.25 } })
	).root as Record<string, unknown>;
	assert.equal(values.integer, 42);
	assert.ok(values.fraction instanceof DataTagNumber);
	assert.equal(values.fraction.type, 'Double');
	assert.deepEqual(JSON.parse(JSON.stringify(values)), {
		integer: 42,
		fraction: { $type: 'Double', $value: 1.25 }
	});
	assert.throws(
		() => toDataTagBuffer({ root: new DataTagNumber('Byte', 256) }),
		/Expected integer/
	);
	assert.throws(
		() =>
			toDataTagBuffer({
				root: new DataTagNumber('Long', 9223372036854775808n)
			}),
		/signed 64-bit range/
	);
});

void test('Binary payloads stay Uint8Array views and write directly from typed bytes', () => {
	const parsed = fromDataTagBuffer(fixture) as typeof fixtureJson;
	assert.ok(parsed.save.b instanceof Uint8Array);
	assert.equal(parsed.save.b.buffer, fixture.buffer);
	const fromNodeBuffer = fromDataTagBuffer(
		Buffer.from(fixture)
	) as typeof fixtureJson;
	assert.equal(fromNodeBuffer.save.b.constructor, Uint8Array);
	assert.deepEqual(fromNodeBuffer, fixtureJson);
	assert.deepEqual(toDataTagBuffer(parsed), fixture);
	roundTrip({ bytes: Uint8Array.from([0, 1, 255]) });
	const padded = new Uint8Array(fixture.length + 4);
	padded.set(fixture, 2);
	assert.deepEqual(fromDataTagBuffer(padded.subarray(2, -2)), fixtureJson);
});

void test('bare byte buffers remain distinct from ordinary arrays including a Binary root', () => {
	const binary = Uint8Array.from([8, 0, 2, 0, 0, 0, 0, 255]);
	const bytes = Uint8Array.from([0, 255]);
	assert.deepEqual(fromDataTagBuffer(binary), { '': bytes });
	assert.deepEqual(toDataTagBuffer({ '': bytes }), binary);
	assert.equal(toDataTagBuffer({ bytes })[0], 8);
	assert.equal(toDataTagBuffer({ list: [0, 255] })[0], 20);
	roundTrip({ save: { bytes, list: [0, 255] } });
	assert.deepEqual(
		toDataTagBuffer(JSON.parse(JSON.stringify({ '': bytes }, jsonReplacer))),
		binary
	);
});

void test('scalar fixture verifies type IDs and empty root key independently', () => {
	const binary = Uint8Array.from([3, 0, 42, 0, 0, 0]);
	assert.deepEqual(fromDataTagBuffer(binary), { '': 42 });
	assert.deepEqual(toDataTagBuffer({ '': 42 }), binary);
	const double = Uint8Array.from([6, 0, 0, 0, 0, 0, 0, 0, 69, 64]);
	assert.deepEqual(fromDataTagBuffer(double), {
		'': new DataTagNumber('Double', 42)
	});
	assert.deepEqual(
		toDataTagBuffer({ '': { $type: 'Double', $value: 42 } }),
		double
	);
});

void test('literal $type tag keys throw instead of using a fallback', () => {
	const reservedTag = Uint8Array.from([
		3, 5, 36, 116, 121, 112, 101, 1, 0, 0, 0
	]);
	const nestedTag = Uint8Array.from([20, 0, 1, 0, 0, 0, ...reservedTag]);
	assert.throws(
		() => fromDataTagBuffer(reservedTag),
		/Data tag key \$type is reserved/
	);
	assert.throws(
		() => fromDataTagBuffer(nestedTag),
		/Data tag key \$type is reserved/
	);
	assert.throws(
		() => fromDataTagBuffer(gzipSync(nestedTag)),
		/Data tag key \$type is reserved/
	);
	assert.throws(
		() => toDataTagBuffer({ $type: 1 }),
		/Data tag key \$type is reserved/
	);
	roundTrip({ root: new DataTagNumber('Byte', 1) });
	roundTrip({ root: { $value: true } });
});

void test('rejects malformed roots and typed wrappers', () => {
	for (const value of [
		null,
		[],
		42,
		{},
		{ first: 1, second: 2 },
		{ root: null },
		{ root: { $type: 'Float', $value: 1, extra: true } },
		{ root: { $type: 'None', $value: 0 } },
		{ root: { $type: 'toString', $value: 0 } },
		{ root: { $type: 'Int', $value: 1 } },
		{ root: { $type: 'String', $value: 'text' } },
		{ root: { $type: 'Boolean', $value: true } },
		{ root: { $type: 'TagList', $value: [] } }
	]) {
		assert.throws(() => toDataTagBuffer(value), Error);
	}
});

void test('rejects invalid payloads instead of truncating or inferring', () => {
	const sparseArray: unknown[] = [];
	sparseArray.length = 1;
	const cases: [string, unknown[]][] = [
		['Byte', [-1, 256, 0.5, '1', NaN]],
		['Short', [-32769, 32768, 0.5]],
		[
			'Long',
			[
				1,
				'9223372036854775808',
				'-9223372036854775809',
				'1.5',
				'',
				'0x10',
				'01'
			]
		],
		[
			'Float',
			[3.5e38, Infinity, null, '1.5', 'NaN', 'Infinity', '-Infinity', '-0']
		],
		['Double', [Infinity, NaN, '1.5', 'NaN', 'Infinity', '-Infinity', '-0']],
		['Binary', [[-1], [256], [1.5], ['1'], {}, sparseArray, new Uint8Array()]]
	];
	for (const [$type, values] of cases) {
		for (const $value of values) {
			assert.throws(
				() => toDataTagBuffer({ invalid: { $type, $value } }),
				Error,
				$type
			);
		}
	}
	for (const value of [
		{ $type: 'Vector', x: 0, y: 0 },
		{ $type: 'Vector', x: 0, y: 0, z: 0, extra: true },
		{ $type: 'Vector', x: 3.5e38, y: 0, z: 0 },
		{ $type: 'Vector', x: '1', y: 0, z: 0 },
		-2147483649,
		2147483648,
		Infinity,
		sparseArray
	])
		assert.throws(() => toDataTagBuffer({ invalid: value }), Error);
});

void test('CLI exports gzip input and imports JSON with the original root and tag types', () => {
	const directory = mkdtempSync(join(tmpdir(), 'allumeria-data-tag-'));
	const script = fileURLToPath(
		new URL('../../scripts/parse.ts', import.meta.url)
	);
	try {
		const input = join(directory, 'fixture.bin');
		const json = join(directory, 'fixture.json');
		for (const buffer of [fixture, gzipSync(fixture)]) {
			writeFileSync(input, buffer);
			execFileSync(process.execPath, ['--import', 'tsx', script, input]);
			const exported: unknown = JSON.parse(readFileSync(json, 'utf8'));
			assert.deepEqual(
				exported,
				JSON.parse(JSON.stringify(fixtureJson, jsonReplacer))
			);
			execFileSync(process.execPath, [
				'--import',
				'tsx',
				script,
				json,
				'restored'
			]);
			assert.deepEqual(
				new Uint8Array(readFileSync(join(directory, 'fixture.restored'))),
				fixture
			);
		}
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
