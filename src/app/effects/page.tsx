import { type Metadata } from 'next';

import Breadcrumbs from '#components/Breadcrumbs.tsx';
import QuerySearch from '#components/QuerySearch.tsx';
import effects from '#data/effects.json';
import { getTranslation } from '#utils/helpers.ts';
import { toDisplayName } from '#utils/index.ts';
import { createSearchCatalog } from '#utils/searchQuery.ts';

import EffectGrid from './EffectGrid';

const effectSearch = createSearchCatalog({
	records: effects,
	getView: effect => ({
		...effect,
		name: getTranslation(`effect.${effect.id}`, toDisplayName(effect.id))
	}),
	descriptions: {
		id: 'Effect static name',
		intId: 'Internal numeric identifier',
		name: 'Translated effect name',
		class: 'Effect behavior class',
		effectType: 'Buff, debuff, neutral, or hidden classification',
		textureX: 'X coordinate into the UI texture',
		textureY: 'Y coordinate into the UI texture',
		ticks: 'Effect duration in ticks',
		delay: 'Tick delay between effect updates',
		incompatibilityID: 'Identifier of an incompatible effect',
		speedModifier: 'Movement speed multiplier',
		strength: 'Effect strength',
		amount: 'Effect amount',
		hp: 'Health change',
		modifier: 'Stat modifier'
	}
});

export const metadata: Metadata = {
	title: 'Effects',
	description:
		'Browse Allumeria buffs, debuffs, passive effects, modifiers, and their item or block sources.',
	alternates: { canonical: '/effects' }
};

const Page = () => (
	<div className="mx-auto flex w-full max-w-294 flex-col gap-1">
		<Breadcrumbs
			items={[{ label: 'Home', href: '/' }, { label: 'Effects' }]}
			className="self-start"
		/>
		<div className="my-3 grid grid-cols-1 items-start gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-6">
			<h1 className="text-3xl font-bold pixel-shadow md:text-4xl">Effects</h1>
			<QuerySearch catalog={effectSearch} label="Search effects" />
		</div>

		<EffectGrid catalog={effectSearch} />
	</div>
);

export default Page;
