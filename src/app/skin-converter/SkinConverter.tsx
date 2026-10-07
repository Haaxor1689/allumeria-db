'use client';

import cn from 'classnames';
import { Download, FileUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import EntityRenderer from '#components/renderer/EntityRenderer.tsx';
import Button from '#components/styled/Button.tsx';

import { convertSkin } from './convertSkin';

type Source = { name: string; url: string; image: HTMLImageElement };

const DefaultSkin = { name: 'skin_steve.png', url: '/custom/skin_steve.png' };

const loadImage = async (url: string) => {
	const image = new Image();
	image.src = url;
	await image.decode();
	return image;
};

const SkinConverter = () => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [source, setSource] = useState<Source | null>(null);
	const [slim, setSlim] = useState(false);
	const [scale, setScale] = useState(4);
	const [error, setError] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	const output = useMemo(
		() =>
			source
				? convertSkin(source.image, { slim, scale }).toDataURL('image/png')
				: null,
		[source, slim, scale]
	);

	useEffect(() => {
		let cancelled = false;
		void loadImage(DefaultSkin.url).then(image => {
			if (!cancelled) setSource(s => s ?? { ...DefaultSkin, image });
			return undefined;
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const readFile = async (file: File) => {
		setError(null);
		const url = URL.createObjectURL(file);
		try {
			const image = await loadImage(url);
			const { naturalWidth: w, naturalHeight: h } = image;
			if (w !== h && w !== h * 2)
				setError(
					`Skin is ${w}x${h}, expected 64x64 or 64x32. Result may be incorrect.`
				);
			if (source?.url.startsWith('blob:')) URL.revokeObjectURL(source.url);
			setSource({ name: file.name, url, image });
		} catch (err) {
			URL.revokeObjectURL(url);
			setError(err instanceof Error ? err.message : 'Failed to read file.');
		}
	};

	return (
		<div className="mx-auto flex w-full max-w-294 flex-col gap-4 ns-dialog p-4">
			<div className="flex flex-wrap items-center gap-3">
				<h2 className="shrink grow text-3xl font-bold wrap-break-word pixel-shadow">
					{source?.name ?? DefaultSkin.name}
				</h2>

				<div className="flex items-center gap-2">
					<p className="text-xl font-bold pixel-shadow">Slim arms:</p>
					<Button onClick={() => setSlim(v => !v)} className="w-19">
						{slim ? 'Yes' : 'No'}
					</Button>
				</div>

				<div className="flex items-center gap-2">
					<p className="text-xl font-bold pixel-shadow">Resolution:</p>
					<Button
						onClick={() => setScale(v => (v === 1 ? 4 : v - 1))}
						className="w-19"
					>
						{64 * scale}
					</Button>
				</div>
			</div>

			{error && (
				<p className="ns-dialog-negative p-3 text-sm font-bold pixel-shadow">
					{error}
				</p>
			)}

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-[3fr_4fr]">
				<div className="relative aspect-square w-full ns-slot">
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
						className="group relative size-full cursor-pointer"
						aria-label="Drop a Minecraft skin here or click to browse"
					>
						{source && (
							<img
								src={source.url}
								alt="Original Minecraft skin"
								className="size-full object-contain"
							/>
						)}
						<div
							className={cn(
								'absolute inset-0 flex flex-col items-center justify-center gap-3 border-2 border-dashed bg-black/60 p-6 text-center transition-opacity',
								isDragging
									? 'border-white/80 opacity-100'
									: 'border-white/60 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
							)}
						>
							<FileUp className="size-10 opacity-80" aria-hidden />
							<p className="font-bold pixel-shadow">
								Drop a Minecraft skin here or click to browse
							</p>
						</div>
						<input
							ref={inputRef}
							type="file"
							accept="image/png"
							onChange={e => {
								const file = e.target.files?.[0];
								if (file) void readFile(file);
								e.target.value = '';
							}}
							onClick={e => e.stopPropagation()}
							className="hidden"
						/>
					</button>
					<div
						title="Minecraft texture slot"
						className="pointer-events-none absolute top-2 right-2 ns-slot"
					>
						<img
							src="/icon_creeper.png"
							alt=""
							aria-hidden
							className="size-8 opacity-50"
						/>
					</div>
				</div>

				<div className="relative aspect-square w-full ns-slot sm:row-start-2">
					{output && (
						<a
							href={output}
							download="skin.png"
							className="group relative block size-full cursor-pointer"
							aria-label="Download converted Allumeria skin"
						>
							<img
								src={output}
								alt="Converted Allumeria skin"
								className="size-full object-contain"
							/>
							<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/60 bg-black/60 p-6 text-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
								<Download className="size-10 opacity-80" aria-hidden />
								<p className="font-bold pixel-shadow">Click to download</p>
							</div>
						</a>
					)}
					<div
						title="Allumeria texture slot"
						className="pointer-events-none absolute top-2 right-2 ns-slot"
					>
						<img
							src="/icon_allumeria.png"
							alt=""
							aria-hidden
							className="size-8 opacity-50"
						/>
					</div>
				</div>

				<div className="relative aspect-2/3 sm:row-span-2 sm:row-start-1 sm:aspect-auto">
					{output ? (
						<EntityRenderer
							model="player.player"
							texture={output}
							className="absolute inset-0 ns-slot"
						/>
					) : (
						<div className="absolute inset-0 ns-slot" />
					)}
				</div>
			</div>

			<ol className="list-inside list-decimal pixel-shadow">
				<li>
					Upload a Minecraft skin by clicking or dropping it on the Minecraft
					texture slot
				</li>
				<li>Preview how it looks on the 3D model</li>
				<li>Download it by clicking on the Allumeria texture slot</li>
				<li>
					Place it into{' '}
					<span className="font-bold break-all text-aqua">
						%My Documents%/Allumeria/characters/{'{character_name}'}/skin.png
					</span>
				</li>
			</ol>

			<p className="pt-4 text-sm pixel-shadow">
				Original implementation of the conversion algorithm belongs to the{' '}
				<Link
					href="https://github.com/DarBarri/Allumeria-Skin-Converter"
					target="_blank"
					className="text-aqua underline hocus:text-white"
				>
					DarBarri/Allumeria-Skin-Converter
				</Link>{' '}
				project written in Python.
			</p>
		</div>
	);
};

export default SkinConverter;
