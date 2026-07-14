import type blocks from '#data/blocks.json';
import type creatures from '#data/creatures.json';
import type effects from '#data/effects.json';
import type items from '#data/items.json';
import type recipes from '#data/recipes.json';

export type Item = (typeof items)[number];
export type Block = (typeof blocks)[number];
export type Creature = (typeof creatures)[number];
export type Effect = (typeof effects)[number];
export type Recipe = (typeof recipes)[number];
