import { useRef, useEffect, useState, useId } from "react";
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
		<label className="input-checkbox-label" onClick={handleClick}>
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
function NoiseCanvas({ color }: { color: string }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const r = parseInt(color.slice(1, 3), 16);
		const g = parseInt(color.slice(3, 5), 16);
		const b = parseInt(color.slice(5, 7), 16);

		const imageData = ctx.createImageData(canvas.width, canvas.height);
		const data = imageData.data;

		for (let i = 0; i < data.length; i += 4) {
			const n = (Math.random() - 0.5) * 40;
			data[i] = Math.min(255, Math.max(0, r + n));
			data[i + 1] = Math.min(255, Math.max(0, g + n));
			data[i + 2] = Math.min(255, Math.max(0, b + n));
			data[i + 3] = 255;
		}

		ctx.putImageData(imageData, 0, 0);
	}, [color]);

	return (
		<canvas
			ref={canvasRef}
			className="colour-picker-canvas"
			width={600}
			height={120}
		/>
	);
}

export function ColourPicker({
	value: controlledValue,
	onChange,
	label,
}: ColourPickerProps) {
	const id = useId();
	const isControlled = controlledValue !== undefined;
	const [internalValue, setInternalValue] = useState("#6b93c4");
	const value = isControlled ? controlledValue! : internalValue;
	const inputRef = useRef<HTMLInputElement>(null);

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		if (!isControlled) setInternalValue(e.target.value);
		onChange?.(e.target.value);
	}

	return (
		<Field label={label} id={id}>
			<div
				className="input-wrapper input-colour-wrapper"
				onClick={() => inputRef.current?.click()}
			>
				<NoiseCanvas color={value} />
				<input
					ref={inputRef}
					id={id}
					type="color"
					value={value}
					onChange={handleChange}
					className="colour-picker-native"
				/>
			</div>
		</Field>
	);
}

// ── Dropdown ──────────────────────────────────────────────────────────────────
export function Dropdown({
	options,
	value: controlledValue,
	onChange,
	placeholder = "Placeholder",
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
}: TimePickerProps) {
	const id = useId();
	const isControlled = controlledValue !== undefined;
	const [internalValue, setInternalValue] = useState("");
	const value = isControlled ? controlledValue! : internalValue;
	const inputRef = useRef<HTMLInputElement>(null);

	function formatDisplay(v: string) {
		if (!v) return null;
		const [h, m] = v.split(":");
		const hour = parseInt(h);
		const suffix = hour >= 12 ? "p.m." : "a.m.";
		const display = hour % 12 === 0 ? 12 : hour % 12;
		return `${String(display).padStart(2, "0")}:${m} ${suffix}`;
	}

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		if (!isControlled) setInternalValue(e.target.value);
		onChange?.(e.target.value);
	}

	const display = formatDisplay(value);

	return (
		<Field label={label} id={id}>
			<div
				className="input-wrapper input-time-wrapper"
				onClick={() => inputRef.current?.showPicker?.()}
			>
				<span className="input-time-display">
					{display ?? <span className="input-placeholder">08:00 a.m.</span>}
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
