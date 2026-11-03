import cn from 'classnames';
import { ChevronRight } from 'lucide-react';

import { type ReadmeHeading } from '#utils/readme.ts';

type TocNode = ReadmeHeading & { children: TocNode[] };

const buildTree = (headings: ReadmeHeading[]) => {
	const root: TocNode[] = [];
	const stack: TocNode[] = [];
	for (const heading of headings) {
		const node = { ...heading, children: [] };
		while (stack.length > 0 && stack.at(-1)!.depth >= heading.depth)
			stack.pop();
		(stack.at(-1)?.children ?? root).push(node);
		stack.push(node);
	}
	return root;
};

const TocList = ({
	items,
	depth = 0
}: {
	items: TocNode[];
	depth?: number;
}) => (
	<ol
		className={cn(
			'flex list-none flex-col [counter-reset:toc]',
			depth > 0 && 'text-sm text-muted'
		)}
	>
		{items.map(item => (
			<li key={item.id} className="[counter-increment:toc]">
				<a
					href={`#${item.id}`}
					style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}
					className="flex gap-2 py-1 pr-2 transition-colors before:w-5 before:text-right before:text-white/40 before:tabular-nums before:content-[counter(toc)_'.'] hocus:bg-white/5 hocus:text-aqua"
				>
					{item.text}
				</a>
				{item.children.length > 0 && (
					<TocList items={item.children} depth={depth + 1} />
				)}
			</li>
		))}
	</ol>
);

type Props = {
	headings: ReadmeHeading[];
	className?: string;
};

const ReadmeToc = ({ headings, className }: Props) => {
	if (headings.length < 2) return null;
	return (
		<details open className={cn('group ns-slot', className)}>
			<summary className="flex cursor-pointer list-none items-center gap-2 p-2 font-bold transition-colors pixel-shadow marker:hidden hocus:text-aqua [&::-webkit-details-marker]:hidden">
				<ChevronRight
					aria-hidden
					className="size-5 transition-transform group-open:rotate-90"
				/>
				Table of contents
			</summary>
			<nav aria-label="Table of contents" className="pt-1 pb-2">
				<TocList items={buildTree(headings)} />
			</nav>
		</details>
	);
};

export default ReadmeToc;
