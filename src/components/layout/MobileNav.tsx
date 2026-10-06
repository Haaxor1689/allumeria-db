'use client';

import { type ReactNode } from 'react';

import Dialog from '#components/styled/Dialog.tsx';

const MobileNav = ({ children }: { children: ReactNode }) => (
	<Dialog
		trigger={open => (
			<button
				onClick={open}
				className="sticky bottom-2 -mt-12 cursor-pointer self-end ns-btn-dark active:ns-btn-pressed lg:hidden hocus:ns-btn-hover"
			>
				<img
					src="/assets/icons/icon_menu.webp"
					alt="Menu"
					className="size-11"
				/>
			</button>
		)}
	>
		{children}
	</Dialog>
);

export default MobileNav;
