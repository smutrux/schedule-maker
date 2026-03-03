import type { ButtonHTMLAttributes } from "react";
import { Icon } from "../Icon";
import "./Button.css";

type ButtonProps = {
	text?: string;
	icon?: string;
	reverse?: boolean;
	large?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
	text,
	icon,
	reverse,
	large,
	disabled,
	...props
}: ButtonProps) {
	if (large) {
		return (
			<button
				className={`btn btn-large ${disabled ? "btn-disabled" : ""}`}
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

	const iconEl = icon && (
		<span className="btn-icon">
			<Icon name={icon} />
		</span>
	);
	const textEl = text && <span className="btn-text">{text}</span>;

	return (
		<button
			className={`btn ${disabled ? "btn-disabled" : ""}`}
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
