import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import sharp from 'sharp';
import * as THREE from 'three';

import blocks from '#data/blocks.json';

import { buildBlockGroup } from './blockRenderer.ts';
import {
	createNodeThreeRenderer,
	type HeadlessGLContext
} from './node/renderer.ts';
import { createNodeTextureLoader } from './node/textureLoader.ts';
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
	width = 256,
	height = 256
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
		{ id: 'missing', textures: ['missing'] },
		...blocks
	].filter(
		b => !!b.textures?.length && (!onlyBlockId || b.id === onlyBlockId)
	)) {
		const groups = await buildBlockGroup({ block, loadTexture });
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
