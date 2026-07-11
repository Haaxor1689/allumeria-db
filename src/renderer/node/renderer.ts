import createGL from 'gl';
import * as THREE from 'three';

export type HeadlessGLContext = {
	RGBA: number;
	UNSIGNED_BYTE: number;
	readPixels: (
		x: number,
		y: number,
		width: number,
		height: number,
		format: number,
		type: number,
		pixels: Uint8Array
	) => void;
	getExtension: (name: string) => unknown;
};

export type NodeRendererConfig = {
	width: number;
	height: number;
};

export const createNodeThreeRenderer = ({
	width,
	height
}: NodeRendererConfig): {
	renderer: THREE.WebGLRenderer;
	glContext: HeadlessGLContext;
} => {
	const gl = createGL(width, height, {
		preserveDrawingBuffer: true,
		alpha: true,
		antialias: true
	}) as unknown as HeadlessGLContext;

	const canvas = {
		width,
		height,
		style: {},
		addEventListener: () => {},
		removeEventListener: () => {},
		setAttribute: () => {},
		getContext: (contextType: string) => {
			if (contextType === 'webgl' || contextType === 'webgl2') {
				return gl;
			}
			return null;
		}
	} as unknown as HTMLCanvasElement;

	const renderer = new THREE.WebGLRenderer({
		canvas,
		context: gl as unknown as WebGLRenderingContext
	});

	renderer.setSize(width, height, false);
	renderer.setClearColor(0x000000, 0);

	return { renderer, glContext: gl };
};
