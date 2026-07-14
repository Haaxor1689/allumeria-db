'use client';

import { type ImgHTMLAttributes } from 'react';

type Props = ImgHTMLAttributes<HTMLImageElement> & {
	fallback?: string;
};

const Img = ({ fallback, ...props }: Props) => (
	// oxlint-disable-next-line jsx-a11y/alt-text
	<img
		{...props}
		onError={e => {
			if (fallback) e.currentTarget.src = fallback;
		}}
	/>
);

export default Img;
