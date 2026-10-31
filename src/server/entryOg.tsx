import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import nextCache from 'next/cache';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';

type EntryOg = {
	name: string;
	category: string;
	images: string[];
	previewKind: 'item' | 'block' | 'entity' | 'effect';
	effectType?: string;
};

export const entryOgSize = { width: 1200, height: 630 };

const readAsset = async (path: string) =>
	await readFile(join(process.cwd(), 'public', path));

const renderNineSlice = async (
	path: string,
	width: number,
	height: number,
	[top, right, bottom, left]: [number, number, number, number],
	pixelScale = 4
) => {
	const source = await readAsset(path);
	const metadata = await sharp(source).metadata();
	if (!metadata.width || !metadata.height)
		throw new Error(`Nine-slice texture has no dimensions: ${path}`);
	const sourceWidths = [left, metadata.width - left - right, right];
	const sourceHeights = [top, metadata.height - top - bottom, bottom];
	const widths = [
		Math.round(left * pixelScale),
		width - Math.round(left * pixelScale) - Math.round(right * pixelScale),
		Math.round(right * pixelScale)
	];
	const heights = [
		Math.round(top * pixelScale),
		height - Math.round(top * pixelScale) - Math.round(bottom * pixelScale),
		Math.round(bottom * pixelScale)
	];
	const slices = await Promise.all(
		sourceHeights.flatMap((sliceHeight, row) =>
			sourceWidths.map(async (sliceWidth, column) => ({
				input: await sharp(source)
					.extract({
						left: sourceWidths.slice(0, column).reduce((a, b) => a + b, 0),
						top: sourceHeights.slice(0, row).reduce((a, b) => a + b, 0),
						width: sliceWidth,
						height: sliceHeight
					})
					.resize(widths[column], heights[row], {
						fit: 'fill',
						kernel: 'nearest'
					})
					.png()
					.toBuffer(),
				left: widths.slice(0, column).reduce((a, b) => a + b, 0),
				top: heights.slice(0, row).reduce((a, b) => a + b, 0)
			}))
		)
	);
	const image = await sharp({
		create: {
			width,
			height,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 }
		}
	})
		.composite(slices)
		.png()
		.toBuffer();
	return `data:image/png;base64,${image.toString('base64')}`;
};

const previewLayouts = {
	item: { width: 72, height: 72, imageWidth: 64, imageHeight: 64 },
	block: { width: 104, height: 104, imageWidth: 96, imageHeight: 96 },
	entity: { width: 216, height: 324, imageWidth: 208, imageHeight: 312 },
	effect: { width: 72, height: 72, imageWidth: 64, imageHeight: 64 }
};

const loadPreview = async (entry: EntryOg) => {
	const layout = previewLayouts[entry.previewKind];
	const scale = Math.min(360 / layout.width, 446 / layout.height);
	const slotWidth = Math.round(layout.width * scale);
	const slotHeight = Math.round(layout.height * scale);
	const fallback =
		entry.previewKind === 'item' || entry.previewKind === 'effect'
			? '/assets/items/missing.webp'
			: '/previews/blocks/missing.webp';
	for (const path of [...entry.images, fallback]) {
		let source: Buffer;
		try {
			source = await readAsset(path);
		} catch (err) {
			if (!(err instanceof Error && 'code' in err && err.code === 'ENOENT'))
				throw err;
			console.warn(`OG preview not found: ${path}`);
			continue;
		}
		const metadata = await sharp(source).metadata();
		if (!metadata.width || !metadata.height)
			throw new Error(`OG preview has no dimensions: ${path}`);
		// Satori cannot decode WebP; resize with nearest-neighbor to retain pixel art.
		const image = await sharp(source)
			.resize(
				Math.round(layout.imageWidth * scale),
				Math.round(layout.imageHeight * scale),
				{
					fit: 'inside',
					kernel: 'nearest'
				}
			)
			.png()
			.toBuffer({ resolveWithObject: true });
		return {
			src: `data:image/png;base64,${image.data.toString('base64')}`,
			width: image.info.width,
			height: image.info.height,
			slotWidth,
			slotHeight,
			pixelScale: 4 * scale
		};
	}
	throw new Error('No preview or fallback asset available for OG image');
};

const loadEffectFrame = async (effectType: string, size: number) => {
	const type =
		effectType === 'Debuff'
			? 'debuff'
			: effectType === 'Buff'
				? 'buff'
				: 'neutral';
	const source = await readAsset(`/assets/icons/effect_${type}.webp`);
	let image = sharp(source).resize(size, size, { kernel: 'nearest' });
	if (effectType === 'Hidden') image = image.grayscale();
	if (effectType === 'Passive') image = image.modulate({ saturation: 0.5 });
	const { data, info } = await image
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	for (let i = 3; i < data.length; i += 4) data[i] = Math.round(data[i]! * 0.5);
	const frame = await sharp(data, { raw: info }).png().toBuffer();
	return `data:image/png;base64,${frame.toString('base64')}`;
};

