'use client';

import { useCallback } from 'react';

import { buildBlockGroup } from '#renderer/blockRenderer.ts';
import { type Block } from '#server/types.ts';

import Renderer, { type BuildGroupsOptions } from './Renderer';

type Props = { block: Block };

const BlockRender = ({ block }: Props) => {
	const buildGroups = useCallback(
		({ loadTexture }: BuildGroupsOptions) =>
			buildBlockGroup({
				model: block.blockModel,
				textures: block.textures,
				loadTexture
			}),
		[block.blockModel, block.textures]
	);

	return (
		<Renderer buildGroups={buildGroups} ariaLabel="Interactive block preview" />
	);
};

export default BlockRender;
