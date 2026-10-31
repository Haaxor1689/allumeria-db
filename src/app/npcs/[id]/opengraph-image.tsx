import { notFound } from 'next/navigation';

import { entryOgSize, renderEntryOg } from '#server/entryOg.tsx';
import { getCreatureName, npcDataExt } from '#utils/helpers.ts';

export const alt = 'AllumeriaDB NPC details';
export const size = entryOgSize;
export const contentType = 'image/png';

export const generateStaticParams = () =>
	npcDataExt.map(npc => ({ id: npc.entity.id }));

export default async function Image({ params }: PageProps<'/npcs/[id]'>) {
	const { id } = await params;
	const npc = npcDataExt.find(npc => npc.entity.id === id);
	if (!npc) notFound();
	return await renderEntryOg({
		name: getCreatureName(npc.entity),
		category: 'NPC',
		previewKind: 'entity',
		images: [`/previews/entities/${npc.entity.id}.webp`]
	});
}
