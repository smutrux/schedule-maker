/**
 * Input.tsx
 *
 * Form input components, all supporting both controlled and uncontrolled usage:
 *
 *  TextInput     — single-line text field with optional label.
 *  Checkbox      — custom styled checkbox with optional label and disabled state.
 *  ColourPicker  — swatch trigger that opens a floating HexColorPicker popover
 *                  via a React portal (portals into the parent <dialog> when
 *                  inside a modal, otherwise into document.body).
 *  Dropdown      — styled <select> with chevron icon and placeholder support.
 *  TimePicker    — clickable display that delegates to a hidden native
 *                  <input type="time">; shows formatted 12h or 24h output.
 *
 * All components use the Field wrapper which renders an accessible <label>
 * when a `label` prop is provided.
 */
import { useRef, useEffect, useLayoutEffect, useState, useId } from "react";
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
	const [popoverReady, setPopoverReady] = useState(false);
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
		// Store the trigger rect so the layout effect can compute position after mount
		const rect = swatchRef.current?.getBoundingClientRect();
		if (rect) {
			// Tentatively centre below the swatch; clamped after mount in the effect
			setPopoverPos({
				top: rect.bottom + 8,
				left: rect.left + rect.width / 2 - 110, // 110 = half of 220px popover width
			});
		}
		setPopoverReady(false);
		// Portal into the dialog if inside one, otherwise body
		const dialog = swatchRef.current?.closest("dialog");
		setPortalTarget(dialog ?? document.body);
		setOpen(true);
	}

	// After the popover mounts, measure it and clamp so it never escapes the viewport
	useLayoutEffect(() => {
		if (!open || !popoverRef.current || !swatchRef.current) return;
		const pop = popoverRef.current.getBoundingClientRect();
		const swatch = swatchRef.current.getBoundingClientRect();
		const margin = 8;
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		let left = swatch.left + swatch.width / 2 - pop.width / 2;
		let top = swatch.bottom + margin;

		// Clamp horizontally
		left = Math.max(margin, Math.min(left, vw - pop.width - margin));

		// If it overflows the bottom, flip above the swatch
		if (top + pop.height > vh - margin) {
			top = swatch.top - pop.height - margin;
		}
		// If it still overflows the top (very short viewport), pin to top
		top = Math.max(margin, top);

		setPopoverPos({ top, left });
		setPopoverReady(true);
	}, [open]);

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
			{open &&
				popoverPos &&
				createPortal(
					<div
						ref={popoverRef}
						className="colour-picker-popover"
						style={{
							top: popoverPos.top,
							left: popoverPos.left,
							visibility: popoverReady ? "visible" : "hidden",
						}}
					>
						<HexColorPicker color={value} onChange={handleChange} />
						<HexColorInput
							className="colour-picker-hex-input"
							color={value}
							onChange={handleChange}
							prefixed
						/>
					</div>,
					portalTarget,
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

	const isHex = /^#[0-9a-fA-F]{6}$/.test(value);

	return (
		<Field label={label} id={id}>
			<div className="input-wrapper input-select-wrapper">
				{isHex && (
					<span
						className="input-select-swatch"
						style={{ backgroundColor: value }}
					/>
				)}
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

	const triggerRef = useRef<HTMLDivElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const [popoverPos, setPopoverPos] = useState<{
		top: number;
		left: number;
	} | null>(null);
	const [popoverReady, setPopoverReady] = useState(false);
	const [portalTarget, setPortalTarget] = useState<Element>(document.body);

	// Parse "HH:MM" value into hour/minute integers, falling back to current time
	function parseValue(v: string): { hour: number; minute: number } {
		if (v && /^\d{1,2}:\d{2}$/.test(v)) {
			const [h, m] = v.split(":");
			return { hour: parseInt(h, 10), minute: parseInt(m, 10) };
		}
		const now = new Date();
		return { hour: now.getHours(), minute: now.getMinutes() };
	}

	const { hour: selectedHour, minute: selectedMinute } = parseValue(value);

	// Scroll refs for the hour and minute columns
	const hourListRef = useRef<HTMLUListElement>(null);
	const minuteListRef = useRef<HTMLUListElement>(null);
	const ITEM_HEIGHT = 36; // px — must match CSS

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

	function commitChange(hour: number, minute: number) {
		const v = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
		if (!isControlled) setInternalValue(v);
		onChange?.(v);
	}

	function handleOpen() {
		if (open) {
			setOpen(false);
			return;
		}
		const rect = triggerRef.current?.getBoundingClientRect();
		if (rect) {
			setPopoverPos({ top: rect.bottom + 8, left: rect.left });
		}
		setPopoverReady(false);
		const dialog = triggerRef.current?.closest("dialog");
		setPortalTarget(dialog ?? document.body);
		setOpen(true);
	}

	// Clamp popover position after it mounts
	useLayoutEffect(() => {
		if (!open || !popoverRef.current || !triggerRef.current) return;
		const pop = popoverRef.current.getBoundingClientRect();
		const trigger = triggerRef.current.getBoundingClientRect();
		const margin = 8;
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		let left = trigger.left;
		let top = trigger.bottom + margin;

		left = Math.max(margin, Math.min(left, vw - pop.width - margin));
		if (top + pop.height > vh - margin) top = trigger.top - pop.height - margin;
		top = Math.max(margin, top);

		setPopoverPos({ top, left });
		setPopoverReady(true);
	}, [open]);

	// Scroll selected items into the centre of each column when opening
	useLayoutEffect(() => {
		if (!open || !popoverReady) return;
		const hours = is24hr ? 24 : 12;
		const displayHour = is24hr
			? selectedHour
			: selectedHour % 12 === 0
				? 12
				: selectedHour % 12;
		hourListRef.current?.scrollTo({
			top: (displayHour % hours) * ITEM_HEIGHT,
			behavior: "instant",
		});
		minuteListRef.current?.scrollTo({
			top: selectedMinute * ITEM_HEIGHT,
			behavior: "instant",
		});
	}, [open, popoverReady]);

	// Close on outside click
	useEffect(() => {
		if (!open) return;
		function handleClick(e: MouseEvent) {
			if (
				triggerRef.current?.contains(e.target as Node) ||
				popoverRef.current?.contains(e.target as Node)
			)
				return;
			setOpen(false);
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [open]);

	const hours = is24hr
		? Array.from({ length: 24 }, (_, i) => i)
		: Array.from({ length: 12 }, (_, i) => i + 1); // 1–12

	const minutes = Array.from({ length: 60 }, (_, i) => i);

	const displayHour = is24hr
		? selectedHour
		: selectedHour % 12 === 0
			? 12
			: selectedHour % 12;
	const isPM = selectedHour >= 12;

	const display = formatDisplay(value);
	const placeholder = is24hr ? "08:00" : "08:00 a.m.";

	return (
		<Field label={label} id={id}>
			<div
				ref={triggerRef}
				id={id}
				className="input-wrapper input-time-wrapper"
				onClick={handleOpen}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") handleOpen();
				}}
				aria-haspopup="listbox"
				aria-expanded={open}
			>
				<span className="input-time-display">
					{display ?? <span className="input-placeholder">{placeholder}</span>}
				</span>
			</div>

			{open &&
				popoverPos &&
				createPortal(
					<div
						ref={popoverRef}
						className="time-picker-popover"
						style={{
							top: popoverPos.top,
							left: popoverPos.left,
							visibility: popoverReady ? "visible" : "hidden",
						}}
						role="dialog"
						aria-label="Select time"
					>
						{/* Hour column */}
						<ul
							ref={hourListRef}
							className="time-picker-column"
							role="listbox"
							aria-label="Hours"
						>
							{hours.map((h) => (
								<li
									key={h}
									role="option"
									aria-selected={h === displayHour}
									className={`time-picker-item${h === displayHour ? " selected" : ""}`}
									onClick={() => {
										const newHour = is24hr ? h : isPM ? (h % 12) + 12 : h % 12;
										commitChange(newHour, selectedMinute);
									}}
								>
									{String(h).padStart(2, "0")}
								</li>
							))}
						</ul>

						<span className="time-picker-colon">:</span>

						{/* Minute column */}
						<ul
							ref={minuteListRef}
							className="time-picker-column"
							role="listbox"
							aria-label="Minutes"
						>
							{minutes.map((m) => (
								<li
									key={m}
									role="option"
									aria-selected={m === selectedMinute}
									className={`time-picker-item${m === selectedMinute ? " selected" : ""}`}
									onClick={() => commitChange(selectedHour, m)}
								>
									{String(m).padStart(2, "0")}
								</li>
							))}
						</ul>

						{/* AM/PM toggle for 12h mode */}
						{!is24hr && (
							<div className="time-picker-ampm">
								<button
									className={`time-picker-ampm-btn${!isPM ? " selected" : ""}`}
									onClick={() => {
										const newHour = selectedHour % 12; // AM: 0–11
										commitChange(newHour, selectedMinute);
									}}
								>
									AM
								</button>
								<button
									className={`time-picker-ampm-btn${isPM ? " selected" : ""}`}
									onClick={() => {
										const newHour = (selectedHour % 12) + 12; // PM: 12–23
										commitChange(newHour, selectedMinute);
									}}
								>
									PM
								</button>
							</div>
						)}
					</div>,
					portalTarget,
				)}
		</Field>
	);
}
