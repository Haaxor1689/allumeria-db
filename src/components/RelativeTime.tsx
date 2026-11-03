'use client';

import { useSyncExternalStore } from 'react';

import { getLastUpdatedString } from '#utils/index.ts';
import { formatDate } from '#utils/mods.ts';

const subscribe = () => () => {};

type Props = {
	date: string;
	className?: string;
};

// "X days ago" depends on the current time, which can't be prerendered.
// Server/prerender output shows the absolute date, the client swaps it for the relative one.
const RelativeTime = ({ date, className }: Props) => {
	const label = useSyncExternalStore(
		subscribe,
		() => getLastUpdatedString(new Date(date)),
		() => formatDate(date)
	);
	return (
		<time dateTime={date} title={formatDate(date)} className={className}>
			{label}
		</time>
	);
};

export default RelativeTime;
