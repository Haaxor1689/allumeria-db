import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';

import {
	fromDataTagBuffer,
	toDataTagBuffer
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
	output = toDataTagBuffer(record);
} else {
	outputPath = join(
		dirname(inputPath),
		`${basename(inputPath, extension)}.json`
	);
	const parsed = fromDataTagBuffer(await readFile(inputPath));
	output = `${JSON.stringify(parsed, (_key, value: unknown) => (value instanceof Uint8Array ? { $type: 'Binary', $value: Array.from(value) } : value), '\t')}\n`;
}

await writeFile(outputPath, output);
console.log(`Wrote ${outputPath}`);
