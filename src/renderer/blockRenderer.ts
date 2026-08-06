import * as THREE from 'three';

import blockModels from '#data/block_models.json';
import { type Block } from '#server/types.ts';

type Vec3 = [number, number, number];

type QuadMesh = {
	vertices: [Vec3, Vec3, Vec3, Vec3];
	texture: string;
	uvs?: [number, number, number, number];
	flag: number;
};

const createTextureMaterial = (texture: THREE.Texture) =>
	new THREE.MeshBasicMaterial({
		map: texture,
		transparent: true,
		alphaTest: 0.01,
		side: THREE.FrontSide
	});

const createQuadGeometry = (quad: QuadMesh): THREE.BufferGeometry => {
	const geometry = new THREE.BufferGeometry();
	const positions = new Float32Array([
		...quad.vertices[0],
		...quad.vertices[1],
		...quad.vertices[2],
		...quad.vertices[3]
	]);

	const shiftUvAxis = (min: number, max: number): [number, number] => {
		if (min >= 0) return [min, max];

		const shift = Math.ceil(-min);
		return [min + shift, max + shift];
	};

	const [rawU0, rawV0, rawU1, rawV1] = quad.uvs ?? [0, 0, 16, 16];
	const [u0, u1] = shiftUvAxis(rawU0 / 16, rawU1 / 16);
	const [v0, v1] = shiftUvAxis(rawV0 / 16, rawV1 / 16);

	// Inset the UVs slightly to avoid texture bleeding
	const uvInset = 0.005;
	const uvs = new Float32Array([
		u0 + uvInset,
		v0 + uvInset,
		u0 + uvInset,
		v1 - uvInset,
		u1 - uvInset,
		v1 - uvInset,
		u1 - uvInset,
		v0 + uvInset
	]);

	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
	geometry.setIndex([0, 2, 1, 0, 3, 2]);
	geometry.computeVertexNormals();
	return geometry;
};

type BlockRenderData = Pick<Block, 'id' | 'class' | 'blockModel' | 'textures'>;

export const getBlockVariants = ({
	class: className,
	blockModel = 'cube',
	textures
}: BlockRenderData): QuadMesh[][] => {
	const meshes = blockModels.find(m => m.id === blockModel)?.meshes ?? [];

	const cast = (mesh: (typeof meshes)[number], texture: string): QuadMesh => ({
		vertices: mesh.vertices as [Vec3, Vec3, Vec3, Vec3],
		uvs: mesh.uvs as [number, number, number, number] | undefined,
		texture,
		flag: mesh.flag ?? 0
	});

	if (className === 'ToggleLamp' && blockModel === 'cube')
		return textures.map(texture => meshes.map(mesh => cast(mesh, texture)));

	if (className === 'Plant')
		return textures.map(texture => meshes.map(mesh => cast(mesh, texture)));

	if (blockModel === 'small_plant')
		return textures
			.toReversed()
			.map(texture => meshes.map(mesh => cast(mesh, texture)));

	if (blockModel === 'sign')
		return meshes.reduce((acc, mesh) => {
			const idx = mesh.flag ?? 0;
			acc[idx] ??= [];
			acc[idx].push(cast(mesh, textures[idx] ?? 'missing'));
			return acc;
		}, [] as QuadMesh[][]);

	if (blockModel === 'door')
		return [
			[
				...meshes
					.filter(m => !m.flag)
					.map(mesh =>
						cast(mesh, textures[(mesh.textureIndex ?? 0) * 2 + 1] ?? 'missing')
					),
				...meshes
					.filter(m => !m.flag)
					.map(({ vertices, ...mesh }) =>
						cast(
							{
								...mesh,
								vertices: (vertices as [Vec3, Vec3, Vec3, Vec3]).map(
									([x, y, z]) => [x, y + 1, z] as Vec3
								) as [Vec3, Vec3, Vec3, Vec3]
							},
							textures[(mesh.textureIndex ?? 0) * 2] ?? 'missing'
						)
					)
			]
		];

	if (blockModel === 'bed')
		return [
			meshes.map(mesh => {
				const idx = mesh.flag ?? 0;
				const meshData =
					idx === 1
						? {
								...mesh,
								vertices: (mesh.vertices as [Vec3, Vec3, Vec3, Vec3]).map(
									([x, y, z]) => [x + 1, y, z] as Vec3
								) as [Vec3, Vec3, Vec3, Vec3]
							}
						: mesh;
				return cast(
					meshData,
					textures[mesh.textureIndex ?? 0] ?? textures[0] ?? 'missing'
				);
			})
		];

	if (blockModel === 'spike_trap') {
		const variants = meshes.map(mesh =>
			cast(mesh, textures[mesh.textureIndex ?? 0] ?? textures[0] ?? 'missing')
		);
		return [variants, variants.filter(v => v.flag === 0)];
	}

	return meshes.reduce((acc, mesh) => {
		const idx = mesh.flag ?? 0;
		acc[idx] ??= [];
		acc[idx].push(
			cast(mesh, textures[mesh.textureIndex ?? 0] ?? textures[0] ?? 'missing')
		);
		return acc;
	}, [] as QuadMesh[][]);
};

export const buildBlockGroup = async (
	block: BlockRenderData,
	loadTexture: (name: string) => Promise<THREE.Texture>
) => {
	const textureCache = new Map<string, THREE.Material>();

	const resolveMaterial = async (textureName: string) => {
		const cacheKey = textureName;
		const cached = textureCache.get(cacheKey);
		if (cached) return cached;

		const texture = await loadTexture(textureName);
		const material = createTextureMaterial(texture);
		textureCache.set(cacheKey, material);
		return material;
	};

	const variants = getBlockVariants(block);

	return await Promise.all(
		variants.map(async variant => {
			const group = new THREE.Group();

			for (const meshDef of variant) {
				const geometry = createQuadGeometry(meshDef);
				const material = await resolveMaterial(meshDef.texture);
				const mesh = new THREE.Mesh(geometry, material);
				group.add(mesh);
			}

			return group;
		})
	);
};
