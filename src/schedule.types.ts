/**
 * schedule.types.ts
 *
 * Shared TypeScript type definitions for the schedule data model and forms.
 *
 *  ColourEntry     — a named colour swatch (name + hex string).
 *  ScheduleEvent   — a single recurring calendar event block.
 *  Schedule        — the top-level serialisable schedule document.
 *  PreferencesForm — form state for the New / Edit Preferences modal.
 *  EventForm       — form state for the Add Item modal.
 */
export type ColourEntry = {
	name: string;
	colour: string;
};

export type ScheduleEvent = {
	name: string;
	start: string;
	end: string;
	repeats: string[];
	additionalInfo: string;
	colour: string;
	online: boolean;
};

export type Schedule = {
	createTime: string;
	name: string;
	scheduleStart: string;
	scheduleEnd: string;
	"24hr": boolean;
	colours: ColourEntry[];
	events: ScheduleEvent[];
};

export type PreferencesForm = {
	name: string;
	scheduleStart: string;
	scheduleEnd: string;
	is24hr: boolean;
	customColour: string;
};

export type EventForm = {
	name: string;
	additionalInfo: string;
	start: string;
	end: string;
	colour: string;
	online: boolean;
	monday: boolean;
	tuesday: boolean;
	wednesday: boolean;
	thursday: boolean;
	friday: boolean;
	saturday: boolean;
	sunday: boolean;
};
