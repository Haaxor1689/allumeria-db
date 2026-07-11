declare module 'gl' {
	type ContextAttributes = {
		alpha?: boolean;
		depth?: boolean;
		stencil?: boolean;
		antialias?: boolean;
		premultipliedAlpha?: boolean;
		preserveDrawingBuffer?: boolean;
		preferLowPowerToHighPerformance?: boolean;
		failIfMajorPerformanceCaveat?: boolean;
	};

	type HeadlessContext = {
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

	export default function createGL(
		width: number,
		height: number,
		options?: ContextAttributes
	): HeadlessContext;
}
