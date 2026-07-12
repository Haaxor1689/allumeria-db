import items from '#data/items.json';
import recipeAliases from '#data/recipe_aliases.json';
import recipes from '#data/recipes.json';
import { getItemIcon, getTranslation } from '#utils/helpers.ts';

import RotatingSprite from '../RotatingSprite';

const RecipeTooltip = ({ item }: { item: string }) => {
	const recipe = recipes.find(r => r.result === item);
	if (!recipe) return null;

	const requirements = Object.entries(recipe.requirements)
		.map(([key, value]) => {
			const item = items.find(i => i.id === key);
			if (item) return { sprites: [getItemIcon(item)], value };
			const alias = recipeAliases.find(a => a.id === key);

			if (alias) {
				const entries = alias.entries
					.map(id => items.find(i => i.id === id))
					.filter(i => i !== undefined);
				if (entries.length > 0)
					return { sprites: entries.map(getItemIcon), value };
			}

			return null;
		})
		.filter(v => v !== null);

	return (
		<div className="flex items-start">
			<div className="flex gap-2 ns-borderless-ingredients p-4 text-xl">
				{requirements.map(({ sprites, value }, idx) => (
					<div key={idx} className="relative -m-1">
						<RotatingSprite
							src={sprites}
							alt={s => getTranslation(`item.${s}`)}
							fallback="/assets/items/missing.webp"
							className="size-16"
						/>
						<div className="absolute -right-1 -bottom-2 text-2xl font-bold pixel-shadow">
							{value}
						</div>
					</div>
				))}
			</div>
			<div className="flex gap-2 ns-borderless-ribbon p-3.5 pr-6 pl-2 text-2xl text-muted">
				{getTranslation(`crafting_station.${recipe.station}`)}
			</div>
		</div>
	);
};

export default RecipeTooltip;
