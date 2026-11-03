'use client';

import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { type ReactNode, useId } from 'react';

const collapsedAtom = atomWithStorage('mods-install-collapsed', false);

const InstallSection = ({ children }: { children: ReactNode }) => {
	const [collapsed, setCollapsed] = useAtom(collapsedAtom);
	const contentId = useId();

	const toggleCollapsed = () => {
		try {
			setCollapsed(!collapsed);
		} catch (err) {
			console.error({
				source: 'Failed to save mod installation collapse state',
				error: err
			});
		}
	};

	return (
		<section className="flex flex-col gap-5 ns-card p-5 md:p-8">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex shrink flex-col gap-2">
					<p className="text-sm font-bold tracking-wider text-aqua uppercase">
						First time setup
					</p>
					<h2 className="text-2xl font-bold pixel-shadow md:text-3xl">
						How to install mods
					</h2>
				</div>
				<button
					type="button"
					aria-expanded={!collapsed}
					aria-controls={contentId}
					onClick={toggleCollapsed}
					className="cursor-pointer ns-btn px-3 font-bold pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover"
				>
					{collapsed ? 'Show instructions' : 'Hide instructions'}
				</button>
			</div>
			<div
				id={contentId}
				hidden={collapsed}
				className={collapsed ? 'hidden' : 'flex flex-col gap-5'}
			>
				{children}
			</div>
		</section>
	);
};

export default InstallSection;
