/**
 * scheduleUtils.ts
 *
 * Pure utility functions and side-effectful helpers that operate on the
 * Schedule data model.  Grouped into sections:
 *
 *  Colour utilities   — hex/RGB/HSL conversion, near-duplicate detection,
 *                       and a local hue/saturation/lightness colour namer.
 *  Colour name API    — async enrichment via thecolorapi.com with local fallback.
 *  Default colours    — the six built-in pastel swatches.
 *  Build helpers      — buildSchedule(), buildEvent()
 *  Validation         — validatePreferences(), validateEvent(), validateImport()
 *  localStorage       — saveSchedule(), loadSchedule(), clearSchedule()
 *  Downloads          — downloadJSON(), downloadPDF(), downloadJPEG()
 */
import type {
	ColourEntry,
	PreferencesForm,
	EventForm,
	Schedule,
	ScheduleEvent,
} from "./schedule.types";

// ── Colour utilities ──────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
	const n = parseInt(hex.slice(1), 16);
	return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function colorDistance(
	a: ReturnType<typeof hexToRgb>,
	b: ReturnType<typeof hexToRgb>,
) {
	return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function isNearDuplicate(hex: string, colours: ColourEntry[], threshold = 30) {
	const target = hexToRgb(hex);
	return colours.some(
		(c) => colorDistance(target, hexToRgb(c.colour)) < threshold,
	);
}

function rgbToHsl({ r, g, b }: ReturnType<typeof hexToRgb>) {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0,
		s = 0;
	const l = (max + min) / 2;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h *= 60;
	}
	return { h, s, l };
}

export function generateColourName(hex: string): string {
	const { h, s, l } = rgbToHsl(hexToRgb(hex));

	// Near-neutral: very low saturation
	if (s < 0.08) {
		if (l > 0.93) return "Near White";
		if (l < 0.12) return "Near Black";
		if (l > 0.6) return "Light Grey";
		if (l > 0.38) return "Mid Grey";
		return "Dark Grey";
	}

	// Lightness label
	const lightness =
		l > 0.93
			? "Barely" // a hair off white
			: l > 0.8
				? "Very Light"
				: l > 0.65
					? "Bright"
					: l > 0.5
						? "Mid"
						: l > 0.35
							? "Deep"
							: l > 0.1
								? "Dark"
								: "Barely"; // a hair off black

	// Hue label — expanded set
	const hue =
		h < 12 || h >= 348
			? "Red"
			: h < 38
				? "Orange"
				: h < 62
					? "Yellow"
					: h < 80
						? "Lime"
						: h < 150
							? "Green"
							: h < 172
								? "Teal"
								: h < 200
									? "Aqua"
									: h < 252
										? "Blue"
										: h < 278
											? "Purple"
											: h < 308
												? "Violet"
												: h < 332
													? "Pink"
													: "Rose";

	// Saturation modifier — five buckets from barely-there to screaming
	const saturation =
		s < 0.2
			? "Washed" // very desaturated, pastel-adjacent
			: s < 0.4
				? "Muted" // clearly coloured but soft
				: s < 0.6
					? "" // neutral / no modifier needed
					: s < 0.78
						? "Rich" // noticeably saturated
						: s < 0.9
							? "Vivid" // punchy
							: "Aggressive"; // maximum saturation

	const parts = [lightness, saturation, hue].filter(Boolean);
	return parts.join(" ");
}

// ── Colour name lookup (async, with local fallback) ───────────────────────────

export async function enrichCustomColourName(
	schedule: Schedule,
): Promise<Schedule> {
	// Find the last colour — the custom one just added, if any
	const last = schedule.colours[schedule.colours.length - 1];
	// Only fetch for colours not in the original DEFAULT_COLOURS set
	const isDefault = DEFAULT_COLOURS.some((c) => c.colour === last?.colour);
	if (!last || isDefault) return schedule;

	try {
		const hex = last.colour.replace("#", "");
		const res = await fetch(`https://www.thecolorapi.com/id?hex=${hex}`);
		if (!res.ok) return schedule;
		const data = await res.json();
		const apiName: string = data?.name?.value;
		if (!apiName) return schedule;

		// Patch just that colour entry's name
		const updatedColours = schedule.colours.map((c) =>
			c.colour === last.colour ? { ...c, name: apiName } : c,
		);
		return { ...schedule, colours: updatedColours };
	} catch {
		// Network failure — local name stays
		return schedule;
	}
}

