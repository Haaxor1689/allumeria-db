import * as THREE from 'three';

import blockModels from '#data/block_models.json';

type Vec2 = [number, number];
type Vec3 = [number, number, number];
type Mat4 = [
	[number, number, number, number],
	[number, number, number, number],
	[number, number, number, number],
	[number, number, number, number]
];

type Block = {
	id: string;
	textures?: string[];
	blockModel?: string;
};

type CuboidMesh = {
	type: 'cuboid';
	min: Vec3;
	max: Vec3;
	textureIndices: number[];
	uvOffsets?: [Vec2, Vec2, Vec2, Vec2, Vec2, Vec2];
	matrix?: Mat4;
};

type QuadMesh = {
	type: 'quad';
	vertices: [Vec3, Vec3, Vec3, Vec3];
	textureIndex?: number;
	uvs?: [number, number, number, number];
	matrix?: Mat4;
};

type MeshDef = CuboidMesh | QuadMesh;

const defaultBlockMesh = [
	{ type: 'cuboid', min: [0, 0, 0], max: [1, 1, 1] }
] as const;

const createTextureMaterial = (texture: THREE.Texture, doubleSided?: boolean) =>
	new THREE.MeshBasicMaterial({
		map: texture,
		transparent: true,
		alphaTest: 0.01,
		side: doubleSided ? THREE.DoubleSide : THREE.FrontSide
	});

const createCuboidGeometry = (cuboid: CuboidMesh): THREE.BufferGeometry => {
	const [minX, minY, minZ] = cuboid.min;
	const [maxX, maxY, maxZ] = cuboid.max;

	const positions: number[] = [];
	const uvs: number[] = [];
	const indices: number[] = [];
	const geometry = new THREE.BufferGeometry();

	let vertexOffset = 0;
	let indexOffset = 0;

	const getFaceOffset = (faceIndex: number): Vec2 => {
		const offset = cuboid.uvOffsets?.[faceIndex] ?? [0, 0];
		return [offset[0] / 16, offset[1] / 16];
	};

	const projectAxisToUv = ({
		value,
		min,
		max,
		offset,
		reverse = false
	}: {
		value: number;
		min: number;
		max: number;
		offset: number;
		reverse?: boolean;
	}): number => {
		// Game UV offsets are authored against 16px-per-block coordinates. When a
		// sampled face axis spans more than one block (paintings), exported mesh
		// coordinates can exceed [0, 1] and need this span compensation to match
		// in-game sampling.
		const spanCompensation = Math.max(0, max - min - 1);

		if (reverse) {
			return 1 - value - offset + spanCompensation;
		}

		return value + offset + spanCompensation;
	};

	const pushFace = (
		vertices: [Vec3, Vec3, Vec3, Vec3],
		uvForVertex: (vertex: Vec3) => [number, number],
		expectedNormal: Vec3,
		faceIndex: number
	) => {
		for (const vertex of vertices) {
			positions.push(vertex[0], vertex[1], vertex[2]);
			const [u, v] = uvForVertex(vertex);
			uvs.push(u, v);
		}

		const [v0, v1, v2] = vertices;
		const ax = v1[0] - v0[0];
		const ay = v1[1] - v0[1];
		const az = v1[2] - v0[2];
		const bx = v2[0] - v0[0];
		const by = v2[1] - v0[1];
		const bz = v2[2] - v0[2];
		const nx = ay * bz - az * by;
		const ny = az * bx - ax * bz;
		const nz = ax * by - ay * bx;
		const dot =
			nx * expectedNormal[0] + ny * expectedNormal[1] + nz * expectedNormal[2];

		if (dot >= 0) {
			indices.push(
				vertexOffset,
				vertexOffset + 1,
				vertexOffset + 2,
				vertexOffset,
				vertexOffset + 2,
				vertexOffset + 3
			);
		} else {
			indices.push(
				vertexOffset,
				vertexOffset + 2,
				vertexOffset + 1,
				vertexOffset,
				vertexOffset + 3,
				vertexOffset + 2
			);
		}

		geometry.addGroup(indexOffset, 6, faceIndex);
		vertexOffset += 4;
		indexOffset += 6;
	};

	// Face order for textureIndices/uvOffsets: 0=+Y, 1=-Y, 2=+X, 3=-X, 4=+Z, 5=-Z
	pushFace(
		[
			[maxX, maxY, minZ],
			[maxX, maxY, maxZ],
			[minX, maxY, maxZ],
			[minX, maxY, minZ]
		],
		([x, , z]) => {
			const [offsetU, offsetV] = getFaceOffset(0);
			return [
				projectAxisToUv({
					value: x,
					min: minX,
					max: maxX,
					offset: offsetU,
					reverse: true
				}),
				projectAxisToUv({ value: z, min: minZ, max: maxZ, offset: offsetV })
			];
		},
		[0, 1, 0],
		0
	);

	pushFace(
		[
			[minX, minY, minZ],
			[minX, minY, maxZ],
			[maxX, minY, maxZ],
			[maxX, minY, minZ]
		],
		([x, , z]) => {
			const [offsetU, offsetV] = getFaceOffset(1);
			return [
				projectAxisToUv({ value: x, min: minX, max: maxX, offset: offsetU }),
				projectAxisToUv({ value: z, min: minZ, max: maxZ, offset: offsetV })
			];
		},
		[0, -1, 0],
		1
	);

	pushFace(
		[
			[maxX, minY, maxZ],
			[maxX, maxY, maxZ],
			[maxX, maxY, minZ],
			[maxX, minY, minZ]
		],
		([, y, z]) => {
			const [offsetU, offsetV] = getFaceOffset(2);
			return [
				projectAxisToUv({
					value: z,
					min: minZ,
					max: maxZ,
					offset: offsetU,
					reverse: true
				}),
				projectAxisToUv({ value: y, min: minY, max: maxY, offset: offsetV })
			];
		},
		[1, 0, 0],
		2
	);

	pushFace(
		[
			[minX, minY, minZ],
			[minX, maxY, minZ],
			[minX, maxY, maxZ],
			[minX, minY, maxZ]
		],
		([, y, z]) => {
			const [offsetU, offsetV] = getFaceOffset(3);
			return [
				projectAxisToUv({ value: z, min: minZ, max: maxZ, offset: offsetU }),
				projectAxisToUv({ value: y, min: minY, max: maxY, offset: offsetV })
			];
		},
		[-1, 0, 0],
		3
	);

	pushFace(
		[
			[minX, minY, maxZ],
			[minX, maxY, maxZ],
			[maxX, maxY, maxZ],
			[maxX, minY, maxZ]
		],
		([x, y]) => {
			const [offsetU, offsetV] = getFaceOffset(4);
			return [
				projectAxisToUv({ value: x, min: minX, max: maxX, offset: offsetU }),
				projectAxisToUv({ value: y, min: minY, max: maxY, offset: offsetV })
			];
		},
		[0, 0, 1],
		4
	);

	pushFace(
		[
			[maxX, minY, minZ],
			[maxX, maxY, minZ],
			[minX, maxY, minZ],
			[minX, minY, minZ]
		],
		([x, y]) => {
			const [offsetU, offsetV] = getFaceOffset(5);
			return [
				projectAxisToUv({
					value: x,
					min: minX,
					max: maxX,
					offset: offsetU,
					reverse: true
				}),
				projectAxisToUv({ value: y, min: minY, max: maxY, offset: offsetV })
			];
		},
		[0, 0, -1],
		5
	);

	geometry.setAttribute(
		'position',
		new THREE.Float32BufferAttribute(positions, 3)
	);
	geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	return geometry;
};

