import { type MetadataRoute } from 'next';

import blocks from '#data/blocks.json';
import effects from '#data/effects.json';
import entities from '#data/entities.json';
import items from '#data/items.json';
import summary from '#data/summary.json';
import { env } from '#env.js';

const staticRoutes = ['/', '/items', '/blocks', '/creatures', '/effects'];

const toAbsoluteUrl = (path: string) => new URL(path, env.BASE_URL).toString();

const sitemap = (): MetadataRoute.Sitemap => {
	const lastModified = new Date(summary.generatedAtUtc);

	const staticEntries = staticRoutes.map(route => ({
		url: toAbsoluteUrl(route),
		lastModified,
		changeFrequency: 'daily' as const,
		priority: route === '/' ? 1 : 0.8
	}));

	const itemEntries = items
		.map(item => item.id)
		.map(id => ({
			url: toAbsoluteUrl(`/items/${id}`),
			lastModified,
			changeFrequency: 'weekly' as const,
			priority: 0.7
		}));

	const blockEntries = blocks
		.map(block => block.id)
		.map(id => ({
			url: toAbsoluteUrl(`/blocks/${id}`),
			lastModified,
			changeFrequency: 'weekly' as const,
			priority: 0.7
		}));

	const creatureEntries = entities
		.filter(entity => entity.category === 'creature')
		.map(entity => entity.id)
		.map(id => ({
			url: toAbsoluteUrl(`/creatures/${id}`),
			lastModified,
			changeFrequency: 'weekly' as const,
			priority: 0.7
		}));

	const effectEntries = effects
		.map(effect => effect.id)
		.map(id => ({
			url: toAbsoluteUrl(`/effects/${id}`),
			lastModified,
			changeFrequency: 'weekly' as const,
			priority: 0.7
		}));

	return [
		...staticEntries,
		...itemEntries,
		...blockEntries,
		...creatureEntries,
		...effectEntries
	];
};

export default sitemap;