// ── Default colours ───────────────────────────────────────────────────────────

export const DEFAULT_COLOURS: ColourEntry[] = [
	{ name: "Quiet Violet", colour: "#BCBEF1" },
	{ name: "Smooth Blue", colour: "#B7CFFF" },
	{ name: "Serene Green", colour: "#ADEB97" },
	{ name: "Mellow Yellow", colour: "#FFEF98" },
	{ name: "Beach Peach", colour: "#FFC29F" },
	{ name: "Tranquil Pink", colour: "#FFA4A4" },
];

// ── Build schedule ────────────────────────────────────────────────────────────

export function buildSchedule(
	form: PreferencesForm,
	existingColours: ColourEntry[],
	existingEvents: Schedule["events"] = [],
): Schedule {
	const colours = [...existingColours];
	const customHex = form.customColour.toUpperCase();
	if (
		/^#[0-9A-F]{6}$/.test(customHex) &&
		!colours.some((c) => c.colour === customHex) &&
		!isNearDuplicate(customHex, colours, 30)
	) {
		colours.push({ name: generateColourName(customHex), colour: customHex });
	}
	return {
		createTime: new Date().toISOString(),
		name: form.name.trim() || "My Schedule",
		scheduleStart: form.scheduleStart || "08:00",
		scheduleEnd: form.scheduleEnd || "21:30",
		"24hr": form.is24hr,
		colours,
		events: existingEvents,
	};
}

// ── Build event ───────────────────────────────────────────────────────────────

const DAYS = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
] as const;
type Day = (typeof DAYS)[number];

export function buildEvent(form: EventForm): ScheduleEvent | null {
	const name = form.name.trim();
	if (!name || !form.start || !form.end) return null;
	const repeats = DAYS.filter((d) => form[d as Day]);
	if (repeats.length === 0) return null;
	const toISO = (t: string) => `2023-06-27T${t}:00.000Z`;
	return {
		name,
		start: toISO(form.start),
		end: toISO(form.end),
		repeats,
		additionalInfo: form.additionalInfo.trim(),
		colour: form.colour || "#BCBEF1",
		online: form.online,
	};
}

// ── Validation ────────────────────────────────────────────────────────────────

export type FormErrors<T> = Partial<Record<keyof T, string>>;

function timeToMinutes(hhmm: string): number {
	const [h, m] = hhmm.split(":").map(Number);
	return h * 60 + m;
}

export function validatePreferences(
	form: PreferencesForm,
): FormErrors<PreferencesForm> {
	const e: FormErrors<PreferencesForm> = {};
	if (!form.name.trim()) e.name = "Schedule name is required.";
	if (!form.scheduleStart) e.scheduleStart = "Start time is required.";
	if (!form.scheduleEnd) e.scheduleEnd = "End time is required.";
	if (
		form.scheduleStart &&
		form.scheduleEnd &&
		timeToMinutes(form.scheduleStart) >= timeToMinutes(form.scheduleEnd)
	)
		e.scheduleEnd = "End time must be after start time.";
	return e;
}

export function validateEvent(form: EventForm): FormErrors<EventForm> {
	const e: FormErrors<EventForm> = {};
	if (!form.name.trim()) e.name = "Event name is required.";
	if (!form.start) e.start = "Start time is required.";
	if (!form.end) e.end = "End time is required.";
	if (form.start && form.end && form.start >= form.end)
		e.end = "End time must be after start time.";
	else if (
		form.start &&
		form.end &&
		timeToMinutes(form.end) - timeToMinutes(form.start) < 30
	)
		e.end = "Entry must be at least 30 minutes long.";
	if (!form.colour) e.colour = "Please select a colour.";
	if (!DAYS.some((d) => form[d as Day])) e.monday = "Select at least one day.";
	return e;
}

// ── Import / validation ──────────────────────────────────────────────────────

export type ImportResult =
	| { ok: true; schedule: Schedule }
	| { ok: false; error: string };

