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
	const { h, l } = rgbToHsl(hexToRgb(hex));
	const lightness =
		l > 0.85
			? "Very Light"
			: l > 0.7
				? "Soft"
				: l > 0.5
					? "Calm"
					: l > 0.35
						? "Deep"
						: "Dark";
	const hue =
		h < 15 || h >= 345
			? "Red"
			: h < 45
				? "Peach"
				: h < 70
					? "Yellow"
					: h < 150
						? "Green"
						: h < 190
							? "Aqua"
							: h < 250
								? "Blue"
								: h < 290
									? "Violet"
									: "Pink";
	return `${lightness} ${hue}`;
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
		form.scheduleStart >= form.scheduleEnd
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
	if (!form.colour) e.colour = "Please select a colour.";
	if (!DAYS.some((d) => form[d as Day])) e.monday = "Select at least one day.";
	return e;
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
	const { default: domtoimage } = await import("dom-to-image-more");

	const dataUrl = (await withVisiblePage((page) =>
		domtoimage.toJpeg(page, { bgcolor: "#ffffff", quality: 0.95 }),
	)) as string;

	const a = document.createElement("a");
	a.href = dataUrl;
	a.download = `${schedule.name.replace(/\s+/g, "_")}.jpg`;
	a.click();
}
