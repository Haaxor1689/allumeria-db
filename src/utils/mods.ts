export const IgnitronLoaderDownload =
	'https://codeberg.org/ignitron/ignitron/releases/download/latest/Ignitron.Loader.zip';
export const DefaultModsFolder =
	'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Allumeria\\mods';

const ModRepositories = [
	'https://codeberg.org/Haaxor1689/settings-mod',
	'https://codeberg.org/Haaxor1689/ui-atlas-mod',
	'https://codeberg.org/Haaxor1689/stable-unknown-mod',
	'https://codeberg.org/Haaxor1689/shaping-extended-mod',
	'https://codeberg.org/Haaxor1689/master-palette-mod',
	'https://codeberg.org/Haaxor1689/cinematic-camera-mod',
	'https://codeberg.org/Haaxor1689/long-jump-mod',
	'https://codeberg.org/Haaxor1689/spawn-visualizer-mod',
	'https://codeberg.org/Haaxor1689/structure-builder-rebuilt-mod',
	'https://codeberg.org/Haaxor1689/datapacks-mod',
	'https://codeberg.org/Haaxor1689/Chart',
	'https://codeberg.org/ltdev/AlluSplitter'
];

export type ModRepository = {
	slug: string;
	owner: string;
	repo: string;
	url: string;
};

export type ReleaseAsset = {
	name: string;
	size: number;
	url: string;
};

const parseRepository = (url: string): ModRepository => {
	const [owner = '', repo = ''] = new URL(url).pathname.split('/').slice(1);
	return { slug: repo.toLowerCase(), owner, repo, url };
};

export const Mods: ModRepository[] = ModRepositories.map(parseRepository);

export const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	const units = ['KB', 'MB', 'GB'];
	let value = bytes / 1024;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
};

export const formatDate = (date: string) =>
	new Intl.DateTimeFormat('en-US', {
		dateStyle: 'medium',
		timeZone: 'UTC'
	}).format(new Date(date));
