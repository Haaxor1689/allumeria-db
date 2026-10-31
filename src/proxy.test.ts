import assert from 'node:assert/strict';
import { test } from 'node:test';

import { NextRequest } from 'next/server';

import { proxy } from './proxy.ts';

const request = (path: string, userAgent = 'Googlebot') =>
	new NextRequest(new URL(path, 'https://example.com'), {
		headers: { 'user-agent': userAgent }
	});

void test('unknown detail IDs pass through to page-level notFound handling', () => {
	for (const category of ['items', 'blocks', 'creatures', 'effects', 'npcs']) {
		const response = proxy(request(`/${category}/does-not-exist`));
		assert.equal(response.headers.get('x-middleware-next'), '1');
		assert.equal(response.headers.get('x-middleware-rewrite'), null);
	}
});

void test('encoded valid IDs, trailing slashes and catalog queries are preserved', () => {
	for (const path of [
		'/items/%61gave',
		'/items/agave/',
		'/items?search=agave'
	]) {
		assert.equal(proxy(request(path)).status, 200);
	}
});

void test('Meta link previews are allowed while AI scraping remains blocked', () => {
	const preview = proxy(request('/items/agave', 'facebookexternalhit/1.1'));
	assert.equal(preview.status, 200);
	assert.equal(preview.headers.get('X-Robots-Tag'), 'noai, noimageai');
	for (const userAgent of ['meta-externalagent', 'GPTBot', 'ClaudeBot']) {
		assert.equal(proxy(request('/items/agave', userAgent)).status, 403);
	}
});
