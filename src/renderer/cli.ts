const [, , onlyBlockId, widthStr, heightStr] = process.argv;

const width = widthStr ? Number(widthStr) : 256;
const height = heightStr ? Number(heightStr) : 256;

if (Number.isNaN(width) || Number.isNaN(height) || width <= 0 || height <= 0) {
	console.error('Width and height must be positive numbers.');
	process.exit(1);
}

const { prerenderBlockPreviews } = await import('./prerender.ts');

await prerenderBlockPreviews({ onlyBlockId, width, height });

export {};
