/**
 * SchedulePreview.tsx
 *
 * Renders the visual weekly schedule grid — shared between the modal preview
 * and the hidden print/capture target.
 *
 * Exports:
 *  SchedulePreview    — render-only grid for display inside the preview modal.
 *  SchedulePrintRoot  — hidden container mounted directly on <body> so that
 *                       @media print { body > * } targeting works correctly.
 *                       Also used as the capture target for PDF / JPEG export.
 *  printSchedule      — calls window.print() to trigger the browser print dialog.
 *
 * Grid layout:
 *  Column 0     — time labels (60px fixed)
 *  Columns 1..N — one per active day (Mon–Fri always; Sat/Sun added dynamically)
 *  Row 0        — day headers
 *  Rows 1..M    — 30-minute slots covering scheduleStart → scheduleEnd
 *
 * Event positioning:
 *  Each event card spans one or more slot rows via CSS grid-row.
 *  Off-grid start/end times are handled with fractional top% / height% values
 *  inside an absolutely positioned wrapper that occupies the full row span.
 */
import { useEffect, useRef } from "react";
import type { Schedule } from "./schedule.types";
import "./SchedulePreview.css";

type Props = { schedule: Schedule };

const DAYS_ORDER = [
	"sunday",
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
];

function getMinutes(timeStr: string) {
	let [h, m] = timeStr.split(":").map(Number);
	return h * 60 + m;
}

function formatTime(isoString: string, is24hr: boolean) {
	let d = new Date(isoString);
	let h = d.getUTCHours();
	let m = d.getUTCMinutes();
	let displayH = is24hr ? h : h % 12 || 12;
	let displayM = String(m).padStart(2, "0");
	return `${displayH}:${displayM}`;
}

// Returns "#000" or "#fff" depending on which has better contrast against the
// given hex background, using the WCAG relative luminance formula.
function readableTextColour(hex: string): "#000000" | "#ffffff" {
	let n = parseInt(hex.replace("#", ""), 16);
	let toLinear = (c: number) => {
		let s = c / 255;
		return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	};
	let r = toLinear((n >> 16) & 255);
	let g = toLinear((n >> 8) & 255);
	let b = toLinear(n & 255);
	let L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	return L > 0.179 ? "#000000" : "#ffffff";
}

// ── Shared grid builder (used by both preview and print) ──────────────────────

