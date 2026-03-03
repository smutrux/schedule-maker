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
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
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

	const style: React.CSSProperties = {
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
