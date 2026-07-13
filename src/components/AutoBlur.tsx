'use client';

import { useEffect } from 'react';

const allowedElements = ['INPUT', 'TEXTAREA'];

const AutoBlur = () => {
	useEffect(() => {
		const blurAfterInteraction = () => {
			// Defer blur so the current interaction can finish first.
			requestAnimationFrame(() => {
				if (allowedElements.includes(document.activeElement?.tagName ?? ''))
					return;
				if (document.activeElement instanceof HTMLElement) {
					document.activeElement.blur();
				}
			});
		};

		window.addEventListener('pointerup', blurAfterInteraction, true);
		return () => {
			window.removeEventListener('pointerup', blurAfterInteraction, true);
		};
	}, []);

	return null;
};

export default AutoBlur;
