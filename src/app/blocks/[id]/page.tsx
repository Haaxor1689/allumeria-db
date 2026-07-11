import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import BlockRender from '#components/BlockRender.tsx';
import BlockTooltip from '#components/BlockTooltip.tsx';
import blocks from '#data/blocks.json';
import { getTranslation } from '#utils/helpers.ts';

export const generateStaticParams = () =>
	Array.from(new Set(blocks.map(block => block.id))).map(id => ({ id }));

export const generateMetadata = async ({
	params
}: PageProps<'/blocks/[id]'>): Promise<Metadata> => {
	const { id } = await params;
	const block = blocks.find(block => block.id === id);
	if (!block) return { title: 'Block not found' };
	return { title: getTranslation(`item.${block.id}`) };
};

const Page = async ({ params }: PageProps<'/blocks/[id]'>) => {
	const { id } = await params;
	const block = blocks.find(block => block.id === id);

	if (!block) notFound();

	return (
		<div className="mx-auto w-full max-w-292 space-y-4">
			<BlockRender block={block} />
			<Link href="/blocks" className="text-muted underline hocus:text-aqua">
				&lt; Back to blocks
			</Link>
			<BlockTooltip block={block} />
		</div>
	);
};

export default Page;
