import { type MetadataRoute } from 'next';

import { env } from '#env.js';

const robots = (): MetadataRoute.Robots => ({
	rules: {
		userAgent: '*',
		allow: '/'
	},
	sitemap: new URL('/sitemap.xml', env.BASE_URL).toString()
});

export default robots;
