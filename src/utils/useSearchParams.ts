'use client';

import { useSearchParams as useNextSearchParams } from 'next/navigation';
import type z from 'zod';

const useSearchParams = <T extends z.ZodObject<any>>(schema: T) => {
	const searchParams = useNextSearchParams();
	const parsedParams = schema.safeParse(
		Object.fromEntries(searchParams.entries())
	);

	const values: Partial<z.output<T>> = parsedParams.success
		? parsedParams.data
		: {};

	return {
		...values,
		set: (key: string, value?: string | number | boolean) => {
			const newSearchParams = new URLSearchParams(searchParams.toString());
			if (value === undefined) {
				newSearchParams.delete(key);
			} else {
				newSearchParams.set(key, value.toString());
			}
			const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
			window.history.replaceState(null, '', newUrl);
		}
	};
};

export default useSearchParams;
