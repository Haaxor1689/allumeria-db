import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mock, test } from 'node:test';

import nextCache from 'next/cache.js';
import sharp from 'sharp';

import BlockImage, {
	generateStaticParams as blockParams
} from '#app/blocks/[id]/opengraph-image.tsx';
import CreatureImage, {
	generateStaticParams as creatureParams
} from '#app/creatures/[id]/opengraph-image.tsx';
import EffectImage, {
	generateStaticParams as effectParams
} from '#app/effects/[id]/opengraph-image.tsx';
import ItemImage, {
	generateStaticParams as itemParams
} from '#app/items/[id]/opengraph-image.tsx';
import NpcImage, {
	generateStaticParams as npcParams
} from '#app/npcs/[id]/opengraph-image.tsx';
import blocks from '#data/blocks.json';
import effects from '#data/effects.json';
import entities from '#data/entities.json';
import items from '#data/items.json';
import { npcDataExt } from '#utils/helpers.ts';

import { renderEntryOg } from './entryOg.tsx';

// Node runs the renderer without Next's compiled "use cache" context.
mock.method(nextCache, 'cacheLife', () => {});

void test('OG routes enumerate every unique detail ID for build-time rendering', () => {
	for (const [generateParams, ids] of [
		[itemParams, items.map(item => item.id)],
		[blockParams, blocks.map(block => block.id)],
		[
			creatureParams,
			entities
				.filter(entity => entity.category === 'creature')
				.map(entity => entity.id)
		],
		[effectParams, effects.map(effect => effect.id)],
		[npcParams, npcDataExt.map(npc => npc.entity.id)]
	] as const) {
		const params = generateParams();
		assert.equal(params.length, new Set(ids).size);
		assert.deepEqual(new Set(params.map(param => param.id)), new Set(ids));
	}
});

void test('font fetching is statically cacheable and errors are surfaced', async context => {
	const fetchMock = context.mock.method(
		globalThis,
		'fetch',
		async (_url: Parameters<typeof fetch>[0], _options?: RequestInit) =>
			new Response('Unavailable', { status: 503 })
	);
	await assert.rejects(
		renderEntryOg({
			name: 'Agave',
			category: 'Item',
			previewKind: 'item',
			images: ['/assets/items/agave.webp']
		}),
		/Failed to fetch OG font .*HTTP 503/
	);
	assert.equal(fetchMock.mock.callCount(), 2);
	for (const call of fetchMock.mock.calls) {
		assert.deepEqual(call.arguments[1], { cache: 'force-cache' });
		assert.ok(typeof call.arguments[0] === 'string');
		assert.match(
			call.arguments[0],
			/google\/fonts\/[a-f0-9]{40}\/ofl\/atkinsonhyperlegible/
		);
	}
});
void test('item, block, and entity slots use equal 52px top and right dialog insets', async () => {
	for (const [image, id, slotWidth, scale] of [
		[ItemImage, 'agave', 360, 20],
		[BlockImage, 'thermal_vent', 360, (4 * 360) / 104],
		[CreatureImage, 'DamnBird', 297, (4 * 446) / 324],
		[NpcImage, 'MerchantNPC', 297, (4 * 446) / 324]
	] as const) {
		const response = await image({
			params: Promise.resolve({ id }),
			searchParams: Promise.resolve({})
		});
		const output = Buffer.from(await response.arrayBuffer());
		const width = Math.round(2 * scale);
		const height = Math.round(3 * scale);
		const expected = await sharp(
			join(process.cwd(), 'public', 'assets', 'ui', 'slot.webp')
		)
			.extract({ left: 0, top: 0, width: 2, height: 3 })
			.resize(width, height, { fit: 'fill', kernel: 'nearest' })
			.ensureAlpha()
			.raw()
			.toBuffer();
		const actual = await sharp(output)
			.extract({ left: 1160 - 52 - slotWidth, top: 40 + 52, width, height })
			.ensureAlpha()
			.raw()
			.toBuffer();
		const background = await sharp(output)
			.extract({ left: 740, top: 92, width: 1, height: 1 })
			.ensureAlpha()
			.raw()
			.toBuffer();
		for (let i = 0; i < expected.length; i += 4) {
			const alpha = expected[i + 3]! / 255;
			for (let channel = 0; channel < 3; channel++) {
				const blended = Math.round(
					expected[i + channel]! * alpha + background[channel]! * (1 - alpha)
				);
				assert.ok(
					Math.abs(actual[i + channel]! - blended) <= 1,
					`${id} slot corner at equal insets`
				);
			}
		}
	}
});

