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
			{item.class && <TooltipEntry>Class: {item.class}</TooltipEntry>}
			<TooltipEntry>Stack size: {item.stackSize ?? 512}</TooltipEntry>
			{item.rarity && <TooltipEntry>Rarity: {rarity}</TooltipEntry>}
			{item.hidden && (
				<TooltipEntry icon="/custom/eye.webp">Hidden</TooltipEntry>
			)}
			{item.sweeping && <TooltipEntry>Sweeping</TooltipEntry>}
			{item.targetLiquid && <TooltipEntry>Target liquid</TooltipEntry>}
			{item.slotType && (
				<TooltipEntry
					icon={`/assets/icons/slot_${item.slotType.toLocaleLowerCase()}.webp`}
					className="[&>img]:-m-1.5 [&>img]:size-8"
				>
					{item.slotType}
				</TooltipEntry>
			)}
		</div>
	);
};

export default ItemMetaTooltip;
