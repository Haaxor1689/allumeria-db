import RotatingElements from '#components/RotatingElements.tsx';
import items from '#data/items.json';
import recipeAliases from '#data/recipe_aliases.json';
import { type Recipe } from '#server/types.ts';
import { getTranslation } from '#utils/helpers.ts';

import ItemSlot from './ItemSlot';

type Props = {
	recipe: Recipe;
};

const RecipeTooltip = ({ recipe }: Props) => {
	const requirements = (
		Object.entries(recipe.requirements) as [string, number?][]
	)
		.map(([key, value]) => {
			const alias = recipeAliases.find(a => a.id === key);
			if (alias)
				return {
					items: alias.entries
						.map(e => items.find(i => i.id === e))
						.filter(v => v !== undefined),
					value
				};
			const item = items.find(i => i.id === key);
			return { items: [item].filter(v => v !== undefined), value };
		})
		.filter(v => v !== null);

	return (
		<div className="flex items-start">
			<div className="flex gap-2 ns-borderless-ingredients p-4 text-xl">
				{requirements.map(({ items, value }, idx) => (
					<RotatingElements
						key={idx}
						entries={items.map(item => (
							<ItemSlot
								key={item?.id}
								item={item}
								overlay={
									<div className="absolute -right-1 -bottom-2 text-2xl font-bold pixel-shadow">
										{value}
									</div>
								}
								transparent
							/>
						))}
					/>
				))}
			</div>
			<div className="flex gap-2 ns-borderless-ribbon p-3.5 pr-6 pl-2 text-2xl text-muted">
				{getTranslation(`crafting_station.${recipe.station}`)}
			</div>
		</div>
	);
};

export default RecipeTooltip;
