// Port of https://github.com/DarBarri/Allumeria-Skin-Converter

type Region = readonly [u: number, v: number, w: number, h: number];
type Face = 'top' | 'bottom' | 'right' | 'front' | 'left' | 'back';
type FaceLayout = Record<Face, Region>;

const McLayout = {
	head: {
		top: [8, 0, 8, 8],
		bottom: [16, 0, 8, 8],
		right: [0, 8, 8, 8],
		front: [8, 8, 8, 8],
		left: [16, 8, 8, 8],
		back: [24, 8, 8, 8]
	},
	head_overlay: {
		top: [40, 0, 8, 8],
		bottom: [48, 0, 8, 8],
		right: [32, 8, 8, 8],
		front: [40, 8, 8, 8],
		left: [48, 8, 8, 8],
		back: [56, 8, 8, 8]
	},
	body: {
		top: [20, 16, 8, 4],
		bottom: [28, 16, 8, 4],
		right: [16, 20, 4, 12],
		front: [20, 20, 8, 12],
		left: [28, 20, 4, 12],
		back: [32, 20, 8, 12]
	},
	arm_r: {
		top: [44, 16, 4, 4],
		bottom: [48, 16, 4, 4],
		left: [40, 20, 4, 12],
		front: [44, 20, 4, 12],
		right: [48, 20, 4, 12],
		back: [52, 20, 4, 12]
	},
	arm_l: {
		top: [36, 48, 4, 4],
		bottom: [40, 48, 4, 4],
		left: [32, 52, 4, 12],
		front: [36, 52, 4, 12],
		right: [40, 52, 4, 12],
		back: [44, 52, 4, 12]
	},
	leg_r: {
		top: [4, 16, 4, 4],
		bottom: [8, 16, 4, 4],
		left: [0, 20, 4, 12],
		front: [4, 20, 4, 12],
		right: [8, 20, 4, 12],
		back: [12, 20, 4, 12]
	},
	leg_l: {
		top: [20, 48, 4, 4],
		bottom: [24, 48, 4, 4],
		left: [16, 52, 4, 12],
		front: [20, 52, 4, 12],
		right: [24, 52, 4, 12],
		back: [28, 52, 4, 12]
	}
} satisfies Record<string, FaceLayout>;

type McPart = keyof typeof McLayout;

const SlimArmsLayout = {
	arm_r: {
		top: [44, 16, 3, 4],
		bottom: [47, 16, 3, 4],
		left: [40, 20, 4, 12],
		front: [44, 20, 3, 12],
		right: [47, 20, 4, 12],
		back: [51, 20, 3, 12]
	},
	arm_l: {
		top: [36, 48, 3, 4],
		bottom: [39, 48, 3, 4],
		left: [32, 52, 4, 12],
		front: [36, 52, 3, 12],
		right: [39, 52, 4, 12],
		back: [43, 52, 3, 12]
	}
} satisfies Partial<Record<McPart, FaceLayout>>;

const DirectFaces: Record<Face, Face> = {
	top: 'top',
	bottom: 'bottom',
	right: 'right',
	front: 'front',
	left: 'left',
	back: 'back'
};

// Left and right are swapped for limbs to correct mirroring
const LimbFaces: Record<Face, Face> = {
	...DirectFaces,
	right: 'left',
	left: 'right'
};

const AllumeriaParts: {
	uv: [u: number, v: number];
	size: [w: number, h: number, d: number];
	source: McPart;
	faces: Record<Face, Face>;
	isArm?: boolean;
}[] = [
	{ uv: [0, 0], size: [6, 6, 6], source: 'head', faces: DirectFaces },
	{ uv: [0, 30], size: [7, 7, 7], source: 'head_overlay', faces: DirectFaces },
	{ uv: [0, 12], size: [6, 11, 3], source: 'body', faces: DirectFaces },
	{
		uv: [52, 49],
		size: [3, 12, 3],
		source: 'arm_l',
		faces: LimbFaces,
		isArm: true
	},
	{
		uv: [40, 49],
		size: [3, 12, 3],
		source: 'arm_r',
		faces: LimbFaces,
		isArm: true
	},
	{ uv: [12, 49], size: [3, 12, 3], source: 'leg_l', faces: LimbFaces },
	{ uv: [0, 49], size: [3, 12, 3], source: 'leg_r', faces: LimbFaces }
];

