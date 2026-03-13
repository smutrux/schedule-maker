/**
 * Modal.tsx
 *
 * Accessible modal dialog built on the native HTML <dialog> element.
 *
 * Features:
 *  - Uses showModal() / close() for proper focus-trap and backdrop support.
 *  - Backdrop click closes the modal; clicks inside the content do not.
 *  - Suppresses the browser's default Escape-key dismiss so that close state
 *    is always managed by the parent (prevents out-of-sync open/close state).
 *  - Width and height are overrideable via props; the default is a responsive
 *    clamp between 300px and 560px.
 *
 * Props:
 *  title        — heading shown in the modal header.
 *  isOpen       — controls whether the dialog is shown.
 *  onClose      — callback invoked when the user closes the modal.
 *  width        — optional CSS value or pixel number to override default width.
 *  height       — optional CSS value or pixel number to override default height.
 *  aspectRatio  — optional CSS aspect-ratio string.
 *  children     — content rendered in the scrollable body area.
 */
import { useEffect, useRef } from "react";
import { Icon } from "../Icon";
import "./Modal.css";

export type ModalProps = {
	title: string;
	onClose: () => void;
	isOpen: boolean;
	aspectRatio?: string;
	width?: string | number;
	height?: string | number;
	children?: React.ReactNode;
};

export function Modal({
	title,
	onClose,
	isOpen,
	aspectRatio,
	width,
	height,
	children,
}: ModalProps) {
	let dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		let dialog = dialogRef.current;
		if (!dialog) return;

		// Prevent the dialog from closing due to external focus loss (e.g. OS colour picker)
		// We manage open/close state ourselves exclusively
		function handleCancel(e: Event) {
			e.preventDefault();
		}
		function handleClose(e: Event) {
			e.preventDefault();
		}

		dialog.addEventListener("cancel", handleCancel);
		dialog.addEventListener("close", handleClose);

		if (isOpen) dialog.showModal();
		else dialog.close();

		return () => {
			dialog.removeEventListener("cancel", handleCancel);
			dialog.removeEventListener("close", handleClose);
		};
	}, [isOpen]);

	// Close only when clicking the dialog backdrop itself, not any children
	function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
		if (e.target === dialogRef.current) onClose();
	}

	let style: React.CSSProperties = {
		...(width !== undefined && {
			width: typeof width === "number" ? `${width}px` : width,
		}),
		...(height !== undefined && {
			height: typeof height === "number" ? `${height}px` : height,
		}),
		...(aspectRatio !== undefined && { aspectRatio }),
	};

	return (
		<dialog
			ref={dialogRef}
			className="modal"
			style={style}
			onClick={handleBackdropClick}
		>
			<div className="modal-inner">
				<div className="modal-header">
					<h2 className="modal-title">{title}</h2>
					<button className="modal-close" onClick={onClose} aria-label="Close">
						<Icon name="close" />
					</button>
				</div>
				<div className="modal-content">{children}</div>
			</div>
		</dialog>
	);
}
