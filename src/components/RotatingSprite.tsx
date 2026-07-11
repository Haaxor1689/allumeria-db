'use client';

import { type ImgHTMLAttributes, useEffect, useState } from 'react';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
	src: string[];
	alt?: (v?: string) => string;
	fallback: string;
};

const RotatingSprite = ({ src, alt, fallback, ...props }: Props) => {
	const [current, setCurrent] = useState(0);
	const [available, setAvailable] = useState<string[]>(src);
	useEffect(() => {
		if (src.length <= 1) return;
		const interval = setInterval(
			() => setCurrent(prev => (prev + 1) % available.length),
			1000
		);
		return () => clearInterval(interval);
	}, [src, available.length]);

	return (
		<img
			src={available[current] ?? fallback}
			alt={alt?.(available[current])}
			onError={() => {
				setAvailable(prev => prev.filter((_, i) => i !== current));
				setCurrent(prev => prev % available.length);
			}}
			{...props}
		/>
	);
};

export default RotatingSprite;
