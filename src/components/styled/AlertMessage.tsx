import { type ReactNode } from 'react';

type Props = {
	children: ReactNode;
};

const AlertMessage = ({ children }: Props) => (
	<div className="flex gap-3 self-start bg-black/70 pr-3 text-lg font-bold">
		<div className="bg-alert px-4">!</div>
		<p>{children}</p>
	</div>
);

export default AlertMessage;
