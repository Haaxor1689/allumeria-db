import * as THREE from 'three';

type Vec3 = [number, number, number];
type FaceKey = 'up' | 'down' | 'east' | 'west' | 'south' | 'north';

type BbFace = {
	uv?: [number, number, number, number];
	texture?: number | string;
	rotation?: number;
};

type BbMeshFace = {
	uv?: Record<string, [number, number]>;
	vertices?: string[];
	texture?: number | string;
};

type BbElement = {
	type?: string;
	from?: Vec3;
	to?: Vec3;
	origin?: Vec3;
	rotation?: Vec3;
	inflate?: number;
	faces?: Record<string, BbFace | BbMeshFace>;
	vertices?: Record<string, Vec3>;
};

type BbModel = {
	resolution?: {
		width?: number;
		height?: number;
	};
	elements?: BbElement[];
};

const MODEL_SCALE = 1 / 16;
const UV_INSET = 0;

const createTextureMaterial = (texture: THREE.Texture, doubleSided = false) =>
	new THREE.MeshBasicMaterial({
		map: texture,
		transparent: true,
		alphaTest: 0.01,
		side: doubleSided ? THREE.DoubleSide : THREE.FrontSide
	});

const parseTextureSlot = (texture?: number | string) => {
	if (typeof texture === 'number') return texture;
	if (typeof texture !== 'string') return 0;

	const normalized = texture.startsWith('#') ? texture.slice(1) : texture;
	const parsed = Number.parseInt(normalized, 10);
	return Number.isFinite(parsed) ? parsed : 0;
};

const rotateQuadUvs = (
	uvs: [[number, number], [number, number], [number, number], [number, number]],
	rotation = 0
) => {
	const turns = ((rotation % 360) + 360) % 360;
	const steps = Math.floor(turns / 90) % 4;
	for (let idx = 0; idx < steps; idx += 1) {
		uvs.unshift(uvs.pop() as [number, number]);
	}
	return uvs;
};

const uvRectToFaceUvs = ({
	uv,
	rotation,
	textureWidth,
	textureHeight
}: {
	uv: [number, number, number, number];
	rotation?: number;
	textureWidth: number;
	textureHeight: number;
}): [
	[number, number],
	[number, number],
	[number, number],
	[number, number]
] => {
	const [u0, v0, u1, v1] = uv;
	const left = u0 / textureWidth;
	const right = u1 / textureWidth;
	const top = 1 - v0 / textureHeight;
	const bottom = 1 - v1 / textureHeight;
	const insetLeft = left + UV_INSET;
	const insetRight = right - UV_INSET;
	const insetTop = top - UV_INSET;
	const insetBottom = bottom + UV_INSET;

	return rotateQuadUvs(
		[
			[insetRight, insetTop],
			[insetRight, insetBottom],
			[insetLeft, insetBottom],
			[insetLeft, insetTop]
		],
		rotation
	);
};

const insetFaceUvPoint = ({
	u,
	v,
	minU,
	maxU,
	minV,
	maxV
}: {
	u: number;
	v: number;
	minU: number;
	maxU: number;
	minV: number;
	maxV: number;
}) => {
	const insetMinU = minU + UV_INSET;
	const insetMaxU = maxU - UV_INSET;
	const insetMinV = minV + UV_INSET;
	const insetMaxV = maxV - UV_INSET;

	const safeU =
		insetMinU <= insetMaxU ? THREE.MathUtils.clamp(u, insetMinU, insetMaxU) : u;
	const safeV =
		insetMinV <= insetMaxV ? THREE.MathUtils.clamp(v, insetMinV, insetMaxV) : v;

	return [safeU, safeV] as const;
};

