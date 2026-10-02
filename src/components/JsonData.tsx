'use client';

import { Activity, useState } from 'react';

import RawData from '#components/RawData.tsx';
import Button from '#components/styled/Button.tsx';

type Props = {
	data: unknown;
};

const JsonData = ({ data }: Props) => {
	const [isVisible, setIsVisible] = useState(false);

	if (!data) return null;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-4">
				<h2 className="text-3xl font-bold text-dark-aqua pixel-shadow">
					JSON data:
				</h2>
				<Button
					variant="purple"
					className="text-xs"
					onClick={() => setIsVisible(prev => !prev)}
					aria-expanded={isVisible}
				>
					{isVisible ? 'Hide' : 'Show'}
				</Button>
			</div>

			<Activity mode={isVisible ? 'visible' : 'hidden'}>
				<RawData data={data} />
			</Activity>
		</div>
	);
};

export default JsonData;
