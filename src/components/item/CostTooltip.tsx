import cn from 'classnames';

import items from '#data/items.json';
import { getTranslation } from '#utils/helpers.ts';

const coins = items
	.filter(item => item.currencyAmmount)
	.toSorted((a, b) => b.currencyAmmount! - a.currencyAmmount!);

type Props = {
	value: number;
	className?: string;
};

const CostTooltip = ({ value, className = 'ns-dialog-positive' }: Props) => {
	if (!value) return null;
	const split = coins.reduce(
		(acc, coin) => {
			const count = Math.floor(value / coin.currencyAmmount!);
			if (count > 0) {
				acc.push({ item: coin, count });
				value -= count * coin.currencyAmmount!;
			}
			return acc;
		},
		[] as { item: (typeof coins)[number]; count: number }[]
	);
	return (
		<div className={cn('flex gap-2 self-start text-xl', className)}>
			{split.map(({ item, count }) => (
				<div key={item.id} className="relative -m-1">
					<img
						src={`/assets/items/${item.sprite ?? item.id}.webp`}
						alt={getTranslation(`item.${item.id}`)}
						className="size-16"
					/>
					<div className="absolute -right-1 -bottom-2 text-2xl font-bold pixel-shadow">
						{count}
					</div>
				</div>
			))}
		</div>
	);
};

export default CostTooltip;
