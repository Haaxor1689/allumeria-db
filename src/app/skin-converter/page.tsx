import { type Metadata } from 'next';

import Breadcrumbs from '#components/Breadcrumbs.tsx';

import SkinConverter from './SkinConverter';

export const metadata: Metadata = {
	title: 'Skin Converter',
	description: 'Convert Minecraft skins to the Allumeria skin format.',
	alternates: { canonical: '/skin-converter' }
};

const Page = () => (
	<div className="mx-auto flex w-full max-w-294 flex-col gap-1">
		<Breadcrumbs
			items={[{ label: 'Home', href: '/' }, { label: 'Skin Converter' }]}
			className="self-start"
		/>
		<h1 className="my-3 text-3xl font-bold pixel-shadow md:text-4xl">
			Skin Converter
		</h1>

		<SkinConverter />
	</div>
);

export default Page;