function ScheduleGrid({ schedule }: Props) {
	let startMin = getMinutes(schedule.scheduleStart);
	let endMin = getMinutes(schedule.scheduleEnd);
	let totalSlots = (endMin - startMin) / 30;

	let activeDays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
	let hasSaturday = schedule.events.some((e) => e.repeats.includes("saturday"));
	let hasSunday = schedule.events.some((e) => e.repeats.includes("sunday"));
	if (hasSaturday) activeDays.push("saturday");
	if (hasSunday) activeDays.unshift("sunday");
	activeDays.sort((a, b) => DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b));

	let gridTemplateColumns = `60px repeat(${activeDays.length}, 1fr)`;
	let gridTemplateRows = `40px repeat(${totalSlots}, minmax(0, 1fr))`;

	let timeSlots = Array.from({ length: totalSlots }, (_, i) => {
		let currentMin = startMin + i * 30;
		let hour = Math.floor(currentMin / 60);
		let min = currentMin % 60;
		let isHour = min === 0;
		let displayH = schedule["24hr"] ? hour : hour % 12 || 12;
		let displayM = min === 0 ? "00" : String(min);
		let ampm = schedule["24hr"] ? "" : hour >= 12 ? " PM" : " AM";
		return { i, isHour, label: `${displayH}:${displayM}${ampm}` };
	});

	return (
		<div className="sp-page">
			<h2 className="sp-title">{schedule.name}</h2>
			<div
				className="sp-grid"
				style={{ gridTemplateColumns, gridTemplateRows }}
			>
				{/* Headers */}
				<div className="sp-header-cell">Time</div>
				{activeDays.map((day, dayIdx) => (
					<div
						key={day}
						className={`sp-header-cell${dayIdx === activeDays.length - 1 ? " sp-no-right-border" : ""}`}
					>
						{day.charAt(0).toUpperCase() + day.slice(1)}
					</div>
				))}

				{/* Time + background cells */}
				{timeSlots.map(({ i, isHour, label }) => {
					let borderClass = isHour ? "sp-border-black" : "sp-border-gray";
					let row = i + 2;
					return [
						<div
							key={`time-${i}`}
							className={`sp-time-cell ${borderClass}`}
							style={{ gridRow: row, gridColumn: 1 }}
						>
							<span
								className="sp-time-text"
								style={{ fontWeight: isHour ? "bold" : "normal" }}
							>
								{label}
							</span>
						</div>,
						...activeDays.map((day, colIdx) => (
							<div
								key={`cell-${i}-${day}`}
								className={`sp-grid-cell ${borderClass} ${colIdx % 2 === 0 ? "sp-col-alt-1" : "sp-col-alt-2"}${colIdx === activeDays.length - 1 ? " sp-no-right-border" : ""}`}
								style={{ gridRow: row, gridColumn: colIdx + 2 }}
							/>
						)),
					];
				})}

				{/* Event cards */}
				{schedule.events.flatMap((event) => {
					let evtStart = new Date(event.start);
					let evtEnd = new Date(event.end);
					let evtStartMin =
						evtStart.getUTCHours() * 60 + evtStart.getUTCMinutes();
					let evtEndMin = evtEnd.getUTCHours() * 60 + evtEnd.getUTCMinutes();

					// Exact slot positions (may be fractional for off-grid times)
					let startSlotExact = (evtStartMin - startMin) / 30;
					let endSlotExact = (evtEndMin - startMin) / 30;

					let startSlotFloor = Math.floor(startSlotExact);
					let endSlotCeil = Math.ceil(endSlotExact);

					// Fraction into the first row where the card actually starts (0–<1)
					let topFraction = startSlotExact - startSlotFloor;

					// The wrapper spans whole rows; the card is absolutely positioned inside
					let gridRowStart = startSlotFloor + 2;
					let gridRowSpan = endSlotCeil - startSlotFloor;

					// top% and height% are relative to the wrapper's height (= gridRowSpan rows)
					let topPct = (topFraction / gridRowSpan) * 100;
					let heightPct = ((endSlotExact - startSlotExact) / gridRowSpan) * 100;

					let timeLabel = `${formatTime(event.start, schedule["24hr"])} - ${formatTime(event.end, schedule["24hr"])}`;

					return event.repeats.flatMap((day) => {
						let colIndex = activeDays.indexOf(day.toLowerCase());
						if (colIndex === -1) return [];
						let borderColor = colIndex % 2 === 0 ? "#eeeeee" : "#ffffff";
						let strokeW = 6;
						let textColour = readableTextColour(event.colour);
						return (
							// Transparent wrapper occupies the exact grid rows
							<div
								key={`${event.name}-${day}`}
								className="sp-event-wrapper"
								style={{
									gridColumn: colIndex + 2,
									gridRow: `${gridRowStart} / span ${gridRowSpan}`,
								}}
							>
								{/* Card is absolutely positioned inside the wrapper */}
								<div
									className="sp-event-card"
									style={{
										backgroundColor: event.colour,
										top: `${topPct}%`,
										height: `calc(${heightPct}% - 1px)`,
										border: `1px solid ${borderColor}`,
										color: textColour,
									}}
								>
									{/* SVG border overlay — solid for in-person, dashes for online */}
									{event.online ? (
										<svg className="sp-event-border" aria-hidden="true">
											{/* top */}
											<line
												x1="0"
												y1="0"
												x2="100%"
												y2="0"
												stroke={borderColor}
												strokeWidth={2 * strokeW}
												strokeLinecap="round"
												strokeDasharray="11 21"
											/>
											{/* bottom */}
											<line
												x1="0"
												y1="100%"
												x2="100%"
												y2="100%"
												stroke={borderColor}
												strokeWidth={2 * strokeW}
												strokeLinecap="round"
												strokeDasharray="11 21"
											/>
											{/* left */}
											<line
												x1="0"
												y1="0"
												x2="0"
												y2="100%"
												stroke={borderColor}
												strokeWidth={2 * strokeW}
												strokeLinecap="round"
												strokeDasharray="11 21"
											/>
											{/* right */}
											<line
												x1="100%"
												y1="0"
												x2="100%"
												y2="100%"
												stroke={borderColor}
												strokeWidth={2 * strokeW}
												strokeLinecap="round"
												strokeDasharray="11 21"
											/>
										</svg>
									) : (
										<svg className="sp-event-border" aria-hidden="true">
											<rect
												x={strokeW / 2}
												y={strokeW / 2}
												width={`calc(100% - ${strokeW}px)`}
												height={`calc(100% - ${strokeW}px)`}
												fill="none"
												stroke={borderColor}
												strokeWidth={strokeW}
												rx={12 - strokeW / 2}
											/>
										</svg>
									)}
									<span className="sp-event-name">{event.name}</span>
									<strong className="sp-event-time">{timeLabel}</strong>
									{event.additionalInfo && (
										<span className="sp-event-info">
											{event.additionalInfo}
										</span>
									)}
									{event.online && (
										<span className="sp-event-online">Online</span>
									)}
								</div>
							</div>
						);
					});
				})}
			</div>
		</div>
	);
}

// ── Visible preview (shown in modal) ─────────────────────────────────────────

export function SchedulePreview({ schedule }: Props) {
	return <ScheduleGrid schedule={schedule} />;
}

// ── Hidden print target (always mounted at body level) ────────────────────────

export function SchedulePrintRoot({ schedule }: Props) {
	let ref = useRef<HTMLDivElement>(null);

	// Ensure the print root is always a direct child of <body>
	// so @media print { body > * } targeting works correctly
	useEffect(() => {
		let el = ref.current;
		if (!el) return;
		document.body.appendChild(el);
		return () => {
			document.body.removeChild(el);
		};
	}, []);

	return (
		<div ref={ref} className="sp-print-root">
			<ScheduleGrid schedule={schedule} />
		</div>
	);
}

// ── Print trigger ─────────────────────────────────────────────────────────────

export function printSchedule() {
	window.print();
}
