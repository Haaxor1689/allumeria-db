import { type ReactNode } from 'react';

import { type Block } from '#server/types.ts';

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

const BlockMetaTooltip = ({ block }: { block: Block }) => (
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
			<TooltipEntry label="Textures">{block.textures.join(', ')}</TooltipEntry>
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
);

export default BlockMetaTooltip;
