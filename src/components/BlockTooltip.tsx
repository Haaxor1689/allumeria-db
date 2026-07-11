import { type ReactNode } from 'react';

import { type Block } from '#server/types.ts';
import { getTranslation } from '#utils/helpers.ts';

const TooltipEntry = ({
	label,
	children
}: {
	label: string;
	children: ReactNode;
}) => (
	<div className="flex shrink items-start gap-2 text-tooltip">
		<span className="font-bold text-muted">{label}:</span>
		<span className="shrink">{children}</span>
	</div>
);

const toReadableText = (value: string) => value.replaceAll('_', ' ');

const getBlockName = (id: string) => {
	const blockName = getTranslation(`block.${id}`);
	if (blockName !== `block.${id}`) return blockName;

	const itemName = getTranslation(`item.${id}`);
	if (itemName !== `item.${id}`) return itemName;

	return toReadableText(id);
};

const BlockTooltip = ({ block }: { block: Block }) => (
	<div className="flex flex-col items-start gap-1">
		<div className="ns-dialog px-2 py-1 text-2xl">
			<p className="font-bold">{getBlockName(block.id)}</p>
		</div>
		<div className="ns-dialog px-2 py-1 text-lg">
			<TooltipEntry label="ID">{block.id}</TooltipEntry>
			{block.type && <TooltipEntry label="Type">{block.type}</TooltipEntry>}
			{block.material && (
				<TooltipEntry label="Material">
					{toReadableText(block.material)}
				</TooltipEntry>
			)}
			{block.spawn && (
				<TooltipEntry label="Spawn">{toReadableText(block.spawn)}</TooltipEntry>
			)}
			{block.blockModel && (
				<TooltipEntry label="Model">
					{toReadableText(block.blockModel)}
				</TooltipEntry>
			)}
			{block.loot && <TooltipEntry label="Loot">{block.loot}</TooltipEntry>}
			{block.textures && block.textures.length > 0 && (
				<TooltipEntry label="Textures">
					{block.textures.join(', ')}
				</TooltipEntry>
			)}
			{block.hidden && <TooltipEntry label="Flag">Hidden</TooltipEntry>}
			{block.solid && <TooltipEntry label="Flag">Solid</TooltipEntry>}
			{block.semiSolid && <TooltipEntry label="Flag">Semi-solid</TooltipEntry>}
			{block.canBeShaped && (
				<TooltipEntry label="Flag">Can be shaped</TooltipEntry>
			)}
			{block.needsSupport && (
				<TooltipEntry label="Flag">Needs support</TooltipEntry>
			)}
		</div>
	</div>
);

export default BlockTooltip;
