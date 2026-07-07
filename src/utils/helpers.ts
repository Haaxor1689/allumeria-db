import translations from '#data/translations.json';

export const getTranslation = (key: string) =>
	translations[key as keyof typeof translations] ?? key;

export const getItemIcon = (item: { id: string; sprite?: string }) =>
	`/assets/items/${item.sprite ?? item.id}.webp`;
