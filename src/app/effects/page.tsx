import { type Metadata } from 'next';
import Link from 'next/link';

import EffectFilters from './EffectFilters';
import EffectGrid from './EffectGrid';

export const metadata: Metadata = {
	title: 'Effects'
};

const Page = () => (
	<div className="mx-auto flex w-full max-w-292 flex-col gap-1">
		<Link href="/" className="self-start text-muted underline hocus:text-aqua">
			&lt; Back to homepage
		</Link>
		<h1 className="mb-3 text-3xl font-bold pixel-shadow md:text-4xl">
			Effects
		</h1>

		<EffectFilters />

		<EffectGrid />
	</div>
);

export default Page;
