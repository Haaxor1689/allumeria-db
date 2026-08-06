import itemTags from '#data/item_tags.json';
import items from '#data/items.json';
import translations from '#data/translations.json';

export const getTranslation = (key: string, fallback?: string) =>
	translations[key as keyof typeof translations] ?? fallback ?? key;

export const getItemIcon = (item?: { id: string; sprite?: string }) =>
	`/assets/items/${item?.sprite ?? item?.id ?? 'missing'}.webp`;

export const getBlockName = (block: { id: string; item?: string }) =>
	getTranslation(`item.${block.item ?? block.id}`);

export const itemTagsExt = itemTags.map(tag => ({
	...tag,
	label: getTranslation(`item_tag.${tag.id}`),
	render(value: unknown) {
		if (this.class === 'ItemTagSwing')
			return `${this.label}: ${((value as number) / 60).toFixed(2)}s`;

		if (this.class === 'ItemTagAmmo') return getTranslation(value as string);

		if (typeof value === 'boolean') return this.label;

		return `${this.label}: ${value as number}`;
	},
	icon:
		tag.iconX !== undefined && tag.iconY !== undefined
			? `/assets/item_tags/${tag.iconX}x${tag.iconY}.webp`
			: tag.id === 'hammer'
				? '/custom/hammer.webp'
				: undefined
}));

export type LootEntry = {
	entries?: LootEntry[];
	oneOf?: boolean;
	perPlayer?: boolean;
	item?: string;
	amount?: number;
	min?: number;
	max?: number;
	chance?: number;
	needs?: string;
};

export const getTool = (tool: string) => {
	const tag = itemTagsExt.find(t => t.id.startsWith(tool));
	if (!tag) return { label: 'Hand', icon: '/custom/hand.webp' };
	return { label: tag.label, icon: tag.icon };
};

export const getCreatureIcon = (creature: string) =>
	getItemIcon(items.find(i => i.entityType === creature));
