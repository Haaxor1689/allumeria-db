import { notFound } from 'next/navigation';

import { entryOgSize, renderEntryOg } from '#server/entryOg.tsx';
import { getMod } from '#server/mods.ts';
import { Mods } from '#utils/mods.ts';

export const alt = 'AllumeriaDB mod title, version and description';
export const size = entryOgSize;
export const contentType = 'image/png';

export const generateStaticParams = () =>
	Mods.map(({ slug }) => ({ id: slug }));

export default async function Image({ params }: PageProps<'/mods/[id]'>) {
	const { id } = await params;
	const mod = await getMod(id);
	if (!mod) notFound();
	return await renderEntryOg({
		name: mod.metadata.display_name,
		category: 'Mod',
		previewKind: 'mod',
		avatarUrl: mod.avatarUrl,
		version: mod.metadata.version,
		description: mod.metadata.description
	});
}
