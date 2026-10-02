'use client';

import cn from 'classnames';
import { FileUp } from 'lucide-react';
import { useRef, useState } from 'react';

import RawData from '#components/RawData.tsx';
import Button from '#components/styled/Button.tsx';
import { fromDataTagBuffer } from '#utils/parseDataTag.ts';

const DataTagsReader = () => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [data, setData] = useState<unknown>(null);
	const [error, setError] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	const readFile = async (file: File) => {
		setFileName(file.name);
		setError(null);
		setData(null);

		try {
			const buffer = new Uint8Array(await file.arrayBuffer());
			setData(fromDataTagBuffer(buffer));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to parse file.');
		}
	};

	const clear = () => {
		setFileName(null);
		setData(null);
		setError(null);
	};

	return (
		<div className="mx-auto flex w-full max-w-294 flex-col gap-4 ns-dialog p-4">
			{fileName !== null ? (
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="shrink text-3xl font-bold wrap-break-word pixel-shadow">
						{fileName}
					</h2>
					<Button variant="red" onClick={clear} className="shrink-0">
						<span className="flex items-center gap-2">Close file</span>
					</Button>
				</div>
			) : (
				<button
					type="button"
					onDragOver={e => {
						e.preventDefault();
						setIsDragging(true);
					}}
					onDragLeave={() => setIsDragging(false)}
					onDrop={e => {
						e.preventDefault();
						setIsDragging(false);
						const file = e.dataTransfer.files[0];
						if (file) void readFile(file);
					}}
					onClick={() => inputRef.current?.click()}
					className={cn(
						'flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed p-10 text-center transition-colors',
						isDragging
							? 'border-white/80 bg-white/10'
							: 'border-white/30 hocus:border-white/60'
					)}
				>
					<FileUp className="size-10 opacity-80" aria-hidden />
					<p className="font-bold pixel-shadow">
						Drop a data tag file here or click to browse
					</p>
					<input
						ref={inputRef}
						type="file"
						onChange={e => {
							const file = e.target.files?.[0];
							if (file) void readFile(file);
							e.target.value = '';
						}}
						onClick={e => e.stopPropagation()}
						className="hidden"
					/>
				</button>
			)}

			{error && (
				<p className="ns-dialog-negative p-3 text-sm font-bold pixel-shadow">
					{error}
				</p>
			)}

			{data !== null && <RawData data={data} />}
		</div>
	);
};

export default DataTagsReader;