const loadBranding = async () => {
	const [logo, background] = await Promise.all([
		readAsset('/db_logo.png'),
		readAsset('/night_sky.png')
	]);
	const resizedLogo = await sharp(logo)
		.resize(408, 114, { kernel: 'nearest' })
		.png()
		.toBuffer();
	return {
		logo: `data:image/png;base64,${resizedLogo.toString('base64')}`,
		background: `data:image/png;base64,${background.toString('base64')}`
	};
};

const loadFonts = async () =>
	await Promise.all(
		([400, 700] as const).map(async weight => {
			const response = await fetch(
				`https://raw.githubusercontent.com/google/fonts/6c1dbe27dcf7d817d4b62cec033ba77fa8e2a5ec/ofl/atkinsonhyperlegible/AtkinsonHyperlegible-${weight === 400 ? 'Regular' : 'Bold'}.ttf`,
				{ cache: 'force-cache' }
			);
			if (!response.ok)
				throw new Error(
					`Failed to fetch OG font (${weight}): HTTP ${response.status}`
				);
			return {
				name: 'Atkinson Hyperlegible',
				data: await response.arrayBuffer(),
				weight,
				style: 'normal' as const
			};
		})
	);

const renderEntryOgData = async (entry: EntryOg) => {
	'use cache';

	nextCache.cacheLife({ revalidate: Infinity, expire: Infinity });

	const [preview, brand, loadedFonts, dialog] = await Promise.all([
		loadPreview(entry),
		loadBranding(),
		loadFonts(),
		renderNineSlice('/assets/ui/dialog.webp', 1120, 550, [4, 4, 4, 4])
	]);
	const slot =
		entry.previewKind === 'effect'
			? await loadEffectFrame(entry.effectType ?? 'Neutral', preview.slotWidth)
			: await renderNineSlice(
					'/assets/ui/slot.webp',
					preview.slotWidth,
					preview.slotHeight,
					[3, 2, 2, 2],
					preview.pixelScale
				);

	const response = new ImageResponse(
		<div
			style={{
				display: 'flex',
				width: '100%',
				height: '100%',
				backgroundColor: '#111827',
				backgroundImage: `url(${brand.background})`,
				backgroundSize: 'cover',
				color: '#ffffff',
				fontFamily: 'Atkinson Hyperlegible',
				padding: 40
			}}
		>
			<div
				style={{
					display: 'flex',
					width: 1120,
					height: 550,
					position: 'relative',
					padding: 52,
					gap: 32
				}}
			>
				<img
					src={dialog}
					width={1120}
					height={550}
					alt=""
					style={{ position: 'absolute', left: 0, top: 0 }}
				/>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						width: 624,
						justifyContent: 'space-between'
					}}
				>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
						<div
							style={{
								display: 'flex',
								color: '#6ee7e7',
								fontSize: 42,
								textTransform: 'uppercase',
								letterSpacing: 3
							}}
						>
							{entry.category}
						</div>
						<div
							style={{
								display: 'flex',
								fontSize: 82,
								fontWeight: 700,
								lineHeight: 1.08,
								overflowWrap: 'break-word'
							}}
						>
							{entry.name}
						</div>
					</div>
					<img src={brand.logo} width={408} height={114} alt="AllumeriaDB" />
				</div>
				<div
					style={{
						display: 'flex',
						position: 'absolute',
						top: 52,
						right: 52,
						width: preview.slotWidth,
						height: preview.slotHeight
					}}
				>
					<div
						style={{
							display: 'flex',
							width: preview.slotWidth,
							height: preview.slotHeight,
							position: 'relative',
							alignItems: 'center',
							justifyContent: 'center'
						}}
					>
						<img
							src={slot}
							width={preview.slotWidth}
							height={preview.slotHeight}
							alt=""
							style={{ position: 'absolute', left: 0, top: 0 }}
						/>
						<img
							src={preview.src}
							width={preview.width}
							height={preview.height}
							alt={entry.name}
						/>
					</div>
				</div>
			</div>
		</div>,
		{ ...entryOgSize, fonts: loadedFonts }
	);
	return await response.arrayBuffer();
};

export const renderEntryOg = async (entry: EntryOg) =>
	new Response(await renderEntryOgData(entry), {
		headers: { 'Content-Type': 'image/png' }
	});
