import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout } from 'node:timers/promises';

import * as THREE from 'three';

import blocks from '#data/blocks.json';

import { buildBlockGroup, getBlockVariants } from './blockRenderer.ts';

void test('block textures overlap within a four-load cap and preserve mesh order', async () => {
	const block = blocks.find(block => block.id === 'bed')!;
	const variants = getBlockVariants(block);
	const textures = new Map<string, THREE.Texture>();
	let active = 0;
	let peak = 0;
	const groups = await buildBlockGroup(block, async name => {
		assert.ok(!textures.has(name), `duplicate load for ${name}`);
		const texture = new THREE.Texture();
		textures.set(name, texture);
		peak = Math.max(peak, ++active);
		await setTimeout(textures.size % 2 === 0 ? 5 : 10);
		active--;
		return texture;
	});

	assert.equal(peak, 4);
	assert.equal(active, 0);
	assert.equal(
		textures.size,
		new Set(variants.flatMap(variant => variant.map(mesh => mesh.texture))).size
	);
	assert.equal(groups.length, variants.length);
	for (const [index, variant] of variants.entries()) {
		const group = groups[index]!;
		assert.equal(group.children.length, variant.length);
		for (const [meshIndex, definition] of variant.entries()) {
			const mesh = group.children[meshIndex];
			assert.ok(mesh instanceof THREE.Mesh);
			assert.ok(mesh.material instanceof THREE.MeshBasicMaterial);
			assert.equal(mesh.material.map, textures.get(definition.texture));
			assert.deepEqual(
				mesh.geometry.getAttribute('position').array,
				new Float32Array(definition.vertices.flat())
			);
		}
	}
});

void test('variants sharing a texture also share one loaded material', async () => {
	const block = {
		id: 'shared-sign',
		class: 'Block',
		blockModel: 'sign',
		textures: Array.from({ length: 8 }, () => 'shared')
	};
	let calls = 0;
	const groups = await buildBlockGroup(block, async () => {
		calls++;
		await setTimeout(5);
		return new THREE.Texture();
	});
	assert.equal(calls, 1);
	const meshes = groups.flatMap(group => group.children);
	assert.ok(meshes.length > 1);
	const first = meshes[0];
	assert.ok(first instanceof THREE.Mesh);
	for (const mesh of meshes) {
		assert.ok(mesh instanceof THREE.Mesh);
		assert.equal(mesh.material, first.material);
	}
});

void test('texture errors reject the build and all started loads are observed', async () => {
	const block = blocks.find(block => block.id === 'bed')!;
	const error = new Error('Texture load failed');
	let calls = 0;
	let settled = 0;
	await assert.rejects(
		buildBlockGroup(block, async () => {
			calls++;
			await setTimeout(5);
			settled++;
			throw error;
		}),
		err => err === error
	);
	await setTimeout(10);
	assert.equal(calls, 4);
	assert.equal(settled, calls);
});

void test('a block with no meshes starts no texture loads', async () => {
	const groups = await buildBlockGroup(
		{ id: 'empty', class: 'Block', blockModel: 'not-a-model', textures: [] },
		async () => {
			assert.fail('No texture should be loaded');
		}
	);
	assert.deepEqual(groups, []);
});
