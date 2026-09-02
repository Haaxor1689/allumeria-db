import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';

import {
	parseDataTagFileWithMetadata,
	stringifyDataTagRecord
} from '../src/utils/parseDataTag.ts';

const [, , inputFile, outputExtension] = process.argv;

if (!inputFile) {
	console.error(
		'Usage: bun run parse <data-tag-file> | bun run parse <json-file> <extension>'
	);
	process.exit(1);
}

const inputPath = resolve(process.cwd(), inputFile);
const extension = extname(inputPath);

const jsonReplacer = (_key: string, value: unknown) => {
	if (typeof value === 'bigint') return value.toString();
	if (value instanceof Uint8Array) return Array.from(value);
	return value;
};

const isJsonRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

let outputPath: string;
let output: string | Uint8Array;

if (extension === '.json') {
	if (!outputExtension) {
		console.error('Usage: bun run parse <json-file> <extension>');
		process.exit(1);
	}

	const normalizedExtension = outputExtension.startsWith('.')
		? outputExtension
		: `.${outputExtension}`;
	outputPath = join(
		dirname(inputPath),
		`${basename(inputPath, extension)}${normalizedExtension}`
	);
	const record: unknown = JSON.parse(await readFile(inputPath, 'utf8'));
	if (!isJsonRecord(record)) {
		throw new Error('Expected JSON input to contain an object at the root');
	}
	output = stringifyDataTagRecord(record);
} else {
	outputPath = join(
		dirname(inputPath),
		`${basename(inputPath, extension)}.json`
	);
	const parsed = parseDataTagFileWithMetadata(inputPath);
	output = `${JSON.stringify(parsed, jsonReplacer, '\t')}\n`;
}

await writeFile(outputPath, output);
console.log(`Wrote ${outputPath}`);
