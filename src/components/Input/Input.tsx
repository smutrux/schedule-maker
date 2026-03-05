import { useRef, useEffect, useState, useId } from "react";
import { createPortal } from "react-dom";
import { HexColorPicker, HexColorInput } from "react-colorful";

import type {
	TextInputProps,
	CheckboxProps,
	ColourPickerProps,
	TimePickerProps,
	DropdownProps,
	DropdownOption,
} from "./index";
import "./Input.css";

// ── Field wrapper (label + input) ─────────────────────────────────────────────
function Field({
	label,
	id,
	children,
}: {
	label?: string;
	id: string;
	children: React.ReactNode;
}) {
	if (!label) return <>{children}</>;
	return (
		<div className="input-field">
			<label className="input-label" htmlFor={id}>
				{label}
			</label>
			{children}
		</div>
	);
}

// ── Text Input ────────────────────────────────────────────────────────────────
export function TextInput({
	placeholder = "Placeholder",
	value: controlledValue,
	onChange,
	label,
	...props
}: TextInputProps) {
	const id = useId();
	const isControlled = controlledValue !== undefined;
	const [internalValue, setInternalValue] = useState("");
	const value = isControlled ? controlledValue : internalValue;

	return (
		<Field label={label} id={id}>
			<div className="input-wrapper">
				<input
					id={id}
					className="input-text"
					type="text"
					placeholder={placeholder}
					value={value}
					onChange={(e) => {
						if (!isControlled) setInternalValue(e.target.value);
						onChange?.(e);
					}}
					{...props}
				/>
			</div>
		</Field>
	);
}

