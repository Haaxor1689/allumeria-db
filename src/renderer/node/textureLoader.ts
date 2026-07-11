import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import sharp from 'sharp';
import * as THREE from 'three';

const resolveTexturePath = async (
	textureDir: string,
	textureFilename: string
) => {
	try {
		return await readFile(join(textureDir, `${textureFilename}.webp`));
	} catch {
		throw new Error(`Texture not found: ${textureFilename}`);
	}
};

export const createNodeTextureLoader = (textureDir: string) => {
	const cache = new Map<string, Promise<THREE.Texture>>();

	const loadTexture = async (
		textureFilename: string
	): Promise<THREE.Texture> => {
		const cached = cache.get(textureFilename);
		if (cached) return await cached;

		const pending = (async () => {
			let raw: Buffer;
			try {
				raw = await resolveTexturePath(textureDir, textureFilename);
			} catch (err) {
				if (textureFilename === 'missing') throw err;
				return await loadTexture('missing');
			}

			const image = sharp(raw);
			const metadata = await image.metadata();

			if (!metadata.width || !metadata.height) {
				throw new Error(
					`Texture ${textureFilename} is missing width or height metadata`
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

			// Sharp outputs rows from top-to-bottom; flip on upload to match GL UV convention.
			texture.flipY = true;
			texture.needsUpdate = true;
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(16 / metadata.width, 16 / metadata.height);
			texture.magFilter = THREE.NearestFilter;
			texture.minFilter = THREE.NearestFilter;
			texture.generateMipmaps = false;
			return texture;
		})();

		cache.set(textureFilename, pending);
		return await pending;
	};

	return loadTexture;
};
