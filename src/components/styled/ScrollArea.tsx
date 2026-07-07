import { ScrollArea as Base } from '@base-ui/react/scroll-area';
import cls from 'classnames';

type Props = {
	ref?: React.RefObject<HTMLDivElement | null>;
	contentRef?: React.RefObject<HTMLDivElement | null>;
	offset?: number;
	containerClassName?: string;
	containerStyle?: React.CSSProperties;
	contentClassName?: string;
	showHorizontalScrollbar?: boolean;
	children: React.ReactNode;
};

const Scrollbar = ({
	offset,
	orientation
}: {
	offset?: number;
	orientation: 'vertical' | 'horizontal';
}) => (
	<Base.Scrollbar
		orientation={orientation}
		className="group/scrollbar ns-borderless-scroll-track opacity-0 group-hover/scroll:opacity-100"
		style={
			orientation === 'vertical'
				? { transform: `translateX(${offset ?? 0}px)` }
				: { transform: `translateY(${offset ?? 0}px)` }
		}
	>
		<Base.Thumb
			className={cls('cursor-pointer ns-scroll-thumb px-0.5 transition-colors')}
		/>
	</Base.Scrollbar>
);

const ScrollArea = ({
	ref,
	contentRef,
	children,
	offset,
	containerClassName,
	containerStyle,
	contentClassName,
	showHorizontalScrollbar = true
}: Props) => (
	<Base.Root
		className={cls('group/scroll flex shrink flex-col', containerClassName)}
		style={containerStyle}
	>
		<Base.Viewport className="shrink grow" ref={ref}>
			<Base.Content className={contentClassName} ref={contentRef}>
				{children}
			</Base.Content>
		</Base.Viewport>
		<Scrollbar offset={offset} orientation="vertical" />
		{showHorizontalScrollbar ? (
			<Scrollbar offset={offset} orientation="horizontal" />
		) : null}
		{showHorizontalScrollbar ? <Base.Corner /> : null}
	</Base.Root>
);

export default ScrollArea;