export function validateImport(raw: unknown): ImportResult {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
		return { ok: false, error: "File is not a valid JSON object." };
	}

	const obj = raw as Record<string, unknown>;

	if (typeof obj.name !== "string" || !obj.name.trim()) {
		return { ok: false, error: 'Missing or empty required field: "name".' };
	}
	if (typeof obj.scheduleStart !== "string" || !obj.scheduleStart) {
		return { ok: false, error: 'Missing required field: "scheduleStart".' };
	}
	if (typeof obj.scheduleEnd !== "string" || !obj.scheduleEnd) {
		return { ok: false, error: 'Missing required field: "scheduleEnd".' };
	}
	if (typeof obj["24hr"] !== "boolean") {
		return {
			ok: false,
			error:
				'Missing or invalid required field: "24hr" (must be true or false).',
		};
	}
	if (!Array.isArray(obj.colours) || obj.colours.length === 0) {
		return { ok: false, error: '"colours" must be a non-empty array.' };
	}

	// Ensure every colour entry has name + colour string
	for (let i = 0; i < obj.colours.length; i++) {
		const c = obj.colours[i];
		if (
			!c ||
			typeof c !== "object" ||
			typeof c.name !== "string" ||
			typeof c.colour !== "string"
		) {
			return {
				ok: false,
				error: `colours[${i}] is invalid — each entry needs "name" and "colour" strings.`,
			};
		}
	}

	// events is optional but must be an array if present
	const events = Array.isArray(obj.events) ? obj.events : [];

	return {
		ok: true,
		schedule: {
			createTime:
				typeof obj.createTime === "string"
					? obj.createTime
					: new Date().toISOString(),
			name: obj.name.trim(),
			scheduleStart: obj.scheduleStart,
			scheduleEnd: obj.scheduleEnd,
			"24hr": obj["24hr"],
			colours: obj.colours as Schedule["colours"],
			events: events as Schedule["events"],
		},
	};
}

// ── localStorage ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "pretty_schedule";

export function saveSchedule(schedule: Schedule): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
	} catch (e) {
		console.error("Failed to save schedule to localStorage:", e);
	}
}

export function loadSchedule(): Schedule | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Schedule;
		if (!parsed.name || !parsed.events || !parsed.colours) return null;
		return parsed;
	} catch (e) {
		console.error("Failed to load schedule from localStorage:", e);
		return null;
	}
}

export function clearSchedule(): void {
	localStorage.removeItem(STORAGE_KEY);
}

// ── Download: JSON ────────────────────────────────────────────────────────────

export function downloadJSON(schedule: Schedule): void {
	const blob = new Blob([JSON.stringify(schedule, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${schedule.name.replace(/\s+/g, "_")}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

// ── Download: capture helper ─────────────────────────────────────────────────

// Temporarily reveals the hidden print root by adding a CSS class,
// runs the capture callback, then removes the class.
async function withVisiblePage<T>(
	capture: (el: HTMLElement) => Promise<T>,
): Promise<T> {
	const root = document.querySelector(".sp-print-root") as HTMLElement | null;
	if (!root) throw new Error("Schedule print root not found.");
	const page = root.querySelector(".sp-page") as HTMLElement | null;
	if (!page) throw new Error("Schedule page element not found.");

	root.classList.add("sp-capturing");
	// One rAF to let the browser paint the now-visible element
	await new Promise((r) => requestAnimationFrame(r));
	await new Promise((r) => requestAnimationFrame(r));

	try {
		return await capture(page);
	} finally {
		root.classList.remove("sp-capturing");
	}
}

// ── Download: PDF ─────────────────────────────────────────────────────────────

export async function downloadPDF(schedule: Schedule): Promise<void> {
	const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
		import("html2canvas"),
		import("jspdf"),
	]);

	const canvas = await withVisiblePage((page) =>
		html2canvas(page, {
			scale: 2,
			backgroundColor: "#ffffff",
			useCORS: true,
			logging: false,
		}),
	);

	const pdf = new jsPDF({
		orientation: "portrait",
		unit: "pt",
		format: "letter",
	});
	pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, 612, 792);
	pdf.save(`${schedule.name.replace(/\s+/g, "_")}.pdf`);
}

// ── Download: JPEG ────────────────────────────────────────────────────────────

export async function downloadJPEG(schedule: Schedule): Promise<void> {
	const { default: html2canvas } = await import("html2canvas");

	const canvas = await withVisiblePage((page) =>
		html2canvas(page, {
			scale: 3, // 3× pixel density → ~2448×3168 px for letter
			backgroundColor: "#ffffff",
			useCORS: true,
			logging: false,
		}),
	);

	// Convert to high-quality JPEG data URL
	const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

	const a = document.createElement("a");
	a.href = dataUrl;
	a.download = `${schedule.name.replace(/\s+/g, "_")}.jpg`;
	a.click();
}
