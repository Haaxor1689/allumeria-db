import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import { getReadmeHeadings, getReadmeImages, resolveUrl } from './readme.ts';

const base = 'https://codeberg.org/owner/repo/raw/branch/main/';

void test('resolveUrl resolves relative paths and keeps absolute urls', () => {
	assert.equal(resolveUrl('docs/a.png', base), `${base}docs/a.png`);
	assert.equal(resolveUrl('./docs/a.png', base), `${base}docs/a.png`);
	assert.equal(resolveUrl('/docs/a.png', base), `${base}docs/a.png`);
	assert.equal(resolveUrl('https://x.y/a.png', base), 'https://x.y/a.png');
	assert.equal(resolveUrl('//x.y/a.png', base), '//x.y/a.png');
	assert.equal(resolveUrl('#section', base), '#section');
});

void test('getReadmeImages returns empty list without readme or images', () => {
	assert.deepEqual(getReadmeImages(null, base), []);
	assert.deepEqual(getReadmeImages('# Title\n\nJust text.', base), []);
});

void test('getReadmeImages collects markdown, reference and html images', () => {
	const readme = [
		'# Mod',
		'![First](docs/first.png "Title")',
		'Text with [![Linked](./second.gif)](https://example.com)',
		'<p align="center"><img src="third.webp" alt="Third" width="400"></p>',
		"<img alt='Fourth' src=fourth.jpg>",
		'![Fifth][shot]',
		'![shot]',
		'',
		'[shot]: images/fifth.png'
	].join('\n');

	assert.deepEqual(getReadmeImages(readme, base), [
		{ src: `${base}docs/first.png`, alt: 'First' },
		{ src: `${base}second.gif`, alt: 'Linked' },
		{ src: `${base}third.webp`, alt: 'Third' },
		{ src: `${base}fourth.jpg`, alt: 'Fourth' },
		{ src: `${base}images/fifth.png`, alt: 'Fifth' }
	]);
});

void test('getReadmeImages skips badges, svgs, code blocks and duplicates', () => {
	const readme = [
		'[![Build](https://img.shields.io/badge/build-passing-green)](https://ci)',
		'![Logo](logo.svg)',
		'![Shot](shot.png)',
		'![Shot again](./shot.png)',
		'```md',
		'![In code](code.png)',
		'```',
		'<img src="mailto:not-an-image">',
		'<img src="http://">'
	].join('\n');

	assert.deepEqual(getReadmeImages(readme, base), [
		{ src: `${base}shot.png`, alt: 'Shot' }
	]);
});

void test('getReadmeHeadings returns empty list without readme or headings', () => {
	assert.deepEqual(getReadmeHeadings(null), []);
	assert.deepEqual(getReadmeHeadings(''), []);
	assert.deepEqual(getReadmeHeadings('Just text.\n\n#notaheading'), []);
});

void test('getReadmeHeadings collects atx, setext and html headings in order', () => {
	const readme = [
		'Intro',
		'=====',
		'',
		'## Install ##',
		'',
		'<h3 align="center">Raw <em>html</em></h3>',
		'',
		'Usage',
		'-----',
		'',
		'   #### Indented',
		'',
		'###### Deep'
	].join('\r\n');

	assert.deepEqual(getReadmeHeadings(readme), [
		{ depth: 1, text: 'Intro', id: 'intro' },
		{ depth: 2, text: 'Install', id: 'install' },
		{ depth: 3, text: 'Raw html', id: 'raw-html' },
		{ depth: 2, text: 'Usage', id: 'usage' },
		{ depth: 4, text: 'Indented', id: 'indented' },
		{ depth: 6, text: 'Deep', id: 'deep' }
	]);
});

void test('getReadmeHeadings strips inline markdown and dedupes ids', () => {
	const readme = [
		'## [Linked](https://x.y) & `code` *em* __strong__ ~~gone~~ snake_case',
		'## ![icon](icon.png) Icon <!-- note --> &amp; A\\*B',
		'## Install',
		'## Install',
		'## ![only image](x.png)',
		'## Čeština / 日本語!'
	].join('\n');

	assert.deepEqual(getReadmeHeadings(readme), [
		{
			depth: 2,
			text: 'Linked & code em strong gone snake_case',
			id: 'linked--code-em-strong-gone-snake_case'
		},
		// Whitespace around removed constructs is kept in the id like rehype-slug does
		{ depth: 2, text: 'Icon & A*B', id: '-icon---ab' },
		{ depth: 2, text: 'Install', id: 'install' },
		{ depth: 2, text: 'Install', id: 'install-1' },
		{ depth: 2, text: 'Čeština / 日本語!', id: 'čeština--日本語' }
	]);
});

void test('getReadmeHeadings ignores code blocks, lists, tables and rules', () => {
	const readme = [
		'## Real',
		'',
		'```md',
		'## In fence',
		'```',
		'',
		'~~~',
		'# In tilde fence',
		'~~~',
		'',
		'- item',
		'- item',
		'---',
		'',
		'| a | b |',
		'|---|---|',
		'',
		'> ## Quoted',
		'',
		'Paragraph',
		'',
		'---'
	].join('\n');

	assert.deepEqual(getReadmeHeadings(readme), [
		{ depth: 2, text: 'Real', id: 'real' }
	]);
});

void test('getReadmeHeadings ids match the ones rendered by rehype-slug', () => {
	const readme = [
		'# Mod Title',
		'',
		'Intro',
		'=====',
		'',
		'## [Linked](https://x.y) & `code` *em* __strong__ ~~gone~~ snake_case',
		'## ![icon](icon.png) Icon <!-- note --> &amp; A\\*B',
		'## Install ##',
		'## Install',
		'<h3 align="center">Raw <em>html</em></h3>',
		'',
		'Usage',
		'-----',
		'',
		'###### Čeština / 日本語!',
		'',
		'```',
		'## In fence',
		'```'
	].join('\n');

	const html = renderToStaticMarkup(
		createElement(
			Markdown,
			{
				remarkPlugins: [remarkGfm],
				rehypePlugins: [rehypeRaw, rehypeSanitize, rehypeSlug]
			},
			readme
		)
	);
	const rendered = [...html.matchAll(/<h([1-6])\b[^>]*\bid="([^"]*)"/g)].map(
		m => ({
			depth: Number(m[1]),
			id: m[2]
		})
	);

	assert.deepEqual(
		getReadmeHeadings(readme).map(({ depth, id }) => ({ depth, id })),
		rendered
	);
	assert.equal(rendered.length, 9);
});
