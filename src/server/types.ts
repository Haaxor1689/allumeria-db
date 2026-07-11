import type blocks from '#data/blocks.json';
import type items from '#data/items.json';

export type Item = (typeof items)[number];
export type Block = (typeof blocks)[number];
