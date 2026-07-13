import itemTags from '#data/item_tags.json';
import translations from '#data/translations.json';

export const getTranslation = (key: string, fallback?: string) =>
	translations[key as keyof typeof translations] ?? fallback ?? key;

export const getItemIcon = (item?: { id: string; sprite?: string }) =>
	`/assets/items/${item?.sprite ?? item?.id ?? 'missing'}.webp`;

export const getBlockName = (block: { id: string; item?: string }) =>
	getTranslation(`item.${block.item ?? block.id}`);

export const itemTagsExt = itemTags.map(tag => ({
	...tag,
	label: getTranslation(`item_tag.${tag.label}`),
	icon:
		tag.iconX && tag.iconY
			? `/assets/item_tags/${tag.iconX}x${tag.iconY}.webp`
			: tag.id === 'hammer'
				? '/custom/hammer.webp'
				: undefined
}));

export const getTool = (tool: string) => {
	const tag = itemTagsExt.find(t => t.id === tool);
	if (!tag)
		return {
			label: 'Hand',
			icon: '/custom/hand.webp'
		};
	return {
		label: tag.label,
		icon: tag.icon
	};
};
