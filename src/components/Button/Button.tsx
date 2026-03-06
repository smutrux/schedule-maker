/**
 * Button.tsx
 *
 * Reusable button component with two visual variants:
 *
 *  - Default  — compact pill button with primary background, icon + label side-by-side.
 *  - Large    — card-style button with icon stacked above label, used in the main toolbar.
 *
 * Both variants support a disabled state and an optional icon-only mode
 * (when `text` is omitted the default button renders as a square icon button).
 */
import type { ButtonHTMLAttributes } from "react";
import { Icon } from "../Icon";
import "./Button.css";

type ButtonProps = {
	/** Button label text. If omitted, the default variant renders icon-only. */
	text?: string;
	/** Material Symbols icon name (see Icon component). */
	icon?: string;
	/** Reverse the default icon → text order (default variant only). */
	reverse?: boolean;
	/** Render the large card variant instead of the default pill. */
	large?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
	text,
	icon,
	reverse,
	large,
	disabled,
	className,
	...props
}: ButtonProps) {
	/* ── Large (card) variant ─────────────────────────────────────────────── */
	if (large) {
		return (
			<button
				className={`btn btn-large ${disabled ? "btn-disabled" : ""} ${className ?? ""}`}
				disabled={disabled}
				{...props}
			>
				{icon && (
					<span className="btn-large-icon">
						<Icon name={icon} size={120} />
					</span>
				)}
				{text && <span className="btn-large-text">{text}</span>}
			</button>
		);
	}

	/* ── Default (pill) variant ───────────────────────────────────────────── */
	const iconEl = icon && (
		<span className="btn-icon">
			<Icon name={icon} />
		</span>
	);
	const textEl = text && <span className="btn-text">{text}</span>;

	return (
		<button
			className={`btn ${disabled ? "btn-disabled" : ""} ${className ?? ""}`}
			disabled={disabled}
			{...props}
		>
			{reverse ? (
				<>
					{textEl}
					{iconEl}
				</>
			) : (
				<>
					{iconEl}
					{textEl}
				</>
			)}
		</button>
	);
}
