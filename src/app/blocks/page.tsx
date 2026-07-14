import { type Metadata } from 'next';
import Link from 'next/link';

import BlockFilters from './BlockFilters';
import BlockGrid from './BlockGrid';

export const metadata: Metadata = {
	title: 'Blocks'
};

const Page = () => (
	<div className="mx-auto flex w-full max-w-294 flex-col gap-1">
		<Link href="/" className="self-start text-muted underline hocus:text-aqua">
			&lt; Back to homepage
		</Link>
		<h1 className="mb-3 text-3xl font-bold pixel-shadow md:text-4xl">Blocks</h1>

		<BlockFilters />

		<BlockGrid />
	</div>
);

export default Page;
