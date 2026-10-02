import { type Metadata } from 'next';

import Breadcrumbs from '#components/Breadcrumbs.tsx';

import DataTagsReader from './DataTagsReader';

export const metadata: Metadata = {
	title: 'Data Tag Reader',
	description: "Read Allumeria's data tag format files.",
	alternates: { canonical: '/data-tag-reader' }
};

const Page = () => (
	<div className="mx-auto flex w-full max-w-294 flex-col gap-1">
		<Breadcrumbs
			items={[{ label: 'Home', href: '/' }, { label: 'Data Tag Reader' }]}
			className="self-start"
		/>
		<h1 className="my-3 text-3xl font-bold pixel-shadow md:text-4xl">
			Data Tag Reader
		</h1>

		<DataTagsReader />
	</div>
);

export default Page;