const NeckCube = { uv: [0, 26], size: [4, 1, 3] } as const;

const cubeFaces = (
	[u, v]: readonly [number, number],
	[w, h, d]: readonly [number, number, number]
): FaceLayout => ({
	top: [u + d, v, w, d],
	bottom: [u + d + w, v, w, d],
	right: [u, v + d, d, h],
	front: [u + d, v + d, w, h],
	left: [u + d + w, v + d, d, h],
	back: [u + 2 * d + w, v + d, w, h]
});

// Legacy (pre-1.8) 64x32 skins: left limbs are mirrored copies of the right ones
const LegacyLimbCopies: [
	sx: number,
	sy: number,
	w: number,
	h: number,
	dx: number,
	dy: number
][] = [
	// leg
	[4, 16, 4, 4, 20, 48],
	[8, 16, 4, 4, 24, 48],
	[0, 20, 4, 12, 24, 52],
	[4, 20, 4, 12, 20, 52],
	[8, 20, 4, 12, 16, 52],
	[12, 20, 4, 12, 28, 52],
	// arm
	[44, 16, 4, 4, 36, 48],
	[48, 16, 4, 4, 40, 48],
	[40, 20, 4, 12, 40, 52],
	[44, 20, 4, 12, 36, 52],
	[48, 20, 4, 12, 32, 52],
	[52, 20, 4, 12, 44, 52]
];

// Minecraft treats a fully opaque legacy hat layer as transparent
const clearOpaqueHat = (ctx: CanvasRenderingContext2D) => {
	const hat = ctx.getImageData(32, 0, 32, 16);
	for (let i = 3; i < hat.data.length; i += 4) {
		if (hat.data[i]! < 128) return;
	}
	ctx.clearRect(32, 0, 32, 16);
};

const normalizeSkin = (source: HTMLImageElement) => {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
	ctx.imageSmoothingEnabled = false;

	const isLegacy = source.naturalWidth === source.naturalHeight * 2;
	if (!isLegacy) {
		ctx.drawImage(source, 0, 0, 64, 64);
		return canvas;
	}

	ctx.drawImage(source, 0, 0, 64, 32);
	for (const [sx, sy, w, h, dx, dy] of LegacyLimbCopies) {
		ctx.save();
		ctx.translate(dx + w, dy);
		ctx.scale(-1, 1);
		ctx.drawImage(canvas, sx, sy, w, h, 0, 0, w, h);
		ctx.restore();
	}
	clearOpaqueHat(ctx);
	return canvas;
};

export const convertSkin = (
	source: HTMLImageElement,
	{ slim = false, scale = 1 }: { slim?: boolean; scale?: number } = {}
) => {
	const input = normalizeSkin(source);

	const output = document.createElement('canvas');
	output.width = 64 * scale;
	output.height = 64 * scale;
	const ctx = output.getContext('2d')!;
	ctx.imageSmoothingEnabled = false;

	const layout: Record<McPart, FaceLayout> = slim
		? { ...McLayout, ...SlimArmsLayout }
		: McLayout;

	const paste = (
		[mu, mv, mw, mh]: Region,
		[au, av, aw, ah]: Region,
		rotate = false
	) => {
		const [x, y, w, h] = [au * scale, av * scale, aw * scale, ah * scale];
		ctx.clearRect(x, y, w, h);
		ctx.save();
		if (rotate) {
			ctx.translate(x + w, y + h);
			ctx.rotate(Math.PI);
			ctx.drawImage(input, mu, mv, mw, mh, 0, 0, w, h);
		} else {
			ctx.drawImage(input, mu, mv, mw, mh, x, y, w, h);
		}
		ctx.restore();
	};

	// Neck uses the top 1px row of the body
	const neck = cubeFaces(NeckCube.uv, NeckCube.size);
	paste([20, 20, 8, 1], neck.front);
	paste([32, 20, 8, 1], neck.back);
	paste([16, 20, 4, 1], neck.right);
	paste([28, 20, 4, 1], neck.left);
	paste([20, 16, 8, 1], neck.top);

	for (const part of AllumeriaParts) {
		const faces = cubeFaces(part.uv, part.size);
		for (const [allumFace, mcFace] of Object.entries(part.faces) as [
			Face,
			Face
		][]) {
			paste(
				layout[part.source][mcFace],
				faces[allumFace],
				part.isArm && allumFace === 'top'
			);
		}
	}

	return output;
};
