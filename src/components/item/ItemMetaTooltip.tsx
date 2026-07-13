import TooltipEntry from '#components/TooltipEntry.tsx';
import { type Item } from '#server/types.ts';
import { ItemCategories } from '#utils/constants.ts';

const ItemMetaTooltip = ({ item }: { item: Item }) => {
	const rarity = Number(item.rarity);

	const categories = item.category
		?.map(cat => {
			const meta = ItemCategories[cat as keyof typeof ItemCategories];
			if (!meta) return null;
			return (
				<TooltipEntry key={cat} icon={meta.icon}>
					{meta.label}
				</TooltipEntry>
			);
		})
		.filter(v => v !== null);

	return (
		<div className="ns-dialog px-2 py-1 text-lg">
			<div className="flex shrink flex-wrap gap-x-3 [&_img]:size-4">
				{categories}
			</div>
			<TooltipEntry>Stack size: {item.stackSize ?? 512}</TooltipEntry>
			{item.type && <TooltipEntry>Class: {item.type}</TooltipEntry>}
			{item.rarity && <TooltipEntry>Rarity: {rarity}</TooltipEntry>}
			{item.hidden && <TooltipEntry>Hidden</TooltipEntry>}
			{item.sweeping && <TooltipEntry>Sweeping</TooltipEntry>}
			{item.targetLiquid && <TooltipEntry>Target liquid</TooltipEntry>}
		</div>
	);
};

export default ItemMetaTooltip;
