import "./App.css";
import { useState, useEffect } from "react";
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
	saveSchedule,
	loadSchedule,
	DEFAULT_COLOURS,
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
	const [schedule, setSchedule] = useState<Schedule | null>(null);
	const [prefsOpen, setPrefsOpen] = useState(false);
	const [itemOpen, setItemOpen] = useState(false);
	const [downloadOpen, setDownloadOpen] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);

	const [prefsForm, setPrefsForm] = useState<PreferencesForm>(EMPTY_PREFS);
	const [prefsErrors, setPrefsErrors] = useState<FormErrors<PreferencesForm>>(
		{},
	);

	const [eventForm, setEventForm] = useState<EventForm>(EMPTY_EVENT);
	const [eventErrors, setEventErrors] = useState<FormErrors<EventForm>>({});

	// ── Load from localStorage on mount ────────────────────────────────────
	useEffect(() => {
		const stored = loadSchedule();
		if (stored) setSchedule(stored);
	}, []);

	// ── Persist to localStorage on every change ─────────────────────────
	useEffect(() => {
		if (schedule) saveSchedule(schedule);
	}, [schedule]);

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
		setPrefsOpen(true);
	}

	function openEditPreferences() {
		if (!schedule) return;
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
		setPrefsErrors((p) => ({ ...p, [k]: undefined }));
	}

	function handleSavePrefs() {
		const errors = validatePreferences(prefsForm);
		if (Object.keys(errors).length) {
			setPrefsErrors(errors);
			return;
		}
		const existing = schedule?.colours ?? DEFAULT_COLOURS;
		const built = buildSchedule(prefsForm, existing, schedule?.events ?? []);
		setSchedule(built);
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

	return (
		<div className="content-wrapper">
			<h1>Pretty Schedule Maker</h1>
			<p>Jump straight into creating your schedule below</p>

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
					text="Preview Schedule"
					onClick={() => setPreviewOpen(true)}
					disabled={!hasSchedule}
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
				<Button large icon="upload" text="Import" />
			</div>

			{hasSchedule && (
				<div className="schedule-summary">
					<strong>{schedule.name}</strong>
					{" — "}
					{schedule.events.length} event
					{schedule.events.length !== 1 ? "s" : ""}
				</div>
			)}

			{/* ── Preview modal ──────────────────────────────────────────── */}
			<Modal
				title={schedule?.name ?? "Preview"}
				isOpen={previewOpen}
				onClose={() => setPreviewOpen(false)}
				width="90vw"
			>
				{schedule && <SchedulePreview schedule={schedule} />}
			</Modal>

			{/* ── Preferences modal ─────────────────────────────────────── */}
			<Modal
				title={
					hasSchedule ? "Edit Schedule Preferences" : "Schedule Preferences"
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
					{prefsErrors.name && <p className="form-error">{prefsErrors.name}</p>}

					<Checkbox
						label="24 hr Time"
						checked={prefsForm.is24hr}
						onChange={(v) => setPrefsField("is24hr", v)}
					/>

					<TimePicker
						label="Earliest Start Time"
						value={prefsForm.scheduleStart}
						onChange={(v) => setPrefsField("scheduleStart", v)}
					/>
					{prefsErrors.scheduleStart && (
						<p className="form-error">{prefsErrors.scheduleStart}</p>
					)}

					<TimePicker
						label="Latest End Time"
						value={prefsForm.scheduleEnd}
						onChange={(v) => setPrefsField("scheduleEnd", v)}
					/>
					{prefsErrors.scheduleEnd && (
						<p className="form-error">{prefsErrors.scheduleEnd}</p>
					)}

					<ColourPicker
						label="Add Custom Colour"
						value={prefsForm.customColour}
						onChange={(v) => setPrefsField("customColour", v)}
					/>

					<div style={{ width: "100%" }} />
					<div style={{ display: "flex", justifyContent: "center" }}>
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
						placeholder="PROG-1P01"
						value={eventForm.name}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							setEventField("name", e.target.value)
						}
					/>
					{eventErrors.name && <p className="form-error">{eventErrors.name}</p>}

					<TextInput
						label="Details"
						placeholder="Lab"
						value={eventForm.additionalInfo}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							setEventField("additionalInfo", e.target.value)
						}
					/>

					<TimePicker
						label="Start Time"
						value={eventForm.start}
						onChange={(v) => setEventField("start", v)}
					/>
					{eventErrors.start && (
						<p className="form-error">{eventErrors.start}</p>
					)}

					<TimePicker
						label="End Time"
						value={eventForm.end}
						onChange={(v) => setEventField("end", v)}
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

					<div style={{ width: "100%" }} />

					{DAYS.map((day) => (
						<Checkbox
							key={day}
							label={day.charAt(0).toUpperCase() + day.slice(1)}
							checked={eventForm[day]}
							onChange={(v) => setEventField(day, v)}
						/>
					))}
					{eventErrors.monday && (
						<p className="form-error" style={{ width: "100%" }}>
							{eventErrors.monday}
						</p>
					)}

					<div style={{ width: "100%" }} />
					<div
						style={{ display: "flex", justifyContent: "center", width: "100%" }}
					>
						<Button text="Add Item" icon="add_ad" onClick={handleAddEvent} />
					</div>
				</div>
			</Modal>

			{/* ── Download modal ─────────────────────────────────────────── */}
			<Modal
				title="Choose Download Option"
				isOpen={downloadOpen}
				onClose={() => setDownloadOpen(false)}
			>
				<div className="modal-large-grid">
					<Button large icon="picture_as_pdf" text="As PDF" disabled />
					<Button large icon="image" text="As JPEG" disabled />
					<Button
						large
						icon="file_json"
						text="As JSON"
						onClick={() => {
							if (schedule) {
								downloadJSON(schedule);
								setDownloadOpen(false);
							}
						}}
					/>
					<Button
						large
						icon="arrow_back"
						text="Back"
						onClick={() => setDownloadOpen(false)}
					/>
				</div>
			</Modal>

			{/* Hidden print target mounted to body */}
			{hasSchedule && <SchedulePrintRoot schedule={schedule} />}
		</div>
	);
}

export default App;
