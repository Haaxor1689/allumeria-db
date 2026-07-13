'use client';

import { useSearchParams as useNextSearchParams } from 'next/navigation';
import type z from 'zod';

const useSearchParams = <T extends z.ZodObject<any>>(schema: T) => {
	const searchParams = useNextSearchParams();
	const parsedParams = schema.safeParse(
		Object.fromEntries(searchParams.entries())
	);

	const values: z.output<T> = parsedParams.success
		? parsedParams.data
		: schema.parse({});

	return {
		...values,
		set: (key: string, value?: string | number | boolean) => {
			const newSearchParams = new URLSearchParams(searchParams.toString());
			if (
				value === undefined ||
				value === schema.shape[key]?.def?.defaultValue
			) {
				newSearchParams.delete(key);
			} else {
				newSearchParams.set(key, value.toString());
			}
			const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
			window.history.replaceState(null, '', newUrl);
		},
		reset: () => {
			const newSearchParams = new URLSearchParams(searchParams.toString());
			Object.keys(schema.shape).forEach(key => {
				newSearchParams.delete(key);
			});
			const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
			window.history.replaceState(null, '', newUrl);
		}
	};
};

export default useSearchParams;
