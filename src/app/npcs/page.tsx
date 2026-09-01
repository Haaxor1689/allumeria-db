import { type Metadata } from 'next';
import Link from 'next/link';

import NPCFilters from './NPCFilters';
import CreatureGrid from './NPCGrid';

export const metadata: Metadata = {
	title: 'NPCs'
};

const Page = () => (
	<div className="mx-auto flex w-full max-w-294 flex-col gap-1">
		<Link href="/" className="self-start text-muted underline hocus:text-aqua">
			&lt; Back to homepage
		</Link>
		<h1 className="mb-3 text-3xl font-bold pixel-shadow md:text-4xl">NPCs</h1>

		<NPCFilters />

		<CreatureGrid />
	</div>
);

export default Page;
