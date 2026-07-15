'use client';

import { useCallback } from 'react';

import { buildEntityGroup } from '#renderer/entityRenderer.ts';

import Renderer, { type BuildGroupsOptions } from './Renderer.tsx';

type Props = {
	model: string | string[];
	texture: string;
};

const EntityRenderer = ({ model, texture }: Props) => {
	const buildGroups = useCallback(
		async (_: BuildGroupsOptions) => await buildEntityGroup({ model, texture }),
		[model, texture]
	);

	return (
		<Renderer
			buildGroups={buildGroups}
			ariaLabel="Interactive creature preview"
			className="relative aspect-2/3 w-full ns-slot"
		/>
	);
};

export default EntityRenderer;
