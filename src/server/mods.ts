import 'server-only';
import { cacheLife } from 'next/cache';
import { z } from 'zod';

import { Mods, type ModRepository, type ReleaseAsset } from '#utils/mods.ts';
import { getReadmeImages } from '#utils/readme.ts';

const MetadataSchema = z.object({
	id: z.string(),
	display_name: z.string(),
	description: z.string().optional(),
	version: z.string(),
	contributors: z
		.array(z.object({ name: z.string(), role: z.string().optional() }))
		.default([]),
	dependencies: z
		.array(
			z.object({
				id: z.string(),
				version: z.string().optional(),
				type: z.string().optional()
			})
		)
		.default([]),
	environment: z.string().optional()
});

const RepoSchema = z.object({
	default_branch: z.string(),
	owner: z.object({ avatar_url: z.url() }),
	updated_at: z.string().optional()
});

const ReleaseSchema = z.object({
	tag_name: z.string(),
	published_at: z.string().optional(),
	// Source archives are exposed separately as tarball_url/zipball_url,
	// so assets only ever contain the files uploaded to the release
	assets: z
		.array(
			z.object({
				name: z.string(),
				size: z.number(),
				browser_download_url: z.url()
			})
		)
		.default([])
});

const fetchCodeberg = async (path: string) => {
	const res = await fetch(`https://codeberg.org/api/v1/repos/${path}`);
	if (!res.ok)
		throw new Error(`Codeberg request failed (${res.status}): ${path}`);
	return res;
};

const getLatestRelease = async ({
	owner,
	repo
}: Pick<ModRepository, 'owner' | 'repo'>) => {
	'use cache';
	cacheLife('hours');

	const release = await fetchCodeberg(`${owner}/${repo}/releases/latest`)
		.then(async r => ReleaseSchema.parse(await r.json()))
		.catch(() => null);
	if (!release) return null;

	return {
		tag: release.tag_name,
		publishedAt: release.published_at ?? null,
		assets: release.assets.map((a): ReleaseAsset => ({
			name: a.name,
			size: a.size,
			url: a.browser_download_url
		}))
	};
};

const getRepoData = async ({ owner, repo, url }: ModRepository) => {
	'use cache';
	cacheLife('hours');

	const base = `${owner}/${repo}`;
	const [repoInfo, metadata, readme, release] = await Promise.all([
		fetchCodeberg(base).then(async r => RepoSchema.parse(await r.json())),
		fetchCodeberg(`${base}/raw/Metadata.json`).then(async r =>
			MetadataSchema.parse(await r.json())
		),
		fetchCodeberg(`${base}/raw/README.md`)
			.then(async r => await r.text())
			.catch(() => null),
		getLatestRelease({ owner, repo })
	]);

	return {
		branch: repoInfo.default_branch,
		avatarUrl: repoInfo.owner.avatar_url,
		metadata,
		readme,
		images: getReadmeImages(
			readme,
			`${url}/raw/branch/${repoInfo.default_branch}/`
		),
		releasedAt: release?.publishedAt ?? repoInfo.updated_at ?? null,
		assets: release?.assets ?? []
	};
};

export type ModData = ModRepository & Awaited<ReturnType<typeof getRepoData>>;

export const getMod = async (slug: string): Promise<ModData | null> => {
	const mod = Mods.find(m => m.slug === slug);
	if (!mod) return null;
	return { ...mod, ...(await getRepoData(mod)) };
};

export const getAllMods = async () => {
	const results = await Promise.allSettled(
		Mods.map(async mod => ({ ...mod, ...(await getRepoData(mod)) }))
	);
	return results
		.flatMap(r => {
			if (r.status === 'fulfilled') return [r.value];
			console.error({
				source: 'Failed to load mod',
				error: r.reason as unknown
			});
			return [];
		})
		.toSorted((a, b) => toTime(b.releasedAt) - toTime(a.releasedAt));
};

// Mods without any release date are sorted last
const toTime = (date: string | null) => (date ? new Date(date).getTime() : 0);

export const getModDescription = ({ metadata }: ModData) =>
	`${metadata.display_name} is an Allumeria mod for the Ignitron mod loader. ${metadata.description ?? ''}`.trim();