void test('dialog edges stretch without cropping or widening their pixel bands', async () => {
	const response = await ItemImage({
		params: Promise.resolve({ id: 'agave' }),
		searchParams: Promise.resolve({})
	});
	const output = Buffer.from(await response.arrayBuffer());
	for (const [left, top, width, height, x, y, targetWidth, targetHeight] of [
		[4, 0, 8, 4, 56, 40, 1088, 16],
		[0, 4, 4, 8, 40, 56, 16, 518],
		[12, 4, 4, 8, 1144, 56, 16, 518],
		[4, 12, 8, 4, 56, 574, 1088, 16]
	] as const) {
		const expected = await sharp(
			join(process.cwd(), 'public', 'assets', 'ui', 'dialog.webp')
		)
			.extract({ left, top, width, height })
			.resize(targetWidth, targetHeight, { fit: 'fill', kernel: 'nearest' })
			.ensureAlpha()
			.raw()
			.toBuffer();
		const actual = await sharp(output)
			.extract({ left: x, top: y, width: targetWidth, height: targetHeight })
			.ensureAlpha()
			.raw()
			.toBuffer();
		assert.deepEqual(actual, expected, `dialog edge at ${x},${y}`);
	}
});

void test('dialog corner maps each source pixel to an exact 4 x 4 square', async () => {
	const response = await ItemImage({
		params: Promise.resolve({ id: 'agave' }),
		searchParams: Promise.resolve({})
	});
	const source = await sharp(
		join(process.cwd(), 'public', 'assets', 'ui', 'dialog.webp')
	)
		.extract({ left: 0, top: 0, width: 4, height: 4 })
		.ensureAlpha()
		.raw()
		.toBuffer();
	const actual = await sharp(Buffer.from(await response.arrayBuffer()))
		.extract({ left: 40, top: 40, width: 16, height: 16 })
		.ensureAlpha()
		.raw()
		.toBuffer();
	for (let y = 0; y < 16; y++) {
		for (let x = 0; x < 16; x++) {
			const sourceOffset = (Math.floor(y / 4) * 4 + Math.floor(x / 4)) * 4;
			if (source[sourceOffset + 3] !== 255) continue;
			const offset = (y * 16 + x) * 4;
			assert.deepEqual(
				actual.subarray(offset, offset + 4),
				source.subarray(sourceOffset, sourceOffset + 4),
				`dialog corner pixel ${x},${y}`
			);
		}
	}
});

void test('item OG uses the inventory sprite at the same 64/72 image-to-slot ratio as ItemSlot', async () => {
	const response = await ItemImage({
		params: Promise.resolve({ id: 'agave' }),
		searchParams: Promise.resolve({})
	});
	const output = Buffer.from(await response.arrayBuffer());
	const expected = await sharp(
		join(process.cwd(), 'public', 'assets', 'items', 'agave.webp')
	)
		.resize(320, 320, { kernel: 'nearest' })
		.ensureAlpha()
		.raw()
		.toBuffer();
	const actual = await sharp(output)
		.extract({ left: 768, top: 112, width: 320, height: 320 })
		.ensureAlpha()
		.raw()
		.toBuffer();
	let comparedPixels = 0;
	for (let i = 0; i < expected.length; i += 4) {
		if (expected[i + 3] !== 255) continue;
		assert.deepEqual(actual.subarray(i, i + 4), expected.subarray(i, i + 4));
		comparedPixels++;
	}
	assert.ok(comparedPixels > 0);
});

