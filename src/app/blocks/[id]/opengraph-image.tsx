import { notFound } from 'next/navigation';

import blocks from '#data/blocks.json';
import { entryOgSize, renderEntryOg } from '#server/entryOg.tsx';
import { getBlockName } from '#utils/helpers.ts';

export const alt = 'AllumeriaDB block details';
export const size = entryOgSize;
export const contentType = 'image/png';

export const generateStaticParams = () =>
	Array.from(new Set(blocks.map(block => block.id))).map(id => ({ id }));

export default async function Image({ params }: PageProps<'/blocks/[id]'>) {
	const { id } = await params;
	const block = blocks.find(block => block.id === id);
	if (!block) notFound();
	return await renderEntryOg({
		name: getBlockName(block),
		category: 'Block',
		previewKind: 'block',
		images: [`/previews/blocks/${block.id}.webp`]
	});
}
