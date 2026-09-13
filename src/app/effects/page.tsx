import { type Metadata } from 'next';

import Breadcrumbs from '#components/Breadcrumbs.tsx';

import EffectFilters from './EffectFilters';
import EffectGrid from './EffectGrid';

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
		<h1 className="mb-3 text-3xl font-bold pixel-shadow md:text-4xl">
			Effects
		</h1>

		<EffectFilters />

		<EffectGrid />
	</div>
);

export default Page;
