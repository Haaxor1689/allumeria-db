export const metadata = {
	title: 'Blocks'
};

const Page = () => (
	<section className="mx-auto flex w-full max-w-292 grow flex-col items-center justify-center gap-4 ns-dialog p-8 text-center">
		<img
			src="/assets/items/grass.webp"
			alt="Blocks"
			width={64}
			height={64}
			className="size-16"
		/>
		<h1 className="text-3xl font-bold pixel-shadow md:text-4xl">Blocks</h1>
		<p className="max-w-xl text-base text-muted">
			This page is coming soon. Block data and filters will be available here in
			a future update.
		</p>
	</section>
);

export default Page;
