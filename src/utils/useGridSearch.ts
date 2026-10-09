'use client';

import z from 'zod';

import {
	filterSearchCatalog,
	parseSearchQuery,
	type SearchCatalog
} from './searchQuery.ts';
import useSearchParams from './useSearchParams.ts';

const searchSchema = z.object({ search: z.string().default('') });

const useGridSearch = <RecordType>(catalog: SearchCatalog<RecordType>) => {
	const params = useSearchParams(searchSchema);
	const parsed = parseSearchQuery(params.search, catalog);
	return {
		search: params.search,
		setSearch: (value: string) => params.set('search', value),
		reset: params.reset,
		diagnostics: parsed.diagnostics,
		visible: new Set(filterSearchCatalog(catalog, parsed))
	};
};

export default useGridSearch;
