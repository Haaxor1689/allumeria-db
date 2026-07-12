import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import BlockMetaTooltip from '#components/block/BlockMetaTooltip.tsx';
import BlockRender from '#components/block/BlockRender.tsx';
import BlockTooltip from '#components/block/BlockTooltip.tsx';
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
			<Link href="/blocks" className="text-muted underline hocus:text-aqua">
				&lt; Back to blocks
			</Link>
			<h1 className="text-3xl font-bold pixel-shadow md:text-4xl">
				{getTranslation(`item.${block.id}`)}
			</h1>
			<BlockRender block={block} />
			<BlockMetaTooltip block={block} />
		</div>
	);
};

export default Page;
