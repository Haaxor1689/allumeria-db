import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import sharp from 'sharp';
import * as THREE from 'three';

import blocks from '#data/blocks.json';
import entities from '#data/entities.json';

import { buildBlockGroup } from './blockRenderer.ts';
import { buildEntityGroup } from './entityRenderer.ts';
import {
	createNodeThreeRenderer,
	type HeadlessGLContext
} from './node/renderer.ts';
import { createNodeTextureLoader } from './node/textureLoader.ts';

const createNodeAssetTextureLoader = (textureRootDir: string) => {
	const cache = new Map<string, Promise<THREE.Texture>>();

	return async (textureRef: string) => {
		const cached = cache.get(textureRef);
		if (cached) return await cached;

		const pending = (async () => {
			const raw = await readFile(
				resolve(textureRootDir, `${textureRef.replace('.', '/')}.webp`)
			);
			const image = sharp(raw);
			const metadata = await image.metadata();

			if (!metadata.width || !metadata.height) {
				throw new Error(
					`Texture ${textureRef} is missing width or height metadata`
				);
			}

			const rgba = await image.ensureAlpha().raw().toBuffer();
			const texture = new THREE.DataTexture(
				rgba,
				metadata.width,
				metadata.height,
				THREE.RGBAFormat,
				THREE.UnsignedByteType
			);

			texture.flipY = true;
			texture.needsUpdate = true;
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

const createNodeModelLoader = (modelRootDir: string) => {
	const cache = new Map<string, Promise<any>>();

	return async (modelRef: string) => {
		const cached = cache.get(modelRef);
		if (cached) return await cached;

		const pending = (async () => {
			const raw = await readFile(
				resolve(modelRootDir, `${modelRef.replace('.', '/')}.json`)
			);
			return JSON.parse(raw.toString('utf8'));
		})();

		cache.set(modelRef, pending);
		return await pending;
	};
};
type FitCameraOptions = {
	camera: THREE.OrthographicCamera;
	object: THREE.Object3D;
	aspect: number;
	padding?: number;
	pitch?: number;
	yaw?: number;
};

const fitCameraToObject = ({
	camera,
	object,
	aspect,
	padding = 0.6,
	pitch = 25,
	yaw = 30
}: FitCameraOptions) => {
	const bounds = new THREE.Box3().setFromObject(object);
	const size = bounds.getSize(new THREE.Vector3());
	const center = bounds.getCenter(new THREE.Vector3());

	object.position.sub(center);

	const maxDim = Math.max(size.x, size.y, size.z, 1);
	const paddedDim = maxDim * (1 + Math.max(-0.95, padding));
	const halfFrustumHeight = Math.max(0.01, paddedDim / 2);
	const halfFrustumWidth = Math.max(0.01, halfFrustumHeight * aspect);
	const distance = Math.max(paddedDim * 2, 5);
	const pitchRadians = THREE.MathUtils.degToRad(pitch);
	const yawRadians = THREE.MathUtils.degToRad(yaw);
	camera.left = -halfFrustumWidth;
	camera.right = halfFrustumWidth;
	camera.top = halfFrustumHeight;
	camera.bottom = -halfFrustumHeight;
	camera.near = 0.01;
	camera.far = Math.max(100, distance * 10);
	camera.position.set(
		Math.sin(yawRadians) * Math.cos(pitchRadians) * distance,
		Math.sin(pitchRadians) * distance,
		-Math.cos(yawRadians) * Math.cos(pitchRadians) * distance
	);
	camera.lookAt(0, 0, 0);
	camera.updateProjectionMatrix();
};

const renderToFile = async (
	gl: HeadlessGLContext,
	width: number,
	height: number,
	outputPath: string
) => {
	const pixels = new Uint8Array(width * height * 4);
	gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

	const imageBuffer = await sharp(pixels, {
		raw: { width, height, channels: 4 }
	})
		.flip()
		.webp({ quality: 90, effort: 5 })
		.toBuffer();

	await writeFile(outputPath, imageBuffer);
};

type PrerenderBlocksOptions = {
	textureDir?: string;
	outputDir?: string;
	onlyBlockId?: string;
	width?: number;
	height?: number;
};

export const prerenderBlockPreviews = async ({
	textureDir = resolve(process.cwd(), 'public/assets/blocks'),
	outputDir = resolve(process.cwd(), 'public/previews/blocks'),
	onlyBlockId,
	width = 96,
	height = 96
}: PrerenderBlocksOptions = {}) => {
	const loadTexture = createNodeTextureLoader(textureDir);
	const halfHeight = 1;
	const halfWidth = halfHeight * (width / height);
	const camera = new THREE.OrthographicCamera(
		-halfWidth,
		halfWidth,
		halfHeight,
		-halfHeight,
		0.1,
		100
	);
	const aspect = width / height;
	const { renderer, glContext } = createNodeThreeRenderer({ width, height });
	const scene = new THREE.Scene();

	await mkdir(outputDir, { recursive: true });

	for (const block of [
		{ id: 'missing', blockModel: undefined, textures: ['missing'] },
		...blocks
	].filter(
		b => !!b.textures?.length && (!onlyBlockId || b.id === onlyBlockId)
	)) {
		const groups = await buildBlockGroup({
			model: block.blockModel,
			textures: block.textures,
			loadTexture
		});
		for (const [idx, group] of groups.entries()) {
			scene.add(group);

			fitCameraToObject({ camera, object: group, aspect });

			renderer.render(scene, camera);

			await renderToFile(
				glContext,
				width,
				height,
				resolve(outputDir, `${block.id}${idx ? `_${idx}` : ''}.webp`)
			);

			console.log(`Rendered block ${block.id}${idx ? `_${idx}` : ''}`);

			scene.remove(group);
			group.traverse(object => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
					if (Array.isArray(object.material)) {
						for (const material of object.material) material.dispose();
					} else {
						object.material.dispose();
					}
				}
			});
		}
	}

	try {
		renderer.dispose();
	} catch {
		// headless-gl under Node does not expose browser animation APIs used by dispose
	}
};

type PrerenderEntityLikeOptions = {
	outputDir?: string;
	modelDir?: string;
	textureDir?: string;
	width?: number;
	height?: number;
};

export const prerenderModelPreviews = async ({
	outputDir = resolve(process.cwd(), 'public/previews/entities'),
	modelDir = resolve(process.cwd(), 'public/assets/models'),
	textureDir = resolve(process.cwd(), 'public/assets/textures'),
	width = 208,
	height = 312
}: PrerenderEntityLikeOptions) => {
	const loadTexture = createNodeAssetTextureLoader(textureDir);
	const loadModel = createNodeModelLoader(modelDir);
	const halfHeight = 1;
	const halfWidth = halfHeight * (width / height);
	const camera = new THREE.OrthographicCamera(
		-halfWidth,
		halfWidth,
		halfHeight,
		-halfHeight,
		0.1,
		100
	);
	const aspect = width / height;
	const { renderer, glContext } = createNodeThreeRenderer({ width, height });
	const scene = new THREE.Scene();

	await mkdir(outputDir, { recursive: true });

	for (const entry of entities) {
		if (!entry.model || !entry.texture) {
			console.warn(`Skipping entity ${entry.id}: missing model or texture`);
			continue;
		}

		try {
			const groups = await buildEntityGroup({
				model: entry.model,
				texture: entry.texture,
				loadTexture,
				loadModel
			});

			for (const [idx, group] of groups.entries()) {
				scene.add(group);

				fitCameraToObject({ camera, object: group, aspect });

				renderer.render(scene, camera);

				await renderToFile(
					glContext,
					width,
					height,
					resolve(outputDir, `${entry.id}${idx ? `_${idx}` : ''}.webp`)
				);

				console.log(`Rendered entity ${entry.id}${idx ? `_${idx}` : ''}`);

				scene.remove(group);
				group.traverse(object => {
					if (object instanceof THREE.Mesh) {
						object.geometry.dispose();
						if (Array.isArray(object.material)) {
							for (const material of object.material) material.dispose();
						} else {
							object.material.dispose();
						}
					}
				});
			}
		} catch (err) {
			console.warn(
				`Skipping entity ${entry.id}: ${err instanceof Error ? err.message : String(err)}`
			);
		}
	}

	try {
		renderer.dispose();
	} catch {
		// headless-gl under Node does not expose browser animation APIs used by dispose
	}
};
