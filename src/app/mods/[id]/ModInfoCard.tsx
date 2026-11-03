import Link from 'next/link';
import { type ReactNode } from 'react';

import RelativeTime from '#components/RelativeTime.tsx';
import { type ModData } from '#server/mods.ts';
import { toDisplayName } from '#utils/index.ts';

const InfoRow = ({
	label,
	children
}: {
	label: string;
	children: ReactNode;
}) => (
	<>
		<dt className="text-aqua">{label}:</dt>
		<dd>{children}</dd>
	</>
);

const groupContributors = (contributors: ModData['metadata']['contributors']) =>
	contributors.reduce<{ role: string; names: string[] }[]>((acc, c) => {
		const role = c.role ? toDisplayName(c.role) : 'Contributor';
		const group = acc.find(g => g.role === role);
		if (group) group.names.push(c.name);
		else acc.push({ role, names: [c.name] });
		return acc;
	}, []);

type Props = {
	mod: ModData;
	allMods: ModData[];
	className?: string;
};

const ModInfoCard = ({ mod, allMods, className }: Props) => {
	const { metadata } = mod;
	return (
		<aside aria-label="Mod information" className={className}>
			<dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2">
				<InfoRow label="ID">{metadata.id}</InfoRow>
				<InfoRow label="Version">{metadata.version}</InfoRow>
				{metadata.environment && (
					<InfoRow label="Environment">
						{toDisplayName(metadata.environment)}
					</InfoRow>
				)}
				{mod.releasedAt && (
					<InfoRow label="Last release">
						<RelativeTime date={mod.releasedAt} />
					</InfoRow>
				)}
				{groupContributors(metadata.contributors).map(({ role, names }) => (
					<InfoRow key={role} label={names.length > 1 ? `${role}s` : role}>
						<ul>
							{names.map(name => (
								<li key={name}>{name}</li>
							))}
						</ul>
					</InfoRow>
				))}
			</dl>

			{metadata.dependencies.length > 0 && (
				<div className="flex flex-col gap-2">
					<h2 className="text-aqua">Dependencies:</h2>
					<ul className="flex flex-col gap-1 pl-4">
						{metadata.dependencies.map(dep => {
							const depMod = allMods.find(m => m.metadata.id === dep.id);
							return (
								<li
									key={dep.id}
									className="flex flex-wrap items-baseline gap-x-2"
								>
									{depMod ? (
										<Link
											href={`/mods/${depMod.slug}`}
											className="underline hocus:text-aqua"
										>
											{depMod.metadata.display_name}
										</Link>
									) : (
										<span>{dep.id}</span>
									)}
									{dep.version && <span>{dep.version}</span>}
									{dep.type && dep.type !== 'required' && (
										<span className="text-sm text-muted">({dep.type})</span>
									)}
								</li>
							);
						})}
					</ul>
				</div>
			)}
		</aside>
	);
};

export default ModInfoCard;
