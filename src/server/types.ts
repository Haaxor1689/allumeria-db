import type items from '#data/items.json';

export type Item = (typeof items)[number];
