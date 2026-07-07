'use client';
import z from 'zod';

import useSearchParams from '#utils/useSearchParams.ts';

const SearchResults = () => {
	const { q } = useSearchParams(
		z.object({
			q: z.string().optional()
		})
	);

	return (
		<section className="mx-auto flex w-full max-w-292 grow flex-col items-center justify-center gap-4 ns-dialog p-8 text-center">
			<img
				src="/assets/icons/category_technical.webp"
				alt="Search"
				width={64}
				height={64}
				className="size-16"
			/>
			<h1 className="text-3xl font-bold pixel-shadow md:text-4xl">Search</h1>
			<p className="max-w-xl text-base text-muted">
				Search results are coming soon. Query support and result filtering will
				be available here in a future update.
			</p>
			{q ? <p className="text-sm text-aqua">Current query: {q}</p> : null}
		</section>
	);
};
export default SearchResults;
