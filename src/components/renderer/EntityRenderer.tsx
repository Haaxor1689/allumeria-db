'use client';

import { useCallback } from 'react';

import { buildEntityGroup } from '#renderer/entityRenderer.ts';

import Renderer, { type BuildGroupsOptions } from './Renderer.tsx';

type Props = {
	model: string | string[];
	texture: string;
	className?: string;
};

const EntityRenderer = ({
	model,
	texture,
	className = 'relative aspect-2/3 w-full ns-slot'
}: Props) => {
	const buildGroups = useCallback(
		async (_: BuildGroupsOptions) => await buildEntityGroup({ model, texture }),
		[model, texture]
	);

	return (
		<Renderer
			buildGroups={buildGroups}
			ariaLabel="Interactive creature preview"
			className={className}
		/>
	);
};

export default EntityRenderer;
