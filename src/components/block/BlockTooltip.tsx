import { type Block } from '#server/types.ts';
import { getTranslation } from '#utils/helpers.ts';

const BlockTooltip = ({ block }: { block: Block }) => (
	<div className="ns-dialog px-2 py-1 text-2xl">
		<p className="font-bold">{getTranslation(`item.${block.id}`)}</p>
	</div>
);

export default BlockTooltip;
