import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { type MetadataRoute } from 'next';

import blocks from '#data/blocks.json';
import effects from '#data/effects.json';
import entities from '#data/entities.json';
import items from '#data/items.json';
import npcData from '#data/npc_data.json';
import summary from '#data/summary.json';
import { env } from '#env.js';
import { getAllMods } from '#server/mods.ts';
import { getItemIcon } from '#utils/helpers.ts';
import { Mods } from '#utils/mods.ts';

const staticRoutes = [
	'/',
	'/about',
	'/items',
	'/blocks',
	'/creatures',
	'/effects',
	'/npcs',
	'/data-tag-reader',
	'/skin-converter',
	'/mods'
];

const toAbsoluteUrl = (path: string) => new URL(path, env.BASE_URL).toString();

const imageUrls = (...paths: string[]) =>
	paths
		.filter(path =>
			existsSync(join(process.cwd(), 'public', ...path.split('/')))
		)
		.map(toAbsoluteUrl);

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
	const lastModified = new Date(summary.generatedAtUtc);

	const staticEntries = staticRoutes.map(route => ({
		url: toAbsoluteUrl(route),
		lastModified,
		...(route === '/' ? { images: imageUrls('/db_logo.png') } : {})
	}));

	const itemEntries = items.map(item => ({
		url: toAbsoluteUrl(`/items/${item.id}`),
		lastModified,
		images: imageUrls(getItemIcon(item))
	}));

	const blockEntries = blocks.map(block => ({
		url: toAbsoluteUrl(`/blocks/${block.id}`),
		lastModified,
		images: imageUrls(`/previews/blocks/${block.id}.webp`)
	}));

	const creatureEntries = entities
		.filter(entity => entity.category === 'creature')
		.map(entity => ({
			url: toAbsoluteUrl(`/creatures/${entity.id}`),
			lastModified,
			images: imageUrls(`/previews/entities/${entity.id}.webp`)
		}));

	const npcEntries = npcData.map(npc => ({
		url: toAbsoluteUrl(`/npcs/${npc.entity}`),
		lastModified,
		images: imageUrls(`/previews/entities/${npc.entity}.webp`)
	}));

	const effectEntries = effects.map(effect => ({
		url: toAbsoluteUrl(`/effects/${effect.id}`),
		lastModified,
		images: imageUrls(
			`/assets/effects/${effect.textureX}x${effect.textureY}.webp`
		)
	}));

	const loadedMods = await getAllMods();
	const modEntries = Mods.map(mod => {
		const releasedAt = loadedMods.find(m => m.slug === mod.slug)?.releasedAt;
		return {
			url: toAbsoluteUrl(`/mods/${mod.slug}`),
			...(releasedAt && { lastModified: new Date(releasedAt) })
		};
	});

	return [
		...staticEntries,
		...itemEntries,
		...blockEntries,
		...creatureEntries,
		...npcEntries,
		...effectEntries,
		...modEntries
	];
};

export default sitemap;
