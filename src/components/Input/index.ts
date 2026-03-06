/**
 * Input component type definitions.
 *
 * All form input components (TextInput, Checkbox, ColourPicker, Dropdown,
 * TimePicker) are implemented in Input.tsx and re-exported from there.
 * This file only contains the shared prop types so they can be imported
 * independently without pulling in the full component module.
 */
import type { InputHTMLAttributes } from "react";

export type TextInputProps = {
	placeholder?: string;
	label?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export type CheckboxProps = {
	checked?: boolean;
	onChange?: (checked: boolean) => void;
	label?: string;
	disabled?: boolean;
};

export type ColourPickerProps = {
	value?: string;
	onChange?: (value: string) => void;
	label?: string;
};

export type DropdownOption = {
	value: string;
	label: string;
};

export type DropdownProps = {
	options: DropdownOption[];
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	label?: string;
};

export type TimePickerProps = {
	value?: string;
	onChange?: (value: string) => void;
	label?: string;
	/** When true, display times in 24-hour format; otherwise use 12-hour a.m./p.m. */
	is24hr?: boolean;
};
