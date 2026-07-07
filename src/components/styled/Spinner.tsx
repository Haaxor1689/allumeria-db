import cn from 'classnames';
import { Loader2Icon } from 'lucide-react';

type Props = { className?: string };

const Spinner = ({ className, ...props }: Props) => (
	<Loader2Icon
		// oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
		role="status"
		aria-label="Loading"
		className={cn('animate-spin', className)}
		{...props}
	/>
);

export default Spinner;
