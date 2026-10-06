type JsonLdProps = {
	data: Record<string, unknown> | Record<string, unknown>[];
};

const JsonLd = ({ data }: JsonLdProps) => (
	<script
		type="application/ld+json"
		dangerouslySetInnerHTML={{
			__html: JSON.stringify(data).replace(/</g, '\\u003c')
		}}
	/>
);

export default JsonLd;
