import { type Metadata } from 'next';

import SearchResults from './SearchResults';

export const metadata: Metadata = {
	title: 'Search'
};

const Page = () => <SearchResults />;

export default Page;
