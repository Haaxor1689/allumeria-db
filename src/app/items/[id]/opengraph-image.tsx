import { notFound } from 'next/navigation';

import items from '#data/items.json';
import { entryOgSize, renderEntryOg } from '#server/entryOg.tsx';
import { getItemIcon, getTranslation } from '#utils/helpers.ts';

export const alt = 'AllumeriaDB item details';
export const size = entryOgSize;
export const contentType = 'image/png';

export const generateStaticParams = () =>
	Array.from(new Set(items.map(item => item.id))).map(id => ({ id }));

export default async function Image({ params }: PageProps<'/items/[id]'>) {
	const { id } = await params;
	const item = items.find(item => item.id === id);
	if (!item) notFound();
	return await renderEntryOg({
		name: getTranslation(`item.${item.id}`),
		category: 'Item',
		previewKind: 'item',
		images: [getItemIcon(item)]
	});
}
