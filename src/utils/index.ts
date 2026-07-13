import { type z } from 'zod';

import { type ProcedureResult } from '#server/helpers.ts';

import { Errors, isErrors } from './errors';

export const downloadBlob = (blob: Blob, title: string) => {
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');

	link.href = url;
	link.download = title;

	link.click();
};

export const safeJsonParse = <T extends z.ZodType>({
	text,
	schema,
	errorMessage: message
}: {
	text: string;
	schema: T;
	errorMessage?: string;
}) => {
	try {
		const json = JSON.parse(text) as unknown;
		const parsed = schema.safeParse(json);
		if (!parsed.success)
			throw Errors.schemaValidation({
				message,
				error: parsed.error,
				data: json
			});
		return parsed.data as z.infer<T>;
	} catch (err) {
		throw isErrors(err) ? err : Errors.jsonParse({ message, data: text });
	}
};

export const invoke = <T>(value: Promise<ProcedureResult<T>>) =>
	value.then(res => {
		if (!res.ok) throw res.error;
		return res.data;
	});

export const toDisplayName = (str: string) =>
	// oxlint-disable-next-line typescript/no-misused-spread
	[...str].reduce((acc, char, index, arr) => {
		if (index === 0) return char.toUpperCase();

		if (char === '_') return `${acc} `;

		const isUppercase = char.toLocaleUpperCase() === char;
		const isPrevSpace = arr[index - 1] === ' ';
		if (isUppercase && !isPrevSpace) return `${acc} ${char}`;
		if (!isUppercase && isPrevSpace) return `${acc}${char.toUpperCase()}`;
		return acc + char;
	}, '');
