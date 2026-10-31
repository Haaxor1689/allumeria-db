import { notFound } from 'next/navigation';

import entities from '#data/entities.json';
import { entryOgSize, renderEntryOg } from '#server/entryOg.tsx';
import { getCreatureName } from '#utils/helpers.ts';

export const alt = 'AllumeriaDB creature details';
export const size = entryOgSize;
export const contentType = 'image/png';

export const generateStaticParams = () =>
	entities
		.filter(entity => entity.category === 'creature')
		.map(entity => ({ id: entity.id }));

export default async function Image({ params }: PageProps<'/creatures/[id]'>) {
	const { id } = await params;
	const entity = entities.find(
		entity => entity.id === id && entity.category === 'creature'
	);
	if (!entity) notFound();
	return await renderEntryOg({
		name: getCreatureName(entity),
		category: 'Creature',
		previewKind: 'entity',
		images: [`/previews/entities/${entity.id}.webp`]
	});
}
