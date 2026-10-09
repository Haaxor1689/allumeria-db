import { type Metadata } from 'next';

import Breadcrumbs from '#components/Breadcrumbs.tsx';
import QuerySearch from '#components/QuerySearch.tsx';
import items from '#data/items.json';
import { getTranslation } from '#utils/helpers.ts';
import { createSearchCatalog } from '#utils/searchQuery.ts';

import ItemGrid from './ItemGrid';

const itemSearch = createSearchCatalog({
	records: items,
	getView: item => {
		const description = getTranslation(`item.${item.id}.desc`, '');
		return {
			...item,
			name: getTranslation(`item.${item.id}`),
			...(description ? { description } : {})
		};
	},
	descriptions: {
		'id': 'String identifier',
		'name': 'English item name',
		'description': 'English item description',
		'class': 'Class name of the custom item subclass',
		'block': 'Block placed or represented by the item',
		'category': 'Item categories used for organizing and filtering items',
		'sellValue': 'Vendor sale value in copper tokens',
		'rarity': 'Item rarity',
		'stackSize': 'Maximum stack size',
		'baseDamage': 'Base melee damage',
		'rangedDamage': 'Base ranged damage',
		'ammoType': 'Ammunition type used',
		'entityType': 'Entity type summoned or represented',
		'effect': 'Primary applied effect',
		'secondaryEffect': 'Secondary applied effect',
		'ticks': 'Effect duration in ticks',
		'secondaryTicks': 'Secondary effect duration in ticks',
		'passiveEffect': 'Passive effect while equipped',
		'tags.can_consume': 'Whether the item can be consumed',
		'tags.can_place': 'Whether the item can place a block',
		'tags.can_block': 'Whether the item can block attacks',
		'tags.axe_power': 'Axe mining power',
		'tags.pickaxe_power': 'Pickaxe mining power',
		'tags.hammer': 'Hammer shaping power',
		'tags.material_level': 'Material level the tool fulfills',
		'tags.cant_mine': 'Whether the left click interacts with blocks',
		'tags.melee_damage': 'Melee damage of the item',
		'tags.ranged_damage': 'Ranged damage of the item',
		'tags.swing_speed': 'Swing speed of the item',
		'tags.defence': 'Defence of the item',
		'tags.knockback': 'Knockback of the item',
		'tags.trinket': 'Whether the item is a trinket',
		'tags.ammo': 'Ammunition type of the item',
		'isBuff':
			'Whether the consumable should be used when pressing the Quick Buff hotkey',
		'isHeal':
			'Whether the consumable should be used when pressing the Quick Heal hotkey',
		'sprite':
			'Item atlas resource key (relative path to /res/textures/atlas/items) if sprite is different from the string identifier',
		'model': 'Held model resource key (relative path to /res/models)',
		'texture': 'Held texture resource key (relative path to /res/textures)',
		'sweeping':
			'Whether the item attacks all entities in a ~70 degree arc in front of you',
		'hidden': 'Whether the item is hidden in creative menu',
		'currencyAmount': 'Amount of copper tokens the item represents',
		'paintMode': 'Painting palette associated with the item'
	}
});

export const metadata: Metadata = {
	title: 'Items',
	description:
		'Browse Allumeria items, weapons, tools, materials, recipes, effects, and loot sources.',
	alternates: { canonical: '/items' }
};

const Page = () => (
	<div className="mx-auto flex w-full max-w-294 flex-col gap-1">
		<Breadcrumbs
			items={[{ label: 'Home', href: '/' }, { label: 'Items' }]}
			className="self-start"
		/>
		<div className="my-3 grid grid-cols-1 items-start gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-6">
			<h1 className="text-3xl font-bold pixel-shadow md:text-4xl">Items</h1>
			<QuerySearch catalog={itemSearch} label="Search items" />
		</div>

		<ItemGrid catalog={itemSearch} />
	</div>
);

export default Page;
