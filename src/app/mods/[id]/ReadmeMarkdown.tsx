import cn from 'classnames';
import { Link } from 'lucide-react';
import { type ReactNode } from 'react';
import Markdown, { defaultUrlTransform } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import { resolveUrl } from '#utils/readme.ts';

type Props = {
	content: string;
	// Base URLs used to resolve repository-relative links and images
	linkBase: string;
	imageBase: string;
};

const Heading = ({
	as: Tag,
	id,
	className,
	children
}: {
	as: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
	id?: string;
	className?: string;
	children?: ReactNode;
}) => (
	<Tag
		id={id}
		className={cn(
			'group scroll-mt-4 flex items-center gap-2 font-bold pixel-shadow',
			className
		)}
	>
		{children}
		{id && (
			<a
				href={`#${id}`}
				className="text-muted opacity-0 transition-opacity group-hover:opacity-100 hocus:text-aqua hocus:opacity-100 [@media(hover:none)]:opacity-60"
			>
				<Link aria-hidden className="size-5" />
			</a>
		)}
	</Tag>
);

const ReadmeMarkdown = ({ content, linkBase, imageBase }: Props) => (
	<div className="flex flex-col gap-4 wrap-break-word">
		<Markdown
			remarkPlugins={[remarkGfm]}
			// Slugs are added after sanitizing so heading ids aren't clobber-prefixed
			// and stay in sync with `getReadmeHeadings`
			rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeSlug, rehypeHighlight]}
			urlTransform={(url, key) =>
				defaultUrlTransform(
					resolveUrl(url, key === 'src' ? imageBase : linkBase)
				)
			}
			components={{
				// The page already renders its own h1, so readme h1s step down
				h1: ({ id, children }) => (
					<Heading as="h2" id={id} className="text-3xl text-dark-aqua">
						{children}
					</Heading>
				),
				h2: ({ id, children }) => (
					<Heading as="h2" id={id} className="mt-4 text-3xl text-dark-aqua">
						{children}
					</Heading>
				),
				h3: ({ id, children }) => (
					<Heading as="h3" id={id} className="mt-2 text-2xl">
						{children}
					</Heading>
				),
				h4: ({ id, children }) => (
					<Heading as="h4" id={id} className="text-xl">
						{children}
					</Heading>
				),
				h5: ({ id, children }) => (
					<Heading as="h5" id={id} className="text-lg">
						{children}
					</Heading>
				),
				h6: ({ id, children }) => (
					<Heading as="h6" id={id}>
						{children}
					</Heading>
				),
				a: ({ href, children }) => (
					<a
						href={href}
						target={href?.startsWith('#') ? undefined : '_blank'}
						rel="noopener noreferrer"
						className="text-aqua underline hocus:text-white"
					>
						{children}
					</a>
				),
				ul: ({ children }) => (
					<ul className="flex list-outside list-disc flex-col gap-1 pl-6">
						{children}
					</ul>
				),
				ol: ({ children }) => (
					<ol className="flex list-outside list-decimal flex-col gap-1 pl-6">
						{children}
					</ol>
				),
				blockquote: ({ children }) => (
					<blockquote className="border-l-4 border-dark-aqua bg-black/30 px-3 py-2 text-muted [&>p]:m-0">
						{children}
					</blockquote>
				),
				pre: ({ children }) => (
					<pre className="overflow-x-auto bg-black/50 p-3 text-sm [&>code]:bg-transparent [&>code]:p-0">
						{children}
					</pre>
				),
				code: ({ children, className }) => (
					<code className={`bg-black/50 px-1 font-mono ${className ?? ''}`}>
						{children}
					</code>
				),
				table: ({ children }) => (
					<div className="overflow-x-auto">
						<table className="border-collapse">{children}</table>
					</div>
				),
				th: ({ children }) => (
					<th className="border border-white/20 p-2 text-left">{children}</th>
				),
				td: ({ children }) => (
					<td className="border border-white/20 p-2 align-top">{children}</td>
				),
				img: ({ src, alt }) => (
					<img
						src={typeof src === 'string' ? src : undefined}
						alt={alt ?? ''}
						loading="lazy"
						className="max-w-full"
					/>
				),
				hr: () => <hr className="border-white/20" />
			}}
		>
			{content}
		</Markdown>
	</div>
);

export default ReadmeMarkdown;
