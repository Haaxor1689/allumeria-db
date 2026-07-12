'use client';

import { Select as SelectPrimitive } from '@base-ui/react/select';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { type ReactNode } from 'react';

type Props<Value> = {
	label?: string;
	value?: Value | null;
	onChange?: (value: Value | null) => void;
	options: Value[];
	getKey: (option: Value) => string;
	getLabel: (option: Value) => ReactNode;
};

const Select = <Value,>({
	label,
	value,
	onChange,
	options,
	getKey,
	getLabel
}: Props<Value>) => (
	<SelectPrimitive.Root
		value={value}
		onValueChange={onChange}
		items={options as never}
	>
		<SelectPrimitive.Trigger className="flex cursor-pointer items-center gap-1 ns-btn-purple pl-2 font-bold select-none pixel-shadow active:ns-btn-pressed hocus:ns-btn-hover">
			{label && <span>{label}:</span>}
			<SelectPrimitive.Value
				render={value ? <span>{getLabel(value)}</span> : undefined}
			/>
			<SelectPrimitive.Icon>
				<ChevronDown />
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>

		<SelectPrimitive.Portal>
			<SelectPrimitive.Positioner
				alignItemWithTrigger={false}
				sideOffset={4}
				className="z-1100 select-none"
			>
				<SelectPrimitive.Popup className="ns-borderless-btn-dark">
					<SelectPrimitive.ScrollUpArrow className="top-0 z-1 flex w-full justify-center">
						<ChevronUp />
					</SelectPrimitive.ScrollUpArrow>
					<SelectPrimitive.List className="relative max-h-(--available-height) overflow-y-auto">
						{options.map(option => (
							<SelectPrimitive.Item
								key={getKey(option)}
								value={getKey(option)}
								className="cursor-pointer transparent-btn px-2 active:ns-btn-pressed data-highlighted:ns-btn-hover data-selected:ns-btn-active"
							>
								<SelectPrimitive.ItemText>
									{getLabel(option)}
								</SelectPrimitive.ItemText>
							</SelectPrimitive.Item>
						))}
					</SelectPrimitive.List>
					<SelectPrimitive.ScrollDownArrow className="bottom-0 z-1 flex w-full justify-center">
						<ChevronDown />
					</SelectPrimitive.ScrollDownArrow>
				</SelectPrimitive.Popup>
			</SelectPrimitive.Positioner>
		</SelectPrimitive.Portal>
	</SelectPrimitive.Root>
);

export default Select;