const createQuadGeometry = (quad: QuadMesh): THREE.BufferGeometry => {
	const geometry = new THREE.BufferGeometry();
	const positions = new Float32Array([
		...quad.vertices[0],
		...quad.vertices[1],
		...quad.vertices[2],
		...quad.vertices[3]
	]);
	const [u0, v0, u1, v1] = quad.uvs ?? [0, 0, 1, 1];
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
	geometry.setIndex([0, 1, 2, 0, 2, 3]);
	geometry.computeVertexNormals();
	return geometry;
};

const meshMatrixToThreeMatrix = (matrix: Mat4): THREE.Matrix4 =>
	new THREE.Matrix4()
		.set(
			matrix[0][0],
			matrix[0][1],
			matrix[0][2],
			matrix[0][3],
			matrix[1][0],
			matrix[1][1],
			matrix[1][2],
			matrix[1][3],
			matrix[2][0],
			matrix[2][1],
			matrix[2][2],
			matrix[2][3],
			matrix[3][0],
			matrix[3][1],
			matrix[3][2],
			matrix[3][3]
		)
		.transpose();

export const buildBlockGroup = async ({
	block,
	loadTexture
}: {
	block: Block;
	loadTexture: (name: string) => Promise<THREE.Texture>;
}) => {
	const textures = block.textures ?? [];
	const textureCache = new Map<string, THREE.Material>();

	const resolveMaterial = async (
		textureIndex: number,
		doubleSided?: boolean
	) => {
		const textureName = textures[textureIndex] ?? textures[0] ?? 'missing';
		const cacheKey = `${textureName}:${doubleSided ? 'double' : 'front'}`;
		const cached = textureCache.get(cacheKey);
		if (cached) return cached;

		const texture = await loadTexture(textureName);
		const material = createTextureMaterial(texture, doubleSided);
		textureCache.set(cacheKey, material);
		return material;
	};

	const meshes = (blockModels.find(m => m.id === block.blockModel)
		?.meshes as MeshDef[][]) ?? [defaultBlockMesh];

	return await Promise.all(
		meshes.map(async meshSet => {
			const group = new THREE.Group();

			for (const meshDef of meshSet) {
				if (meshDef.type === 'cuboid') {
					const geometry = createCuboidGeometry(meshDef);
					const faceTextures = meshDef.textureIndices ?? [0, 0, 0, 0, 0, 0];
					const materials = await Promise.all(
						[0, 1, 2, 3, 4, 5].map(faceIndex =>
							resolveMaterial(faceTextures[faceIndex] ?? 0)
						)
					);
					const mesh = new THREE.Mesh(geometry, materials);
					if (meshDef.matrix)
						mesh.applyMatrix4(meshMatrixToThreeMatrix(meshDef.matrix));
					group.add(mesh);
					continue;
				}

				const geometry = createQuadGeometry(meshDef);
				const material = await resolveMaterial(meshDef.textureIndex ?? 0, true);
				const mesh = new THREE.Mesh(geometry, material);
				if (meshDef.matrix)
					mesh.applyMatrix4(meshMatrixToThreeMatrix(meshDef.matrix));
				group.add(mesh);
			}

			return group;
		})
	);
};
