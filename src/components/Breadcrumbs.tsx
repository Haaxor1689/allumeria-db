import Link from 'next/link';

import { env } from '#env.js';

import JsonLd from './JsonLd';

type Breadcrumb = {
	label: string;
	href?: string;
};

type BreadcrumbsProps = {
	items: Breadcrumb[];
	className?: string;
};

const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
	const structuredItems = items.map((item, index) => ({
		'@type': 'ListItem',
		'position': index + 1,
		'name': item.label,
		'item': new URL(item.href ?? '/', env.BASE_URL).toString()
	}));

	return (
		<>
			<JsonLd
				data={{
					'@context': 'https://schema.org',
					'@type': 'BreadcrumbList',
					'itemListElement': structuredItems
				}}
			/>
			<nav aria-label="Breadcrumb" className={className}>
				<ol className="flex flex-wrap items-center gap-1 text-muted">
					{items.map((item, index) => (
						<li
							key={`${item.href ?? item.label}-${index}`}
							className="flex items-center gap-1"
						>
							{index > 0 && <span aria-hidden="true">/</span>}
							{item.href ? (
								<Link href={item.href} className="underline hocus:text-aqua">
									{item.label}
								</Link>
							) : (
								<span aria-current="page">{item.label}</span>
							)}
						</li>
					))}
				</ol>
			</nav>
		</>
	);
};

export default Breadcrumbs;
