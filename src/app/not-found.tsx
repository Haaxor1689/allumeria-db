import { type Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Page not found',
	robots: { index: false, follow: true }
};

const NotFound = () => (
	<div className="flex grow flex-col justify-center gap-4 p-6 text-center">
		<h2 className="text-8xl font-bold">404</h2>
		<h3 className="text-4xl font-bold text-aqua pixel-shadow">Not found</h3>
		<p className="text-muted">Make sure you have the correct URL</p>
	</div>
);

export default NotFound;
