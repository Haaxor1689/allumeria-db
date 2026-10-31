import { notFound } from 'next/navigation';

import effects from '#data/effects.json';
import { entryOgSize, renderEntryOg } from '#server/entryOg.tsx';
import { getTranslation } from '#utils/helpers.ts';
import { toDisplayName } from '#utils/index.ts';

export const alt = 'AllumeriaDB effect details';
export const size = entryOgSize;
export const contentType = 'image/png';

export const generateStaticParams = () =>
	Array.from(new Set(effects.map(effect => effect.id))).map(id => ({ id }));

export default async function Image({ params }: PageProps<'/effects/[id]'>) {
	const { id } = await params;
	const effect = effects.find(effect => effect.id === id);
	if (!effect) notFound();
	return await renderEntryOg({
		name: getTranslation(`effect.${effect.id}`, toDisplayName(effect.id)),
		category: 'effect',
		previewKind: 'effect',
		effectType: effect.effectType,
		images: [`/assets/effects/${effect.textureX}x${effect.textureY}.webp`]
	});
}