const createCubeGeometry = ({
	element,
	textureWidth,
	textureHeight,
	resolveMaterialIndex
}: {
	element: BbElement;
	textureWidth: number;
	textureHeight: number;
	resolveMaterialIndex: (textureSlot: number, doubleSided?: boolean) => number;
}): THREE.BufferGeometry | null => {
	if (!element.from || !element.to) return null;

	const inflate = element.inflate ?? 0;
	const minX =
		(Math.min(element.from[0], element.to[0]) - inflate) * MODEL_SCALE;
	const minY =
		(Math.min(element.from[1], element.to[1]) - inflate) * MODEL_SCALE;
	const minZ =
		(Math.min(element.from[2], element.to[2]) - inflate) * MODEL_SCALE;
	const maxX =
		(Math.max(element.from[0], element.to[0]) + inflate) * MODEL_SCALE;
	const maxY =
		(Math.max(element.from[1], element.to[1]) + inflate) * MODEL_SCALE;
	const maxZ =
		(Math.max(element.from[2], element.to[2]) + inflate) * MODEL_SCALE;

	const positions: number[] = [];
	const uvs: number[] = [];
	const indices: number[] = [];
	const geometry = new THREE.BufferGeometry();

	let vertexOffset = 0;
	let indexOffset = 0;

	const getCubeFace = (faceKey: FaceKey): BbFace | undefined => {
		const face = element.faces?.[faceKey];
		if (!face || !('uv' in face) || !Array.isArray(face.uv)) return undefined;
		return face as BbFace;
	};

	const pushFace = ({
		vertices,
		expectedNormal,
		face
	}: {
		vertices: [Vec3, Vec3, Vec3, Vec3];
		expectedNormal: Vec3;
		face?: BbFace;
	}) => {
		if (!face?.uv) return;

		const faceUvs = uvRectToFaceUvs({
			uv: face.uv,
			rotation: face.rotation,
			textureWidth,
			textureHeight
		});

		for (const [idx, vertex] of vertices.entries()) {
			positions.push(vertex[0], vertex[1], vertex[2]);
			const [u, v] = faceUvs[idx] ?? [0, 0];
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

		geometry.addGroup(
			indexOffset,
			6,
			resolveMaterialIndex(parseTextureSlot(face.texture), true)
		);
		vertexOffset += 4;
		indexOffset += 6;
	};

	pushFace({
		vertices: [
			[maxX, maxY, minZ],
			[maxX, maxY, maxZ],
			[minX, maxY, maxZ],
			[minX, maxY, minZ]
		],
		expectedNormal: [0, 1, 0],
		face: getCubeFace('up')
	});

	pushFace({
		vertices: [
			[minX, minY, maxZ],
			[minX, minY, minZ],
			[maxX, minY, minZ],
			[maxX, minY, maxZ]
		],
		expectedNormal: [0, -1, 0],
		face: getCubeFace('down')
	});

	pushFace({
		vertices: [
			[maxX, maxY, minZ],
			[maxX, minY, minZ],
			[maxX, minY, maxZ],
			[maxX, maxY, maxZ]
		],
		expectedNormal: [1, 0, 0],
		face: getCubeFace('east')
	});

	pushFace({
		vertices: [
			[minX, maxY, maxZ],
			[minX, minY, maxZ],
			[minX, minY, minZ],
			[minX, maxY, minZ]
		],
		expectedNormal: [-1, 0, 0],
		face: getCubeFace('west')
	});

	pushFace({
		vertices: [
			[maxX, maxY, maxZ],
			[maxX, minY, maxZ],
			[minX, minY, maxZ],
			[minX, maxY, maxZ]
		],
		expectedNormal: [0, 0, 1],
		face: getCubeFace('south')
	});

	pushFace({
		vertices: [
			[minX, maxY, minZ],
			[minX, minY, minZ],
			[maxX, minY, minZ],
			[maxX, maxY, minZ]
		],
		expectedNormal: [0, 0, -1],
		face: getCubeFace('north')
	});

	if (positions.length === 0) return null;

	geometry.setAttribute(
		'position',
		new THREE.Float32BufferAttribute(positions, 3)
	);
	geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	return geometry;
};

const createMeshGeometry = ({
	element,
	textureWidth,
	textureHeight,
	resolveMaterialIndex
}: {
	element: BbElement;
	textureWidth: number;
	textureHeight: number;
	resolveMaterialIndex: (textureSlot: number, doubleSided?: boolean) => number;
}): THREE.BufferGeometry | null => {
	if (!element.vertices || !element.faces) return null;
	const origin = element.origin ?? [0, 0, 0];

	const positions: number[] = [];
	const uvs: number[] = [];
	const indices: number[] = [];
	const geometry = new THREE.BufferGeometry();

	let vertexOffset = 0;
	let indexOffset = 0;

	for (const rawFace of Object.values(element.faces)) {
		if (!rawFace || !('vertices' in rawFace)) continue;
		const vertices = rawFace.vertices;
		if (!Array.isArray(vertices) || vertices.length < 3) continue;

		const meshFace = rawFace as BbMeshFace;
		const uvPoints = vertices.map(vertexName => {
			const uvPoint = meshFace.uv?.[vertexName] ?? [0, 0];
			return [
				uvPoint[0] / textureWidth,
				1 - uvPoint[1] / textureHeight
			] as const;
		});
		const uValues = uvPoints.map(point => point[0]);
		const vValues = uvPoints.map(point => point[1]);
		const minU = Math.min(...uValues);
		const maxU = Math.max(...uValues);
		const minV = Math.min(...vValues);
		const maxV = Math.max(...vValues);

		const startVertex = vertexOffset;
		for (const vertexName of vertices) {
			const vertex = element.vertices[vertexName];
			if (!vertex) continue;

			positions.push(
				(vertex[0] + origin[0]) * MODEL_SCALE,
				(vertex[1] + origin[1]) * MODEL_SCALE,
				(vertex[2] + origin[2]) * MODEL_SCALE
			);

			const uvPoint = meshFace.uv?.[vertexName] ?? [0, 0];
			const [u, v] = insetFaceUvPoint({
				u: uvPoint[0] / textureWidth,
				v: 1 - uvPoint[1] / textureHeight,
				minU,
				maxU,
				minV,
				maxV
			});
			uvs.push(u, v);
			vertexOffset += 1;
		}

		const faceVertexCount = vertexOffset - startVertex;
		if (faceVertexCount < 3) continue;

		const triangleCount = faceVertexCount - 2;
		for (let tri = 0; tri < triangleCount; tri += 1) {
			indices.push(startVertex, startVertex + tri + 1, startVertex + tri + 2);
		}

		geometry.addGroup(
			indexOffset,
			triangleCount * 3,
			resolveMaterialIndex(parseTextureSlot(meshFace.texture), true)
		);
		indexOffset += triangleCount * 3;
	}

	if (positions.length === 0 || indices.length === 0) return null;

	geometry.setAttribute(
		'position',
		new THREE.Float32BufferAttribute(positions, 3)
	);
	geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	return geometry;
};

const createBrowserTextureLoader = () => {
	const loader = new THREE.TextureLoader();
	const cache = new Map<string, Promise<THREE.Texture>>();

	return async (textureRef: string) => {
		const cached = cache.get(textureRef);
		if (cached) return await cached;

		const pending = (async () => {
			const texture = await loader.loadAsync(
				`/assets/textures/${textureRef.replace('.', '/')}.webp`
			);
			texture.wrapS = THREE.ClampToEdgeWrapping;
			texture.wrapT = THREE.ClampToEdgeWrapping;
			texture.magFilter = THREE.NearestFilter;
			texture.minFilter = THREE.NearestFilter;
			texture.generateMipmaps = false;
			return texture;
		})();

		cache.set(textureRef, pending);
		return await pending;
	};
};

const createBrowserModelLoader = () => {
	const cache = new Map<string, Promise<BbModel>>();

	return async (modelRef: string) => {
		const cached = cache.get(modelRef);
		if (cached) return await cached;

		const pending = (async () => {
			const response = await fetch(
				`/assets/models/${modelRef.replace('.', '/')}.json`
			);
			if (!response.ok) {
				throw new Error(
					`Failed to load model ${modelRef}: HTTP ${response.status}`
				);
			}
			return (await response.json()) as BbModel;
		})();

		cache.set(modelRef, pending);
		return await pending;
	};
};

export const buildEntityGroup = async ({
	model,
	texture,
	loadTexture = createBrowserTextureLoader(),
	loadModel = createBrowserModelLoader()
}: {
	model: string | string[];
	texture: string;
	loadTexture?: (name: string) => Promise<THREE.Texture>;
	loadModel?: (name: string) => Promise<BbModel>;
}) => {
	const textureCache = new Map<string, THREE.Material>();
	const textureBySlot = new Map<number, string>();
	const materials: THREE.Material[] = [];

	const resolveMaterial = async (textureRef: string, doubleSided = false) => {
		const materialCacheKey = `${textureRef}:${doubleSided ? 'double' : 'front'}`;
		const cached = textureCache.get(materialCacheKey);
		if (cached) return cached;

		const loadedTexture = await loadTexture(textureRef);
		const material = createTextureMaterial(loadedTexture, doubleSided);
		textureCache.set(materialCacheKey, material);
		return material;
	};

	const getTextureRefForSlot = (slot: number) => {
		const cached = textureBySlot.get(slot);
		if (cached) return cached;

		const resolved = texture;
		textureBySlot.set(slot, resolved);
		return resolved;
	};

	const materialIndexByTexture = new Map<string, number>();
	const resolveMaterialIndex = (textureSlot: number, doubleSided = false) => {
		const textureRef = getTextureRefForSlot(textureSlot);
		const materialKey = `${textureRef}:${doubleSided ? 'double' : 'front'}`;
		const existing = materialIndexByTexture.get(materialKey);
		if (existing !== undefined) return existing;

		const index = materials.length;
		materials.push(new THREE.MeshBasicMaterial());
		materialIndexByTexture.set(materialKey, index);
		return index;
	};

	const groups = [];
	for (const modelRef of Array.isArray(model) ? model : [model]) {
		const bbModel = await loadModel(modelRef);

		const resolutionWidth = Math.max(1, bbModel.resolution?.width ?? 16);
		const resolutionHeight = Math.max(1, bbModel.resolution?.height ?? 16);
		const group = new THREE.Group();

		for (const element of bbModel.elements ?? []) {
			const geometry =
				element.type === 'mesh'
					? createMeshGeometry({
							element,
							textureWidth: resolutionWidth,
							textureHeight: resolutionHeight,
							resolveMaterialIndex
						})
					: createCubeGeometry({
							element,
							textureWidth: resolutionWidth,
							textureHeight: resolutionHeight,
							resolveMaterialIndex
						});

			if (!geometry) continue;

			const mesh = new THREE.Mesh(geometry, materials);
			if (element.rotation && element.origin) {
				const pivot = new THREE.Vector3(
					element.origin[0] * MODEL_SCALE,
					element.origin[1] * MODEL_SCALE,
					element.origin[2] * MODEL_SCALE
				);
				const rotation = new THREE.Euler(
					THREE.MathUtils.degToRad(element.rotation[0]),
					THREE.MathUtils.degToRad(element.rotation[1]),
					THREE.MathUtils.degToRad(element.rotation[2]),
					'XYZ'
				);
				mesh.applyMatrix4(
					new THREE.Matrix4()
						.makeTranslation(pivot.x, pivot.y, pivot.z)
						.multiply(new THREE.Matrix4().makeRotationFromEuler(rotation))
						.multiply(
							new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z)
						)
				);
			}

			group.add(mesh);
		}

		await Promise.all(
			Array.from(materialIndexByTexture.entries()).map(
				async ([materialKey, index]) => {
					const separator = materialKey.lastIndexOf(':');
					const textureRef = materialKey.slice(0, separator);
					const sideVariant = materialKey.slice(separator + 1);
					const material = await resolveMaterial(
						textureRef,
						sideVariant === 'double'
					);
					materials[index] = material;
				}
			)
		);

		groups.push(group);
	}

	return groups;
};
