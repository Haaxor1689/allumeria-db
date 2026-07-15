import TooltipEntry from '#components/TooltipEntry.tsx';
import { type Entity } from '#server/types.ts';
import { toDisplayName } from '#utils/index.ts';

const heartIcons = [
	'/assets/icons/heart_empty.webp',
	'/assets/icons/heart_quarter.webp',
	'/assets/icons/heart_half.webp',
	'/assets/icons/heart_three_quarters.webp',
	'/assets/icons/heart_full.webp'
];

const HealthBar = ({ health }: { health: number }) => {
	const fullHearts = Math.floor(health / 4);
	const remainingHealth = health % 4;
	return (
		<div className="-my-2 flex items-center gap-1">
			{fullHearts > 4 ? (
				<div className="relative flex items-center justify-center">
					<p className="absolute text-xl font-bold text-white pixel-shadow">
						{fullHearts}
					</p>
					<img src={heartIcons[4]} alt="Heart" className="h-10 w-11" />
				</div>
			) : (
				[...Array(fullHearts).keys()].map((_, idx) => (
					<img
						key={idx}
						src={heartIcons[4]}
						alt="Heart"
						className="h-10 w-11"
					/>
				))
			)}
			{remainingHealth !== 0 && (
				<img
					src={heartIcons[remainingHealth]}
					alt="Heart"
					className="h-10 w-11"
				/>
			)}
			<p>({health} HP)</p>
		</div>
	);
};

type Props = {
	creature: Entity;
};

const CreatureTooltip = ({ creature }: Props) => (
	<div className="ns-dialog-negative px-2 py-1 text-2xl">
		<p className="font-bold">{toDisplayName(creature.id)}</p>

		<TooltipEntry icon="/assets/icons/small_heart.webp">
			Health: <HealthBar health={creature.health ?? 0} />
		</TooltipEntry>
		<TooltipEntry icon="/custom/damage.webp">
			Base damage: {creature.baseDamage}
		</TooltipEntry>
		{creature.defence !== undefined && (
			<TooltipEntry icon="/assets/icons/small_defence.webp">
				Defence: {creature.defence}
			</TooltipEntry>
		)}
		<TooltipEntry icon="/custom/speed.webp">
			Walk speed: {creature.walkSpeed}
		</TooltipEntry>
		<TooltipEntry icon="/assets/icons/small_coin.webp">
			Coin drop: {creature.minCoinDrop} – {creature.maxCoinDrop}
		</TooltipEntry>
		{creature.flying && (
			<TooltipEntry icon="/custom/flight.webp">Flying</TooltipEntry>
		)}
		{creature.canSpawnInSunlight && (
			<TooltipEntry icon="/custom/sun.webp">Can spawn in sunlight</TooltipEntry>
		)}
	</div>
);

export default CreatureTooltip;
