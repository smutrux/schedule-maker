/**
 * App.tsx
 *
 * Root application component for Pretty Schedule Maker.
 *
 * Responsibilities:
 *  - Owns all top-level state: active schedule, open modals, form values,
 *    validation errors, download progress, and import errors.
 *  - Persists the schedule to localStorage on every change and restores it
 *    on mount.
 *  - Delegates rendering to modal-hosted form components (TextInput, Checkbox,
 *    TimePicker, ColourPicker, Dropdown) and the SchedulePreview/print root.
 *
 * State overview:
 *  schedule          — the current Schedule document (null when none started).
 *  prefsOpen         — controls the New / Edit Preferences modal.
 *  itemOpen          — controls the Add Item modal.
 *  downloadOpen      — controls the Download format picker modal.
 *  showPreview       — toggles between schedule summary and inline preview.
 *  downloading       — tracks which download ("pdf" | "jpeg") is in flight.
 *  isEditingExisting — distinguishes "New Schedule" from "Edit Preferences".
 *  importError       — non-null string triggers the import error modal.
 */
import "./App.css";
import { useState, useEffect, useRef } from "react";
import { Button } from "./components/Button";
import {
	TextInput,
	Checkbox,
	ColourPicker,
	TimePicker,
	Dropdown,
} from "./components/Input/Input";
import { Modal } from "./components/Modal/Modal";
import {
	buildSchedule,
	buildEvent,
	validatePreferences,
	validateEvent,
	downloadJSON,
	downloadPDF,
	downloadJPEG,
	saveSchedule,
	loadSchedule,
	validateImport,
	clearSchedule,
	DEFAULT_COLOURS,
	enrichCustomColourName,
} from "./scheduleUtils";
import type { Schedule, PreferencesForm, EventForm } from "./schedule.types";
import type { FormErrors } from "./scheduleUtils";
import {
	SchedulePreview,
	SchedulePrintRoot,
	printSchedule,
} from "./SchedulePreview";

const EMPTY_PREFS: PreferencesForm = {
	name: "",
	scheduleStart: "08:00",
	scheduleEnd: "21:30",
	is24hr: true,
	customColour: "#6b93c4",
};

const EMPTY_EVENT: EventForm = {
	name: "",
	additionalInfo: "",
	start: "",
	end: "",
	colour: "",
	online: false,
	monday: false,
	tuesday: false,
	wednesday: false,
	thursday: false,
	friday: false,
	saturday: false,
	sunday: false,
};

const DAYS = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
] as const;

