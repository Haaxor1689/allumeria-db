import TooltipEntry from '#components/TooltipEntry.tsx';
import { type Block } from '#server/types.ts';
import { toDisplayName } from '#utils/index.ts';

type Props = {
	block: Block;
};

const BlockMetaTooltip = ({ block }: Props) => (
	<div className="ns-dialog px-2 py-1 text-lg">
		{block.class && <TooltipEntry>Class: {block.class}</TooltipEntry>}
		{block.material && (
			<TooltipEntry>Material: {toDisplayName(block.material)}</TooltipEntry>
		)}
		{block.spawn && (
			<TooltipEntry>Spawns: {toDisplayName(block.spawn)}</TooltipEntry>
		)}
		{block.blockModel && (
			<TooltipEntry>Model: {toDisplayName(block.blockModel)}</TooltipEntry>
		)}
		{block.loot && <TooltipEntry>Loot: {block.loot}</TooltipEntry>}
		{block.hidden && <TooltipEntry>Hidden</TooltipEntry>}
	</div>
);

export default BlockMetaTooltip;
