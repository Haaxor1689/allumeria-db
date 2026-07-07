import './src/env.js';

/** @type {import("next").NextConfig} */
const config = {
	cacheComponents: true,
	reactCompiler: true,
	experimental: {
		optimizePackageImports: ['lucide-react']
	}
};

export default config;
