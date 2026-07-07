'use client';

const ErrorPage = () => (
	<div className="flex grow flex-col justify-center gap-4 p-6 text-center">
		<h2 className="text-8xl font-bold">500</h2>
		<h3 className="text-4xl font-bold text-aqua pixel-shadow">
			Internal Server Error
		</h3>
		<p className="text-muted">
			Something went wrong on our end. Please try again later.
		</p>
	</div>
);

export default ErrorPage;