function App() {
	const [schedule, setSchedule] = useState<Schedule | null>(() =>
		loadSchedule(),
	);
	const [prefsOpen, setPrefsOpen] = useState(false);
	const [itemOpen, setItemOpen] = useState(false);
	const [downloadOpen, setDownloadOpen] = useState(false);
	const [showPreview, setShowPreview] = useState(() => {
		try {
			return localStorage.getItem("show_preview") === "true";
		} catch {
			return false;
		}
	});
	const [downloading, setDownloading] = useState<"pdf" | "jpeg" | null>(null);
	const [isEditingExisting, setIsEditingExisting] = useState(false);
	const [importError, setImportError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [prefsForm, setPrefsForm] = useState<PreferencesForm>(EMPTY_PREFS);
	const [prefsErrors, setPrefsErrors] = useState<FormErrors<PreferencesForm>>(
		{},
	);

	const [eventForm, setEventForm] = useState<EventForm>(EMPTY_EVENT);
	const [eventErrors, setEventErrors] = useState<FormErrors<EventForm>>({});

	// Persist to localStorage on every change
	useEffect(() => {
		if (schedule) saveSchedule(schedule);
	}, [schedule]);

	// Collapse preview if schedule is cleared
	useEffect(() => {
		if (!schedule) setShowPreview(false);
	}, [schedule]);

	// Persist preview toggle across sessions
	useEffect(() => {
		try {
			localStorage.setItem("show_preview", String(showPreview));
		} catch {
			/* ignore */
		}
	}, [showPreview]);

	const hasSchedule = schedule !== null;
	const hasEvents = hasSchedule && schedule.events.length > 0;

	const colourOptions = (schedule?.colours ?? DEFAULT_COLOURS).map((c) => ({
		value: c.colour,
		label: c.name,
	}));

	// ── Preferences ─────────────────────────────────────────────────────
	function openNewSchedule() {
		setPrefsForm(EMPTY_PREFS);
		setPrefsErrors({});
		setIsEditingExisting(false);
		setPrefsOpen(true);
	}

	function openEditPreferences() {
		if (!schedule) return;
		setIsEditingExisting(true);
		setPrefsForm({
			name: schedule.name,
			scheduleStart: schedule.scheduleStart,
			scheduleEnd: schedule.scheduleEnd,
			is24hr: schedule["24hr"],
			customColour: "#6b93c4",
		});
		setPrefsErrors({});
		setPrefsOpen(true);
	}

	function setPrefsField<K extends keyof PreferencesForm>(
		k: K,
		v: PreferencesForm[K],
	) {
		setPrefsForm((p) => ({ ...p, [k]: v }));
		// Clear all errors on any change — stale errors from a previous save
		// attempt should not persist when the user is still editing the form.
		setPrefsErrors({});
	}

	function handleSavePrefs() {
		const errors = validatePreferences(prefsForm);
		if (Object.keys(errors).length) {
			setPrefsErrors(errors);
			return;
		}
		if (!isEditingExisting) {
			// Starting fresh — wipe any previously saved schedule
			clearSchedule();
		}
		const existing = isEditingExisting
			? (schedule?.colours ?? DEFAULT_COLOURS)
			: DEFAULT_COLOURS;
		const built = buildSchedule(
			prefsForm,
			existing,
			isEditingExisting ? (schedule?.events ?? []) : [],
		);
		setSchedule(built);
		// Async patch: swap in the API name once it arrives
		enrichCustomColourName(built).then((enriched) => {
			if (enriched !== built) setSchedule(enriched);
		});
		setPrefsErrors({});
		setPrefsOpen(false);
	}

	// ── Events ──────────────────────────────────────────────────────────
	function openAddItem() {
		setEventForm(EMPTY_EVENT);
		setEventErrors({});
		setItemOpen(true);
	}

	function setEventField<K extends keyof EventForm>(k: K, v: EventForm[K]) {
		setEventForm((p) => ({ ...p, [k]: v }));
		setEventErrors((p) => ({ ...p, [k]: undefined }));
	}

	function handleAddEvent() {
		const errors = validateEvent(eventForm);
		if (Object.keys(errors).length) {
			setEventErrors(errors);
			return;
		}
		const event = buildEvent(eventForm);
		if (!event || !schedule) return;
		setSchedule((prev) =>
			prev ? { ...prev, events: [...prev.events, event] } : prev,
		);
		setEventForm(EMPTY_EVENT);
		setEventErrors({});
		setItemOpen(false);
	}

	function handleRemoveLast() {
		setSchedule((prev) =>
			prev ? { ...prev, events: prev.events.slice(0, -1) } : prev,
		);
	}

	// ── Downloads ────────────────────────────────────────────────────────
	async function handleDownloadPDF() {
		if (!schedule || downloading) return;
		setDownloading("pdf");
		try {
			await downloadPDF(schedule);
		} finally {
			setDownloading(null);
			setDownloadOpen(false);
		}
	}

	async function handleDownloadJPEG() {
		if (!schedule || downloading) return;
		setDownloading("jpeg");
		try {
			await downloadJPEG(schedule);
		} finally {
			setDownloading(null);
			setDownloadOpen(false);
		}
	}

	function handleDownloadJSON() {
		if (!schedule) return;
		downloadJSON(schedule);
		setDownloadOpen(false);
	}

	function handleImportClick() {
		fileInputRef.current?.click();
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		// Reset so the same file can be re-selected after an error
		e.target.value = "";

		const reader = new FileReader();
		reader.onload = (ev) => {
			try {
				const parsed = JSON.parse(ev.target?.result as string);
				const result = validateImport(parsed);
				if (result.ok) {
					setSchedule(result.schedule);
					setImportError(null);
				} else {
					setImportError(result.error);
				}
			} catch {
				setImportError("Could not parse file — make sure it is valid JSON.");
			}
		};
		reader.readAsText(file);
	}

	return (
		<>
			<div className="content-wrapper">
				<h1>Pretty Schedule Maker</h1>
				<p>Jump straight into creating your pretty schedule.</p>

				<div className="btn-large-grid">
					<Button
						large
						icon="new_window"
						text="Start New"
						onClick={openNewSchedule}
					/>
					<Button
						large
						icon="add_ad"
						text="Add Item"
						onClick={openAddItem}
						disabled={!hasSchedule}
					/>
					<Button
						large
						icon="edit_square"
						text="Edit Preferences"
						onClick={openEditPreferences}
						disabled={!hasSchedule}
					/>
					<Button
						large
						icon="remove_selection"
						text="Remove Last Item"
						onClick={handleRemoveLast}
						disabled={!hasEvents}
					/>
					<Button
						large
						icon="dashboard"
						text={showPreview ? "Hide Preview" : "Preview Schedule"}
						onClick={() => setShowPreview((v) => !v)}
						disabled={!hasSchedule}
						className={showPreview ? "btn-large-active" : ""}
					/>
					<Button
						large
						icon="print"
						text="Print Schedule"
						onClick={printSchedule}
						disabled={!hasSchedule}
					/>
					<Button
						large
						icon="download"
						text="Download"
						onClick={() => setDownloadOpen(true)}
						disabled={!hasSchedule}
					/>
					<Button
						large
						icon="upload"
						text="Import"
						onClick={handleImportClick}
					/>
				</div>

				{/* ── Summary / inline preview toggle ───────────────────────── */}
				{hasSchedule && !showPreview && (
					<div className="schedule-summary">
						<strong>{schedule.name}</strong>
						{" — "}
						{schedule.events.length} event
						{schedule.events.length !== 1 ? "s" : ""}
					</div>
				)}

				{/* ── Preferences modal ─────────────────────────────────────── */}
				<Modal
					title={
						isEditingExisting ? "Edit Schedule Preferences" : "New Schedule"
					}
					isOpen={prefsOpen}
					onClose={() => setPrefsOpen(false)}
					width={700}
				>
					<div className="modal-contents">
						<TextInput
							label="Name"
							placeholder="Jane's Winter Semester 2026"
							value={prefsForm.name}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setPrefsField("name", e.target.value)
							}
						/>
						{prefsErrors.name && (
							<p className="form-error">{prefsErrors.name}</p>
						)}

						<Checkbox
							label="24 hr Time"
							checked={prefsForm.is24hr}
							onChange={(v) => setPrefsField("is24hr", v)}
						/>

						<TimePicker
							label="Earliest Start Time"
							value={prefsForm.scheduleStart}
							onChange={(v) => setPrefsField("scheduleStart", v)}
							is24hr={prefsForm.is24hr}
						/>
						{prefsErrors.scheduleStart && (
							<p className="form-error">{prefsErrors.scheduleStart}</p>
						)}

						<TimePicker
							label="Latest End Time"
							value={prefsForm.scheduleEnd}
							onChange={(v) => setPrefsField("scheduleEnd", v)}
							is24hr={prefsForm.is24hr}
						/>
						{prefsErrors.scheduleEnd && (
							<p className="form-error">{prefsErrors.scheduleEnd}</p>
						)}

						<ColourPicker
							label="Add Custom Colour"
							value={prefsForm.customColour}
							onChange={(v) => setPrefsField("customColour", v)}
						/>

						<div className="modal-row-break" />
						<div className="modal-action-row">
							<Button text="Save" icon="save" onClick={handleSavePrefs} />
						</div>
					</div>
				</Modal>

				{/* ── Add item modal ─────────────────────────────────────────── */}
				<Modal
					title="Add Item to Schedule"
					isOpen={itemOpen}
					onClose={() => setItemOpen(false)}
					width={640}
				>
					<div className="modal-contents">
						<TextInput
							label="Title"
							placeholder="MATH 101"
							value={eventForm.name}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setEventField("name", e.target.value)
							}
						/>
						{eventErrors.name && (
							<p className="form-error">{eventErrors.name}</p>
						)}

						<TextInput
							label="Details"
							placeholder="Intro to Calculus"
							value={eventForm.additionalInfo}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setEventField("additionalInfo", e.target.value)
							}
						/>

						<TimePicker
							label="Start Time"
							value={eventForm.start}
							onChange={(v) => setEventField("start", v)}
							is24hr={schedule?.["24hr"] ?? false}
						/>
						{eventErrors.start && (
							<p className="form-error">{eventErrors.start}</p>
						)}

						<TimePicker
							label="End Time"
							value={eventForm.end}
							onChange={(v) => setEventField("end", v)}
							is24hr={schedule?.["24hr"] ?? false}
						/>
						{eventErrors.end && <p className="form-error">{eventErrors.end}</p>}

						<Dropdown
							label="Item Colour"
							options={colourOptions}
							value={eventForm.colour}
							onChange={(v) => setEventField("colour", v)}
						/>
						{eventErrors.colour && (
							<p className="form-error">{eventErrors.colour}</p>
						)}

						<Checkbox
							label="Online"
							checked={eventForm.online}
							onChange={(v) => setEventField("online", v)}
						/>

						<div className="modal-row-break" />

						{DAYS.map((day) => (
							<Checkbox
								key={day}
								label={day.charAt(0).toUpperCase() + day.slice(1)}
								checked={eventForm[day]}
								onChange={(v) => setEventField(day, v)}
							/>
						))}
						{eventErrors.monday && (
							<p className="form-error form-error-full">{eventErrors.monday}</p>
						)}

						<div className="modal-row-break" />
						<div className="modal-action-row">
							<Button text="Add Item" icon="add_ad" onClick={handleAddEvent} />
						</div>
					</div>
				</Modal>

				{/* ── Download modal ─────────────────────────────────────────── */}
				<Modal
					title="Choose Download Option"
					isOpen={downloadOpen}
					onClose={() => !downloading && setDownloadOpen(false)}
				>
					<div className="modal-large-grid">
						<Button
							large
							icon="picture_as_pdf"
							text={downloading === "pdf" ? "Preparing…" : "As PDF"}
							onClick={handleDownloadPDF}
							disabled={!!downloading}
						/>
						<Button
							large
							icon="image"
							text={downloading === "jpeg" ? "Preparing…" : "As JPEG"}
							onClick={handleDownloadJPEG}
							disabled={!!downloading}
						/>
						<Button
							large
							icon="file_json"
							text="As JSON"
							onClick={handleDownloadJSON}
							disabled={!!downloading}
						/>
						<Button
							large
							icon="arrow_back"
							text="Back"
							onClick={() => setDownloadOpen(false)}
							disabled={!!downloading}
						/>
					</div>
				</Modal>

				{/* Hidden file input for JSON import */}
				<input
					ref={fileInputRef}
					type="file"
					accept=".json,application/json"
					style={{ display: "none" }}
					onChange={handleFileChange}
				/>

				{/* Import error modal */}
				<Modal
					title="Invalid Schedule File"
					isOpen={importError !== null}
					onClose={() => setImportError(null)}
				>
					<div className="modal-alert-body">
						<p className="modal-alert-text">{importError}</p>
						<Button
							text="OK"
							icon="check"
							onClick={() => setImportError(null)}
						/>
					</div>
				</Modal>

				{/* Hidden print target mounted to body */}
				{hasSchedule && <SchedulePrintRoot schedule={schedule} />}
			</div>

			{hasSchedule && showPreview && (
				<div className="preview-scaler-outer">
					<div className="preview-scaler-inner">
						<SchedulePreview schedule={schedule} />
					</div>
				</div>
			)}
		</>
	);
}

export default App;
