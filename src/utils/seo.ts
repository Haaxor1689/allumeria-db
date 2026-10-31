import blockMaterials from '#data/block_materials.json';
import blocks from '#data/blocks.json';
import catalogues from '#data/catalogues.json';
import items from '#data/items.json';
import recipes from '#data/recipes.json';
import {
	type Block,
	type Effect,
	type Entity,
	type Item
} from '#server/types.ts';

import {
	getBlockName,
	getCreatureName,
	getTranslation,
	type npcDataExt
} from './helpers.ts';
import { toDisplayName } from './index.ts';

const describe = (...sentences: (string | undefined)[]) =>
	sentences.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

export const getItemDescription = (item: Item) => {
	const recipe = recipes.find(recipe => recipe.result === item.id);
	const effectId = item.effect ?? item.passiveEffect;
	return describe(
		`${getTranslation(`item.${item.id}`)} is an item in Allumeria.`,
		getTranslation(`item.${item.id}.desc`, ''),
		item.block
			? `Places ${getBlockName(blocks.find(block => block.id === item.block) ?? { id: item.block })}.`
			: undefined,
		item.baseDamage !== undefined
			? `Base damage: ${item.baseDamage}.`
			: item.rangedDamage !== undefined
				? `Ranged damage: ${item.rangedDamage}.`
				: undefined,
		recipe ? 'Can be crafted.' : undefined,
		effectId
			? `${item.class === 'ItemMeleeEffect' ? 'Applies' : 'Grants'} ${getTranslation(`effect.${effectId}`, toDisplayName(effectId))}.`
			: undefined,
		item.sellValue !== undefined
			? `Sell value: ${item.sellValue} copper token${item.sellValue === 1 ? '' : 's'}.`
			: undefined,
		item.stackSize !== undefined ? `Stack size: ${item.stackSize}.` : undefined
	);
};

export const getBlockDescription = (block: Block) => {
	const material = blockMaterials.find(
		material => material.id === block.material
	);
	return describe(
		`${getBlockName(block)} is a block in Allumeria. Material: ${block.material}.`,
		material?.preferredTool
			? `Preferred tool: ${toDisplayName(material.preferredTool.replace(/_power$/, ''))}.`
			: undefined,
		block.craftingStation
			? `Crafting station: ${toDisplayName(block.craftingStation)}.`
			: undefined,
		block.lightEmission !== undefined
			? `Light emission (RGB): ${block.lightEmission.join(', ')}.`
			: undefined,
		block.standOnEffect
			? `Standing on it grants ${getTranslation(`effect.${block.standOnEffect}`, toDisplayName(block.standOnEffect))}.`
			: undefined
	);
};

export const getCreatureDescription = (creature: Entity) =>
	describe(
		`${getCreatureName(creature)} is a${creature.flying ? ' flying' : ''} creature in Allumeria.`,
		creature.health !== undefined
			? `Health: ${creature.health} HP.`
			: undefined,
		creature.baseDamage !== undefined
			? `Base damage: ${creature.baseDamage}.`
			: undefined,
		creature.defence !== undefined
			? `Defence: ${creature.defence}.`
			: undefined,
		creature.canSpawnInSunlight ? 'Can spawn in sunlight.' : undefined
	);

export const getEffectDescription = (effect: Effect) => {
	const sourceCount = items.filter(
		item =>
			item.effect === effect.id ||
			item.secondaryEffect === effect.id ||
			item.passiveEffect === effect.id
	).length;
	const blockCount = blocks.filter(
		block => block.standOnEffect === effect.id
	).length;
	return describe(
		`${getTranslation(`effect.${effect.id}`, toDisplayName(effect.id))} is a ${effect.effectType.toLowerCase()} effect in Allumeria.`,
		getTranslation(`effect.desc.${effect.id}`, ''),
		effect.speedModifier !== undefined
			? `Speed modifier: ${effect.speedModifier}x.`
			: undefined,
		sourceCount || blockCount
			? `Granted by ${sourceCount} item${sourceCount === 1 ? '' : 's'} and ${blockCount} block${blockCount === 1 ? '' : 's'}.`
			: undefined
	);
};

export const getNpcDescription = (npc: (typeof npcDataExt)[number]) => {
	const catalogue = catalogues.find(
		catalogue => catalogue.id === npc.catalogue
	);
	const goods = catalogue?.entries
		.slice(0, 3)
		.map(entry => getTranslation(`item.${entry.item}`))
		.join(', ');
	return describe(
		`${getCreatureName(npc.entity)} is an NPC in Allumeria.`,
		goods ? `Sells ${goods}.` : undefined,
		npc.comfortRequirements
			? `Housing requirements: ${toDisplayName(npc.comfortRequirements)}.`
			: undefined,
		npc.entity.health !== undefined
			? `Health: ${npc.entity.health} HP.`
			: undefined
	);
};
