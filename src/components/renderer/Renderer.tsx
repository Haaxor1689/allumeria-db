'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import Button from '#components/styled/Button.tsx';

export type BuildGroupsOptions = {
	loadTexture: (textureName: string) => Promise<THREE.Texture>;
};

type Props = {
	buildGroups: (options: BuildGroupsOptions) => Promise<THREE.Group[]>;
	ariaLabel?: string;
	className?: string;
	showWireframeButton?: boolean;
	showVariantControls?: boolean;
	getVariantLabel?: (index: number, total: number) => string;
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

const disposeGroup = (group: THREE.Group) => {
	const textures = new Set<THREE.Texture>();

	group.traverse(object => {
		if (object instanceof THREE.LineSegments) {
			object.geometry.dispose();
			if (Array.isArray(object.material)) {
				for (const material of object.material) material.dispose();
			} else {
				object.material.dispose();
			}
			return;
		}

		if (!(object instanceof THREE.Mesh)) return;
		object.geometry.dispose();
		if (Array.isArray(object.material)) {
			for (const material of object.material) {
				if (material.map) textures.add(material.map);
				material.dispose();
			}
			return;
		}
		if (object.material.map) textures.add(object.material.map);
		object.material.dispose();
	});

	for (const texture of textures) texture.dispose();
};

const addWireframeOverlay = (group: THREE.Group) => {
	group.traverse(object => {
		if (!(object instanceof THREE.Mesh)) return;

		const wireframe = new THREE.LineSegments(
			new THREE.WireframeGeometry(object.geometry),
			new THREE.LineBasicMaterial({
				color: 0x3af2ff,
				transparent: true,
				opacity: 0.6,
				depthWrite: false,
				toneMapped: false
			})
		);

		wireframe.renderOrder = 2;
		object.add(wireframe);
	});
};

const setWireframeVisibility = (group: THREE.Group, visible: boolean) => {
	group.traverse(object => {
		if (object instanceof THREE.LineSegments) {
			object.visible = visible;
		}
	});
};

const createBrowserTextureLoader = () => {
	const loader = new THREE.TextureLoader();
	const cache = new Map<string, Promise<THREE.Texture>>();

	const loadTexture = async (textureName: string): Promise<THREE.Texture> => {
		const cached = cache.get(textureName);
		if (cached) return await cached;

		const pending = (async () => {
			try {
				const texture = await loader.loadAsync(
					`/assets/blocks/${textureName}.webp`
				);
				const image = texture.image as
					| { width?: number; height?: number }
					| undefined;
				const width = image?.width ?? 16;
				const height = image?.height ?? 16;

				texture.wrapS = THREE.RepeatWrapping;
				texture.wrapT = THREE.RepeatWrapping;
				texture.repeat.set(16 / width, 16 / height);
				texture.magFilter = THREE.NearestFilter;
				texture.minFilter = THREE.NearestFilter;
				texture.generateMipmaps = false;
				return texture;
			} catch {
				if (textureName === 'missing')
					throw new Error('Texture not found: missing');
				return await loadTexture('missing');
			}
		})();

		cache.set(textureName, pending);
		return await pending;
	};

	return loadTexture;
};

const Renderer = ({
	buildGroups,
	ariaLabel = 'Interactive preview',
	className = 'relative aspect-square w-full ns-slot',
	showWireframeButton = true,
	showVariantControls = true,
	getVariantLabel = (index: number) => `Variant ${index + 1}`
}: Props) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const groupsRef = useRef<THREE.Group[]>([]);
	const [groups, setGroups] = useState<THREE.Group[]>([]);
	const [currentMesh, setCurrentMesh] = useState(0);
	const [showWireframe, setShowWireframe] = useState(false);

	const zoomRef = useRef(1);
	const rotationXRef = useRef(0);
	const rotationYRef = useRef(0);
	const rotationRootRef = useRef<THREE.Group | null>(null);
	const activeGroupRef = useRef<THREE.Group | null>(null);
	const fitGroupCameraRef = useRef<((group: THREE.Group) => void) | null>(null);

	useEffect(() => {
		groupsRef.current = groups;
	}, [groups]);

	useEffect(() => {
		for (const group of groups) setWireframeVisibility(group, showWireframe);
	}, [groups, showWireframe]);

	useEffect(
		() => () => {
			for (const group of groupsRef.current) disposeGroup(group);
		},
		[]
	);

	useEffect(() => {
		let disposed = false;
		const loadTexture = createBrowserTextureLoader();
		zoomRef.current = 1;
		rotationXRef.current = 0;
		rotationYRef.current = 0;

		void buildGroups({ loadTexture }).then(nextGroups => {
			if (disposed) {
				for (const group of nextGroups) disposeGroup(group);
				return undefined;
			}

			for (const group of nextGroups) addWireframeOverlay(group);

			setGroups(currentGroups => {
				for (const group of currentGroups) disposeGroup(group);
				return nextGroups;
			});
			setCurrentMesh(0);
			return undefined;
		});

		return () => {
			disposed = true;
		};
	}, [buildGroups]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const container = containerRef.current;
		if (!canvas || !container || groups.length === 0) return;

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const initialGroup = groups[0]!;
		const initBounds = new THREE.Box3().setFromObject(initialGroup);
		initialGroup.position.sub(initBounds.getCenter(new THREE.Vector3()));

		const renderer = new THREE.WebGLRenderer({
			canvas,
			alpha: true,
			antialias: true,
			premultipliedAlpha: true
		});
		renderer.setClearColor(0x000000, 0);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

		const scene = new THREE.Scene();
		const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);

		const rotationRoot = new THREE.Group();
		rotationRoot.rotation.x = rotationXRef.current;
		rotationRoot.rotation.y = rotationYRef.current;
		rotationRoot.add(initialGroup);
		scene.add(rotationRoot);

		rotationRootRef.current = rotationRoot;
		activeGroupRef.current = initialGroup;

		fitGroupCameraRef.current = (group: THREE.Group) => {
			const width = container.clientWidth;
			const height = container.clientHeight;
			if (!width || !height) return;
			fitCameraToObject({ camera, object: group, aspect: width / height });
			camera.zoom = zoomRef.current;
			camera.updateProjectionMatrix();
		};

		const resize = () => {
			const width = container.clientWidth;
			const height = container.clientHeight;
			if (!width || !height) return;
			renderer.setSize(width, height, false);
			const group = activeGroupRef.current;
			if (!group) return;
			fitCameraToObject({ camera, object: group, aspect: width / height });
			camera.zoom = zoomRef.current;
			camera.updateProjectionMatrix();
		};

		resize();
		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(container);

		let animationFrameId = 0;
		let isDragging = false;
		let pointerId: number | null = null;
		let lastX = 0;
		let lastY = 0;

		const render = () => {
			renderer.render(scene, camera);
			animationFrameId = window.requestAnimationFrame(render);
		};

		const onPointerDown = (event: PointerEvent) => {
			isDragging = true;
			pointerId = event.pointerId;
			lastX = event.clientX;
			lastY = event.clientY;
			canvas.setPointerCapture(event.pointerId);
		};

		const onPointerMove = (event: PointerEvent) => {
			if (!isDragging || pointerId !== event.pointerId) return;
			const deltaX = event.clientX - lastX;
			const deltaY = event.clientY - lastY;
			lastX = event.clientX;
			lastY = event.clientY;

			rotationRoot.rotation.y += deltaX * 0.01;
			rotationRoot.rotation.x = THREE.MathUtils.clamp(
				rotationRoot.rotation.x - deltaY * 0.01,
				THREE.MathUtils.degToRad(-80),
				THREE.MathUtils.degToRad(80)
			);
			rotationYRef.current = rotationRoot.rotation.y;
			rotationXRef.current = rotationRoot.rotation.x;
		};

		const stopDragging = (event?: PointerEvent) => {
			if (
				event?.pointerId === pointerId &&
				canvas.hasPointerCapture(event.pointerId)
			) {
				canvas.releasePointerCapture(event.pointerId);
			}
			isDragging = false;
			pointerId = null;
		};

		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			const zoomFactor = Math.exp(-event.deltaY * 0.0015);
			const newZoom = THREE.MathUtils.clamp(
				zoomRef.current * zoomFactor,
				0.6,
				4
			);
			zoomRef.current = newZoom;
			camera.zoom = newZoom;
			camera.updateProjectionMatrix();
		};

		canvas.addEventListener('pointerdown', onPointerDown);
		canvas.addEventListener('pointermove', onPointerMove);
		canvas.addEventListener('pointerup', stopDragging);
		canvas.addEventListener('pointerleave', stopDragging);
		canvas.addEventListener('pointercancel', stopDragging);
		canvas.addEventListener('wheel', onWheel, { passive: false });

		render();

		return () => {
			window.cancelAnimationFrame(animationFrameId);
			resizeObserver.disconnect();
			canvas.removeEventListener('pointerdown', onPointerDown);
			canvas.removeEventListener('pointermove', onPointerMove);
			canvas.removeEventListener('pointerup', stopDragging);
			canvas.removeEventListener('pointerleave', stopDragging);
			canvas.removeEventListener('pointercancel', stopDragging);
			canvas.removeEventListener('wheel', onWheel);
			const groupToRemove = activeGroupRef.current;
			if (groupToRemove) rotationRoot.remove(groupToRemove);
			scene.remove(rotationRoot);
			renderer.dispose();
			rotationRootRef.current = null;
			activeGroupRef.current = null;
			fitGroupCameraRef.current = null;
		};
	}, [groups]);

	useEffect(() => {
		const rotationRoot = rotationRootRef.current;
		const prevGroup = activeGroupRef.current;
		const nextGroup = groups[currentMesh];

		if (!rotationRoot || !nextGroup || prevGroup === nextGroup) return;

		const initBounds = new THREE.Box3().setFromObject(nextGroup);
		nextGroup.position.sub(initBounds.getCenter(new THREE.Vector3()));

		if (prevGroup) rotationRoot.remove(prevGroup);
		rotationRoot.add(nextGroup);
		activeGroupRef.current = nextGroup;

		fitGroupCameraRef.current?.(nextGroup);
	}, [groups, currentMesh]);

	return (
		<div ref={containerRef} className={className}>
			{showWireframeButton && (
				<div className="absolute -top-2 -right-2 z-10 md:top-0 md:right-0">
					<Button
						variant={showWireframe ? 'positive' : 'negative'}
						onClick={() => setShowWireframe(v => !v)}
					>
						Wireframe
					</Button>
				</div>
			)}
			{showVariantControls && groups.length > 1 && (
				<div className="absolute -bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 text-white md:bottom-0">
					<Button
						variant="purple"
						onClick={() =>
							setCurrentMesh((currentMesh - 1 + groups.length) % groups.length)
						}
					>
						{'<'}
					</Button>
					<p className="text-xl font-bold select-none">
						{getVariantLabel(currentMesh, groups.length)}
					</p>
					<Button
						variant="purple"
						onClick={() => setCurrentMesh((currentMesh + 1) % groups.length)}
					>
						{'>'}
					</Button>
				</div>
			)}
			<canvas
				aria-label={ariaLabel}
				ref={canvasRef}
				className="block h-full w-full cursor-grab touch-none active:cursor-grabbing"
			/>
		</div>
	);
};

export default Renderer;
