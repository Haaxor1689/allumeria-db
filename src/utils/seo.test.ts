import assert from 'node:assert/strict';
import { test } from 'node:test';

import blocks from '#data/blocks.json';
import effects from '#data/effects.json';
import entities from '#data/entities.json';
import items from '#data/items.json';

import { getTranslation, npcDataExt } from './helpers.ts';
import {
	getBlockDescription,
	getCreatureDescription,
	getEffectDescription,
	getItemDescription,
	getNpcDescription
} from './seo.ts';

void test('item descriptions include translated text and factual statistics', () => {
	const item = items.find(item => getTranslation(`item.${item.id}.desc`, ''));
	assert.ok(item);
	assert.ok(
		getItemDescription(item).includes(getTranslation(`item.${item.id}.desc`))
	);
	const cheapItem = items.find(item => item.sellValue === 1);
	assert.ok(cheapItem);
	assert.match(getItemDescription(cheapItem), /Sell value: 1 copper token\./);
});

void test('block descriptions use readable tool names and RGB light levels', () => {
	const block = blocks.find(block => block.id === 'thermal_vent');
	assert.ok(block);
	const description = getBlockDescription(block);
	assert.match(description, /Material: stone/);
	assert.match(description, /Preferred tool: Pickaxe\./);
	assert.match(description, /Light emission \(RGB\): 6, 1, 0\./);
	assert.doesNotMatch(description, /undefined|Pickaxe power/);
});

void test('effect descriptions use the effect.desc translation keys', () => {
	const effect = effects.find(effect => effect.id === 'poison');
	assert.ok(effect);
	assert.match(getEffectDescription(effect), /Deals damage over time\./);
	assert.match(
		getEffectDescription(effect),
		/Granted by \d+ items and \d+ blocks/
	);
});

void test('all detail descriptions identify Allumeria without missing values', () => {
	const descriptions = [
		...items.map(getItemDescription),
		...blocks.map(getBlockDescription),
		...entities
			.filter(entity => entity.category === 'creature')
			.map(getCreatureDescription),
		...effects.map(getEffectDescription),
		...npcDataExt.map(getNpcDescription)
	];
	for (const description of descriptions) {
		assert.match(description, /Allumeria/);
		assert.doesNotMatch(description, /undefined|\[object Object\]|\n/);
	}
	assert.ok(descriptions.length > 900);
});

void test('NPC descriptions name their actual shop goods', () => {
	const npc = npcDataExt.find(npc => npc.id === 'merchant');
	assert.ok(npc);
	assert.match(
		getNpcDescription(npc),
		/Sells Arrow, Dynamite, Weak Health Potion\./
	);
});
