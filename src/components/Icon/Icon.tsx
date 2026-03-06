/**
 * Icon.tsx
 *
 * Renders a single Google Material Symbols (rounded variant) icon.
 * Icons are loaded via the font stylesheet in index.html and are
 * identified by their ligature name (e.g. "close", "download", "save").
 *
 * @see https://fonts.google.com/icons
 */
import "./Icon.css";

type IconProps = {
	/** Material Symbols ligature name (e.g. "close", "add_ad", "print"). */
	name: string;
	/** Override font-size in pixels. Defaults to the CSS value (1.5rem). */
	size?: number;
	/** Additional CSS class names to apply to the span. */
	className?: string;
};

export function Icon({ name, size, className }: IconProps) {
	return (
		<span
			className={`material-symbols-rounded ${className ?? ""}`}
			style={size !== undefined ? { fontSize: size } : undefined}
			aria-hidden="true"
		>
			{name}
		</span>
	);
}