// ── Checkbox ──────────────────────────────────────────────────────────────────
export function Checkbox({
	checked: controlledChecked,
	onChange,
	label,
	disabled = false,
}: CheckboxProps) {
	const id = useId();
	const isControlled = controlledChecked !== undefined;
	const [internalChecked, setInternalChecked] = useState(false);
	const checked = isControlled ? controlledChecked : internalChecked;

	function handleClick() {
		if (!isControlled) setInternalChecked((v) => !v);
		onChange?.(!checked);
	}

	return (
		<label
			className={`input-checkbox-label${disabled ? " input-checkbox-disabled" : ""}`}
			onClick={disabled ? undefined : handleClick}
		>
			<span className={`input-checkbox ${checked ? "checked" : ""}`}>
				{checked && (
					<svg
						viewBox="0 0 12 10"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M1 5L4.5 8.5L11 1.5"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				)}
			</span>
			{label && <span className="input-checkbox-text">{label}</span>}
		</label>
	);
}

// ── Colour Picker ─────────────────────────────────────────────────────────────
export function ColourPicker({
	value: controlledValue,
	onChange,
	label,
}: ColourPickerProps) {
	const id = useId();
	const [open, setOpen] = useState(false);
	const isControlled = controlledValue !== undefined;
	const [internalValue, setInternalValue] = useState("#6b93c4");
	const value = isControlled ? controlledValue! : internalValue;
	const swatchRef = useRef<HTMLDivElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const [popoverPos, setPopoverPos] = useState<{
		top: number;
		left: number;
	} | null>(null);
	const [portalTarget, setPortalTarget] = useState<Element>(document.body);

	function handleChange(hex: string) {
		if (!isControlled) setInternalValue(hex);
		onChange?.(hex);
	}

	function handleOpen() {
		if (open) {
			setOpen(false);
			return;
		}
		const rect = swatchRef.current?.getBoundingClientRect();
		if (rect) {
			setPopoverPos({
				top: rect.bottom + 8,
				left: rect.left,
			});
		}
		// Portal into the dialog if inside one, otherwise body
		const dialog = swatchRef.current?.closest("dialog");
		setPortalTarget(dialog ?? document.body);
		setOpen(true);
	}

	// Close on click outside both the trigger and the popover
	useEffect(() => {
		if (!open) return;
		function handleClick(e: MouseEvent) {
			if (
				swatchRef.current?.contains(e.target as Node) ||
				popoverRef.current?.contains(e.target as Node)
			)
				return;
			setOpen(false);
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [open]);

	return (
		<Field label={label} id={id}>
			{/* Swatch trigger */}
			<div
				ref={swatchRef}
				className="input-wrapper input-colour-wrapper"
				onClick={handleOpen}
			>
				<div
					className="colour-picker-swatch"
					style={{ backgroundColor: value }}
				/>
				<span className="colour-picker-hex-display">{value}</span>
			</div>

			{/* Floating picker portal — renders on body, above everything */}
			{open && popoverPos && createPortal(
    <div
        ref={popoverRef}
        className="colour-picker-popover"
        style={{ top: popoverPos.top, left: popoverPos.left }}
    >
        <HexColorPicker color={value} onChange={handleChange} />
        <HexColorInput
            className="colour-picker-hex-input"
            color={value}
            onChange={handleChange}
            prefixed
        />
    </div>,
    portalTarget
)}
		</Field>
	);
}

// ── Dropdown ──────────────────────────────────────────────────────────────────
export function Dropdown({
	options,
	value: controlledValue,
	onChange,
	placeholder = "Choose an option",
	label,
}: DropdownProps) {
	const id = useId();
	const isControlled = controlledValue !== undefined;
	const [internalValue, setInternalValue] = useState("");
	const value = isControlled ? controlledValue! : internalValue;

	function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
		if (!isControlled) setInternalValue(e.target.value);
		onChange?.(e.target.value);
	}

	return (
		<Field label={label} id={id}>
			<div className="input-wrapper input-select-wrapper">
				<select
					id={id}
					className={`input-select ${!value ? "placeholder" : ""}`}
					value={value}
					onChange={handleChange}
				>
					<option value="" disabled hidden>
						{placeholder}
					</option>
					{options.map((opt: DropdownOption) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
				<span className="input-select-chevron">
					<svg
						width="12"
						height="8"
						viewBox="0 0 12 8"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M1 1L6 7L11 1"
							stroke="currentColor"
							strokeWidth="1.8"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</span>
			</div>
		</Field>
	);
}

// ── Time Picker ───────────────────────────────────────────────────────────────
export function TimePicker({
	value: controlledValue,
	onChange,
	label,
	is24hr = false,
}: TimePickerProps) {
	const id = useId();
	const isControlled = controlledValue !== undefined;
	const [internalValue, setInternalValue] = useState("");
	const value = isControlled ? controlledValue! : internalValue;
	const inputRef = useRef<HTMLInputElement>(null);

	// Normalise whatever the browser gives us to "HH:MM" 24hr string
	function normalise(raw: string): string {
		if (!raw) return "";
		// Already "HH:MM" from a standard time input — just return it
		if (/^\d{1,2}:\d{2}$/.test(raw)) return raw.padStart(5, "0");
		return raw;
	}

	function formatDisplay(v: string): string | null {
		if (!v) return null;
		const [h, m] = v.split(":");
		const hour = parseInt(h, 10);
		if (isNaN(hour)) return null;
		if (is24hr) return `${String(hour).padStart(2, "0")}:${m}`;
		const suffix = hour >= 12 ? "p.m." : "a.m.";
		const display = hour % 12 === 0 ? 12 : hour % 12;
		return `${String(display).padStart(2, "0")}:${m} ${suffix}`;
	}

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const normalised = normalise(e.target.value);
		if (!isControlled) setInternalValue(normalised);
		onChange?.(normalised);
	}

	const display = formatDisplay(value);
	const placeholder = is24hr ? "08:00" : "08:00 a.m.";

	return (
		<Field label={label} id={id}>
			<div
				className="input-wrapper input-time-wrapper"
				onClick={() => inputRef.current?.showPicker?.()}
			>
				<span className="input-time-display">
					{display ?? <span className="input-placeholder">{placeholder}</span>}
				</span>
				<input
					ref={inputRef}
					id={id}
					type="time"
					value={value}
					onChange={handleChange}
					className="input-time-native"
				/>
			</div>
		</Field>
	);
}
