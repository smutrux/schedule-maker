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
