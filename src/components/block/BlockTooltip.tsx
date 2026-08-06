import EffectLink from '#components/effect/EffectLink.tsx';
import TooltipEntry from '#components/TooltipEntry.tsx';
import blockMaterials from '#data/block_materials.json';
import effects from '#data/effects.json';
import { type Block } from '#server/types.ts';
import { getBlockName, getTool, getTranslation } from '#utils/helpers.ts';

const BlockTooltip = ({ block }: { block: Block }) => {
	const material = blockMaterials.find(mat => mat.id === block.material);

	const preferredTool = getTool(material?.preferredTool ?? 'hand');

	const hammerTool =
		block.canBeShaped && material?.hammerLevel ? getTool('hammer') : null;

	const effect = block.standOnEffect
		? effects.find(e => e.id === block.standOnEffect)
		: null;

	return (
		<div className="ns-dialog px-2 py-1 text-2xl">
			<p className="font-bold">{getBlockName(block)}</p>
			<TooltipEntry icon={preferredTool.icon}>
				Tool: {preferredTool.label} {material?.miningLevel ?? 0}
			</TooltipEntry>
			{hammerTool && (
				<TooltipEntry icon={hammerTool.icon}>
					Shaping: {hammerTool.label} {material?.hammerLevel ?? 0}
				</TooltipEntry>
			)}
			{block.spawn && (
				<TooltipEntry icon="/custom/skull.webp">Spawns monsters</TooltipEntry>
			)}
			{block.decorationScore && (
				<TooltipEntry icon="/assets/icons/category_decoration.webp">
					Decoration: {block.decorationScore}
				</TooltipEntry>
			)}
			{block.needsSupport && (
				<TooltipEntry icon="/assets/item_tags/48x320.webp">
					Needs support
				</TooltipEntry>
			)}
			{block.harvestLoot ? (
				<TooltipEntry icon="/assets/icons/category_natural.webp">
					Harvestable
				</TooltipEntry>
			) : block.interactible ? (
				<TooltipEntry icon="/assets/item_tags/56x320.webp">
					Interactible
				</TooltipEntry>
			) : null}
			{block.keyItem && (
				<TooltipEntry icon="/assets/item_tags/112x320.webp">
					Can be locked
				</TooltipEntry>
			)}
			{block.lightEmission && (
				<TooltipEntry icon="/custom/light.webp">
					Emits light:{' '}
					<div
						className="size-5 border border-white"
						style={{
							backgroundColor: `rgb(${block.lightEmission.map(v => v * 256).join(',')})`
						}}
					/>
				</TooltipEntry>
			)}
			{effect && (
				<p className="text-muted">
					Causes <EffectLink effect={effect} />
				</p>
			)}
			{block.craftingStation && (
				<p className="text-muted">
					Serves as a{' '}
					{getTranslation(`crafting_station.${block.craftingStation}`)}
				</p>
			)}
		</div>
	);
};

export default BlockTooltip;
