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
