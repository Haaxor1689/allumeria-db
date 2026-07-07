'use client';

import { useEffect, useState } from 'react';

import { getTranslation } from '#utils/helpers.ts';

const RotatingSprite = ({ src }: { src: string[] }) => {
	const [current, setCurrent] = useState(0);
	useEffect(() => {
		const interval = setInterval(
			() => setCurrent(prev => (prev + 1) % src.length),
			1000
		);
		return () => clearInterval(interval);
	}, [src]);

	return (
		<img
			src={src[current]}
			alt={getTranslation(`item.${src[current]}`)}
			className="size-16"
		/>
	);
};

export default RotatingSprite;
