import { type Metadata } from 'next';
import Link from 'next/link';

import Breadcrumbs from '#components/Breadcrumbs.tsx';
import summary from '#data/summary.json';

export const metadata: Metadata = {
	title: 'About the Allumeria Wiki & Database',
	description:
		'Learn how AllumeriaDB sources its game data, which Allumeria version it covers, who maintains the project, and how to report incorrect information.',
	alternates: { canonical: '/about' }
};

const generatedAt = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'medium',
	timeStyle: 'short',
	timeZone: 'UTC'
}).format(new Date(summary.generatedAtUtc));

const Page = () => (
	<>
		<Breadcrumbs
			items={[{ label: 'Home', href: '/' }, { label: 'About AllumeriaDB' }]}
			className="mx-auto -mb-6 w-full max-w-294"
		/>
		<div className="container mx-auto flex w-full max-w-294 flex-col gap-4">
			<section className="flex flex-col gap-4 ns-card p-5 md:p-8">
				<h1 className="text-3xl font-bold pixel-shadow md:text-4xl">
					About AllumeriaDB
				</h1>
				<p className="text-muted">
					AllumeriaDB is an unofficial, fan-made Allumeria wiki and game
					database. It provides searchable reference pages for items, blocks,
					creatures, effects and NPCs, including crafting recipes, loot sources
					and housing requirements.
				</p>
				<p className="text-muted">
					The project is maintained on GitHub in{' '}
					<a
						href="https://github.com/Haaxor1689/allumeria-db"
						className="text-aqua underline hocus:text-white"
					>
						Haaxor1689/allumeria-db
					</a>
					, where you can inspect the source and contribute improvements.
					AllumeriaDB is not affiliated with Infinimelon studio. All rights to
					Allumeria and its game assets belong to their respective owners.
				</p>
			</section>

			<section className="flex flex-col gap-4 ns-card p-5 md:p-8">
				<h2 className="text-2xl font-bold pixel-shadow">
					Data sources and accuracy
				</h2>
				<p className="text-muted">
					Game reference data is generated from Allumeria assets and source code
					using the{' '}
					<a
						href="https://github.com/Haaxor1689/allumeria-extractor"
						className="text-aqua underline hocus:text-white"
					>
						Allumeria extractor
					</a>
					. Display names and available descriptions come from the game&apos;s
					translations. Pages connect extracted records to show relationships
					such as crafting ingredients, drops and NPC shops.
				</p>
				<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
					<dt className="text-muted">Game version</dt>
					<dd className="font-semibold text-aqua">{summary.gameVersion}</dd>
					<dt className="text-muted">Data generated</dt>
					<dd>
						<time dateTime={summary.generatedAtUtc}>{generatedAt} UTC</time>
					</dd>
				</dl>
			</section>

			<section className="flex flex-col gap-4 ns-card p-5 md:p-8">
				<h2 className="text-2xl font-bold pixel-shadow">
					Report an error or contribute
				</h2>
				<p className="text-muted">
					Noticed a missing detail or something that looks off? Some information
					isn&apos;t supported by the extractor yet. Feel free to{' '}
					<a
						href="https://github.com/Haaxor1689/allumeria-db/issues/new"
						className="text-aqua underline hocus:text-white"
					>
						open a GitHub issue
					</a>{' '}
					and let us know what you&apos;d like to see or what needs fixing. Add
					a link to the page and what what info is missing or incorrect.
				</p>
				<p className="text-muted">
					Code and data-presentation improvements are welcome through pull
					requests to this project repository or the extractor repository.
				</p>
				<Link
					href="/"
					className="self-start text-aqua underline hocus:text-white"
				>
					Browse the Allumeria wiki and database
				</Link>
			</section>
		</div>
	</>
);

export default Page;
