import GithubSlugger from 'github-slugger';

export type ReadmeImage = { src: string; alt: string };
export type ReadmeHeading = { depth: number; text: string; id: string };

// Resolves repository-relative URLs against a base, leaving absolute,
// protocol-relative and fragment URLs untouched
export const resolveUrl = (url: string, base: string) => {
	if (/^[a-z][a-z\d+.-]*:|^#|^\/\//i.test(url)) return url;
	return new URL(url.replace(/^\.?\//, ''), base).toString();
};

const BadgeHosts = [
	'img.shields.io',
	'shields.io',
	'badgen.net',
	'badge.fury.io'
];

const isPreviewImage = (src: string) => {
	try {
		const { protocol, hostname, pathname } = new URL(src);
		if (protocol !== 'http:' && protocol !== 'https:') return false;
		if (BadgeHosts.some(h => hostname === h || hostname.endsWith(`.${h}`)))
			return false;
		return !/\.svg$/i.test(pathname);
	} catch {
		return false;
	}
};

const getAttribute = (tag: string, name: string) =>
	new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
		.exec(tag)
		?.slice(1)
		.find(v => v !== undefined);

// Collects all images referenced in a markdown readme (markdown, reference
// style and raw html syntax) in document order, skipping badges and duplicates
export const getReadmeImages = (
	readme: string | null | undefined,
	imageBase: string
): ReadmeImage[] => {
	if (!readme) return [];

	const content = readme.replace(/(```|~~~)[\s\S]*?\1/g, '');

	const references = new Map<string, string>();
	for (const match of content.matchAll(
		/^[ \t]*\[([^\]]+)\]:[ \t]*<?(\S+?)>?(?:[ \t]+["'(].*)?$/gm
	))
		references.set(match[1]!.toLowerCase(), match[2]!);

	const found: { index: number; src: string; alt: string }[] = [];

	for (const match of content.matchAll(
		/!\[([^\]]*)\]\([ \t]*<?([^\s)>]+)>?[^)]*\)/g
	))
		found.push({ index: match.index, src: match[2]!, alt: match[1]! });

	for (const match of content.matchAll(/!\[([^\]]*)\][ \t]?\[([^\]]*)\]/g)) {
		// Collapsed references (`![alt][]`) use the alt text as the label
		const label = match[2] === '' ? match[1]! : match[2]!;
		const src = references.get(label.toLowerCase());
		if (src) found.push({ index: match.index, src, alt: match[1]! });
	}

	for (const match of content.matchAll(/<img\b[^>]*>/gi)) {
		const src = getAttribute(match[0], 'src');
		if (src)
			found.push({
				index: match.index,
				src,
				alt: getAttribute(match[0], 'alt') ?? ''
			});
	}

	const seen = new Set<string>();
	return found
		.toSorted((a, b) => a.index - b.index)
		.flatMap(({ src, alt }) => {
			let resolved: string;
			try {
				resolved = resolveUrl(src.trim(), imageBase);
			} catch {
				return [];
			}
			if (seen.has(resolved) || !isPreviewImage(resolved)) return [];
			seen.add(resolved);
			return [{ src: resolved, alt: alt.trim() }];
		});
};

const HtmlEntities: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' '
};

// Reduces inline markdown to the plain text the rendered heading will contain,
// matching what `rehype-slug` sees when it derives the heading id (whitespace
// left behind by removed constructs is intentionally kept)
const toHeadingText = (markdown: string) =>
	markdown
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/!\[[^\]]*\](?:\([^)]*\)|\[[^\]]*\])?/g, '')
		.replace(/\[([^\]]*)\](?:\([^)]*\)|\[[^\]]*\])/g, '$1')
		.replace(/(`+)(.+?)\1/g, '$2')
		.replace(/<[^>]+>/g, '')
		.replace(/(\*{1,3}|~~)(\S(?:.*?\S)?)\1/g, '$2')
		.replace(/(?<![\w\\])(_{1,3})(\S(?:.*?\S)?)\1(?!\w)/g, '$2')
		.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, '$1')
		.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
			if (entity[0] === '#') {
				const hex = entity[1] === 'x' || entity[1] === 'X';
				const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
				return Number.isNaN(code) ? match : String.fromCodePoint(code);
			}
			return HtmlEntities[entity.toLowerCase()] ?? match;
		});

// Collects all headings of a markdown readme (atx, setext and raw html syntax)
// in document order with ids matching the ones `rehype-slug` generates
export const getReadmeHeadings = (
	readme: string | null | undefined
): ReadmeHeading[] => {
	if (!readme) return [];

	const content = readme.replace(/(```|~~~)[\s\S]*?\1/g, '');

	const found: { index: number; depth: number; markdown: string }[] = [];

	for (const match of content.matchAll(
		/^[ \t]{0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*\r?$/gm
	))
		found.push({
			index: match.index,
			depth: match[1]!.length,
			markdown: match[2]!
		});

	// Setext headings are a paragraph line underlined with `=` or `-`; lines
	// that start another block (lists, quotes, tables, html, atx) don't count
	for (const match of content.matchAll(
		/^[ \t]{0,3}(?![#>|<]|(?:[-+*]|\d+[.)])[ \t])(\S[^\r\n]*?)[ \t]*\r?\n[ \t]{0,3}(=+|-+)[ \t]*\r?$/gm
	))
		found.push({
			index: match.index,
			depth: match[2]![0] === '=' ? 1 : 2,
			markdown: match[1]!
		});

	for (const match of content.matchAll(
		/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi
	))
		found.push({
			index: match.index,
			depth: Number(match[1]),
			markdown: match[2]!
		});

	const slugger = new GithubSlugger();
	return found
		.toSorted((a, b) => a.index - b.index)
		.flatMap(({ depth, markdown }) => {
			const raw = toHeadingText(markdown);
			const text = raw.replace(/\s+/g, ' ').trim();
			if (!text) return [];
			return [{ depth, text, id: slugger.slug(raw) }];
		});
};
