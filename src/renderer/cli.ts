import { prerenderBlockPreviews, prerenderModelPreviews } from './prerender.ts';

const [, , arg1, arg2, arg3, arg4] = process.argv;

const hasMode = (value?: string): value is 'all' | 'blocks' | 'entities' =>
	value === 'all' || value === 'blocks' || value === 'entities';

const isNumeric = (value?: string) =>
	typeof value === 'string' &&
	value.trim().length > 0 &&
	!Number.isNaN(Number(value));

const mode = hasMode(arg1) ? arg1 : arg1 ? 'blocks' : 'all';

const onlyBlockId =
	mode === 'blocks' && hasMode(arg1)
		? isNumeric(arg2)
			? undefined
			: arg2
		: mode === 'blocks'
			? arg1
			: undefined;

const widthArg =
	mode === 'blocks' && hasMode(arg1)
		? onlyBlockId
			? arg3
			: arg2
		: mode === 'blocks'
			? arg2
			: hasMode(arg1)
				? arg2
				: arg3;

const heightArg =
	mode === 'blocks' && hasMode(arg1)
		? onlyBlockId
			? arg4
			: arg3
		: mode === 'blocks'
			? arg3
			: hasMode(arg1)
				? arg3
				: arg4;

const width = widthArg ? Number(widthArg) : undefined;
const height = heightArg ? Number(heightArg) : undefined;

if (
	(width !== undefined && (Number.isNaN(width) || width <= 0)) ||
	(height !== undefined && (Number.isNaN(height) || height <= 0))
) {
	console.error('Width and height must be positive numbers.');
	process.exit(1);
}

if (mode === 'all' || mode === 'blocks')
	await prerenderBlockPreviews({ onlyBlockId, width });

if (mode === 'all' || mode === 'entities')
	await prerenderModelPreviews({ width });

export {};