void test('OG panels match list slot border scale and top-right placement', async () => {
	const response = await ItemImage({
		params: Promise.resolve({ id: 'agave' }),
		searchParams: Promise.resolve({})
	});
	const output = Buffer.from(await response.arrayBuffer());
	const dialogFill = await sharp(output)
		.extract({ left: 740, top: 92, width: 1, height: 1 })
		.ensureAlpha()
		.raw()
		.toBuffer();
	for (const y of [91, 452]) {
		const outsideSlot = await sharp(output)
			.extract({ left: 928, top: y, width: 1, height: 1 })
			.ensureAlpha()
			.raw()
			.toBuffer();
		assert.deepEqual(
			outsideSlot,
			dialogFill,
			'square preview has a 360px square slot'
		);
	}
	for (const [texture, x, y, width, height, scale] of [
		['dialog', 40, 40, 16, 16, 4],
		['slot', 748, 92, 40, 20, 20]
	] as const) {
		const expected = await sharp(
			join(process.cwd(), 'public', 'assets', 'ui', `${texture}.webp`)
		)
			.extract({
				left: 0,
				top: 0,
				width: width / scale,
				height: height / scale
			})
			.resize(width, height, { kernel: 'nearest' })
			.ensureAlpha()
			.raw()
			.toBuffer();
		const actual = await sharp(output)
			.extract({ left: x, top: y, width, height })
			.ensureAlpha()
			.raw()
			.toBuffer();
		let visiblePixels = 0;
		for (let i = 0; i < expected.length; i += 4) {
			const alpha = expected[i + 3]! / 255;
			if (!alpha) continue;
			for (let channel = 0; channel < 3; channel++) {
				const blended = Math.round(
					expected[i + channel]! * alpha + dialogFill[channel]! * (1 - alpha)
				);
				assert.ok(
					Math.abs(actual[i + channel]! - blended) <= 1,
					`${texture} pixel ${i / 4} channel ${channel} matches texture`
				);
			}
			visiblePixels++;
		}
		assert.ok(visiblePixels > 0, `${texture} has visible corner pixels`);
	}
});

void test('each entry category renders a 1200 x 630 PNG social card', async () => {
	const entries = [
		[ItemImage, 'agave'],
		[BlockImage, 'thermal_vent'],
		[CreatureImage, 'DamnBird'],
		[EffectImage, 'poison'],
		[NpcImage, 'MerchantNPC']
	] as const;
	for (const [image, id] of entries) {
		const response = await image({
			params: Promise.resolve({ id }),
			searchParams: Promise.resolve({})
		});
		assert.equal(response.status, 200);
		assert.equal(response.headers.get('content-type'), 'image/png');
		const buffer = Buffer.from(await response.arrayBuffer());
		const metadata = await sharp(buffer).metadata();
		assert.equal(metadata.width, 1200);
		assert.equal(metadata.height, 630);
		assert.equal(metadata.format, 'png');
		assert.ok(buffer.length < 8 * 1024 * 1024);
	}
});

void test('OG routes reject invalid IDs and entities from the wrong category', async () => {
	for (const image of [
		ItemImage,
		BlockImage,
		CreatureImage,
		EffectImage,
		NpcImage
	]) {
		for (const id of ['not-an-entry', '../../db_logo']) {
			await assert.rejects(
				image({
					params: Promise.resolve({ id }),
					searchParams: Promise.resolve({})
				}),
				{ message: 'NEXT_HTTP_ERROR_FALLBACK;404' }
			);
		}
	}
	for (const [image, id] of [
		[NpcImage, 'merchant'],
		[CreatureImage, 'MerchantNPC']
	] as const) {
		await assert.rejects(
			image({
				params: Promise.resolve({ id }),
				searchParams: Promise.resolve({})
			}),
			{ message: 'NEXT_HTTP_ERROR_FALLBACK;404' }
		);
	}
});

void test('missing preview assets log a warning and render the fallback', async context => {
	const warning = context.mock.method(console, 'warn', () => {});
	const response = await renderEntryOg({
		name: 'Missing preview',
		category: 'Item',
		previewKind: 'item',
		images: ['/previews/blocks/not-an-entry.webp']
	});
	assert.ok((await response.arrayBuffer()).byteLength);
	assert.equal(warning.mock.callCount(), 1);
	assert.match(
		String(warning.mock.calls[0]?.arguments[0]),
		/OG preview not found/
	);
});
