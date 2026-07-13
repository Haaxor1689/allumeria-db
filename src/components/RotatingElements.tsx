'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { Fragment } from 'react/jsx-runtime';

type Props = {
	entries: ReactNode[];
};

const RotatingElements = ({ entries }: Props) => {
	const [current, setCurrent] = useState(0);
	useEffect(() => {
		if (entries.length <= 1) return;
		const interval = setInterval(
			() => setCurrent(prev => (prev + 1) % entries.length),
			1000
		);
		return () => clearInterval(interval);
	}, [entries.length]);

	return <Fragment key={current}>{entries[current]}</Fragment>;
};

export default RotatingElements;
