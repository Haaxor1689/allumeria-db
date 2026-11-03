'use client';

import cn from 'classnames';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { type ReadmeImage } from '#utils/readme.ts';

const AutoAdvanceMs = 5000;

type Props = {
	images: ReadmeImage[];
	// Used for accessible labels and alt text fallbacks
	name: string;
	className?: string;
};

const ModImageSlideshow = ({ images, name, className }: Props) => {
	const [current, setCurrent] = useState(0);
	const [paused, setPaused] = useState(false);
	const ref = useRef<HTMLElement>(null);
	const count = images.length;

	useEffect(() => {
		if (count <= 1 || paused) return;
		const interval = setInterval(
			() => setCurrent(prev => (prev + 1) % count),
			AutoAdvanceMs
		);
		return () => clearInterval(interval);
	}, [count, paused]);

	// Pause while the containing card (not just this section) is hovered or focused
	useEffect(() => {
		const parent = ref.current?.parentElement;
		if (!parent || count <= 1) return;
		const pause = () => setPaused(true);
		const resume = () => setPaused(false);
		parent.addEventListener('mouseenter', pause);
		parent.addEventListener('mouseleave', resume);
		parent.addEventListener('focusin', pause);
		parent.addEventListener('focusout', resume);
		return () => {
			parent.removeEventListener('mouseenter', pause);
			parent.removeEventListener('mouseleave', resume);
			parent.removeEventListener('focusin', pause);
			parent.removeEventListener('focusout', resume);
		};
	}, [count]);

	if (count === 0)
		return (
			<div
				className={cn(
					'pointer-events-none flex aspect-video w-full flex-col items-center justify-center gap-2 ns-slot text-muted',
					className
				)}
			>
				<img src="/custom/eye.webp" alt="" className="size-16 opacity-70" />
				<span>No images available</span>
			</div>
		);

	const step = (delta: number) =>
		setCurrent(prev => (prev + delta + count) % count);

	return (
		<section
			ref={ref}
			aria-roledescription="carousel"
			aria-label={`${name} preview images`}
			className={cn(
				'pointer-events-none relative aspect-video w-full overflow-hidden ns-borderless-slot',
				className
			)}
		>
			{images.map((image, i) => (
				<img
					key={image.src}
					src={image.src}
					alt={image.alt || `${name} preview ${i + 1}`}
					loading="lazy"
					aria-hidden={i !== current}
					className={cn(
						'absolute inset-0 size-full object-contain transition-opacity duration-500 motion-reduce:transition-none',
						i === current ? 'opacity-100' : 'opacity-0'
					)}
				/>
			))}
			{count > 1 && (
				<>
					<button
						type="button"
						aria-label="Previous image"
						onClick={() => step(-1)}
						className="pointer-events-auto absolute inset-y-0 left-0 z-10 flex cursor-pointer items-center text-white hocus:text-aqua"
					>
						<ChevronLeft className="size-8" />
					</button>
					<button
						type="button"
						aria-label="Next image"
						onClick={() => step(1)}
						className="pointer-events-auto absolute inset-y-0 right-0 z-10 flex cursor-pointer items-center text-white/70 hocus:text-aqua"
					>
						<ChevronRight className="size-8" />
					</button>
					<div className="pointer-events-auto absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 p-2">
						{images.map((image, i) => (
							<button
								key={image.src}
								type="button"
								aria-label={`Show image ${i + 1} of ${count}`}
								aria-current={i === current}
								onClick={() => setCurrent(i)}
								className={cn(
									'ns-btn active:ns-btn-pressed px-1 cursor-pointer hocus:ns-btn-hover',
									i === current && 'ns-btn-positive'
								)}
							/>
						))}
					</div>
					<span className="sr-only" aria-live={paused ? 'polite' : 'off'}>
						Image {current + 1} of {count}
					</span>
				</>
			)}
		</section>
	);
};

export default ModImageSlideshow;
