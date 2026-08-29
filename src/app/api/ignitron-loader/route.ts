export const GET = async () => {
	const owner = 'ignitron';
	const repo = 'ignitron';
	const assetName = 'Ignitron.Loader.zip';

	const res = await fetch(
		`https://codeberg.org/api/v1/repos/${owner}/${repo}/releases/latest`,
		{ cache: 'no-store' }
	);

	if (!res.ok)
		return new Response('Failed to fetch latest release from Codeberg', {
			status: 502
		});

	// oxlint-disable-next-line typescript/no-unsafe-assignment
	const json = await res.json();

	if (!json.tag_name)
		return new Response('Latest release missing tag_name', { status: 502 });

	// 302 = temporary redirect, but 307/308 also fine depending on needs
	return Response.redirect(
		`https://codeberg.org/${owner}/${repo}/releases/download/${json.tag_name}/${assetName}`,
		302
	);
};
