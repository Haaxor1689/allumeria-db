export const toDisplayName = (str: string) =>
	// oxlint-disable-next-line typescript/no-misused-spread
	[...str].reduce((acc, char, index, arr) => {
		if (index === 0) return char.toUpperCase();

		if (char === '_') return `${acc} `;

		const isUppercase = char.toLocaleUpperCase() === char;
		const isPrevSpace = arr[index - 1] === ' ';
		if (isUppercase && !isPrevSpace) return `${acc} ${char}`;
		if (!isUppercase && isPrevSpace) return `${acc}${char.toUpperCase()}`;
		return acc + char;
	}, '');

export const getLastUpdatedString = (date: Date) => {
	if (!date) return 'Never';
	const now = new Date();
	const diff = now.getTime() - new Date(date).getTime();
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	const plural = (n: number) => (n === 1 ? '' : 's');
	if (days >= 365) return 'Over a year ago';
	if (days >= 30) {
		const months = Math.floor(days / 30);
		return `${months} month${plural(months)} ago`;
	}
	if (days > 0) return `${days} day${plural(days)} ago`;
	const hours = Math.floor(diff / (1000 * 60 * 60));
	if (hours > 0) return `${hours} hour${plural(hours)} ago`;
	const minutes = Math.floor(diff / (1000 * 60));
	if (minutes > 0) return `${minutes} minute${plural(minutes)} ago`;
	return `<1 minute ago`;
};
