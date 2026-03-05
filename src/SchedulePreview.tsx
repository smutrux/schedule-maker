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
	const [h, m] = timeStr.split(":").map(Number);
	return h * 60 + m;
}

function formatTime(isoString: string, is24hr: boolean) {
	const d = new Date(isoString);
	const h = d.getUTCHours();
	const m = d.getUTCMinutes();
	const displayH = is24hr ? h : h % 12 || 12;
	const displayM = String(m).padStart(2, "0");
	return `${displayH}:${displayM}`;
}

// ── Shared grid builder (used by both preview and print) ──────────────────────

function ScheduleGrid({ schedule }: Props) {
	const startMin = getMinutes(schedule.scheduleStart);
	const endMin = getMinutes(schedule.scheduleEnd);
	const totalSlots = (endMin - startMin) / 30;

	let activeDays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
	const hasSaturday = schedule.events.some((e) =>
		e.repeats.includes("saturday"),
	);
	const hasSunday = schedule.events.some((e) => e.repeats.includes("sunday"));
	if (hasSaturday) activeDays.push("saturday");
	if (hasSunday) activeDays.unshift("sunday");
	activeDays.sort((a, b) => DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b));

	const gridTemplateColumns = `60px repeat(${activeDays.length}, 1fr)`;
	const gridTemplateRows = `40px repeat(${totalSlots}, minmax(0, 1fr))`;

	const timeSlots = Array.from({ length: totalSlots }, (_, i) => {
		const currentMin = startMin + i * 30;
		const hour = Math.floor(currentMin / 60);
		const min = currentMin % 60;
		const isHour = min === 0;
		const displayH = schedule["24hr"] ? hour : hour % 12 || 12;
		const displayM = min === 0 ? "00" : String(min);
		const ampm = schedule["24hr"] ? "" : hour >= 12 ? " PM" : " AM";
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
					<div key={day} className={`sp-header-cell${dayIdx === activeDays.length - 1 ? " sp-no-right-border" : ""}`}>
						{day.charAt(0).toUpperCase() + day.slice(1)}
					</div>
				))}

				{/* Time + background cells */}
				{timeSlots.map(({ i, isHour, label }) => {
					const borderClass = isHour ? "sp-border-black" : "sp-border-gray";
					const row = i + 2;
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
					const evtStart = new Date(event.start);
					const evtEnd = new Date(event.end);
					const evtStartMin =
						evtStart.getUTCHours() * 60 + evtStart.getUTCMinutes();
					const evtEndMin = evtEnd.getUTCHours() * 60 + evtEnd.getUTCMinutes();

					// Exact slot positions (may be fractional for off-grid times)
					const startSlotExact = (evtStartMin - startMin) / 30;
					const endSlotExact = (evtEndMin - startMin) / 30;

					const startSlotFloor = Math.floor(startSlotExact);
					const endSlotCeil = Math.ceil(endSlotExact);

					// Fraction into the first row where the card actually starts (0–<1)
					const topFraction = startSlotExact - startSlotFloor;

					// The wrapper spans whole rows; the card is absolutely positioned inside
					const gridRowStart = startSlotFloor + 2;
					const gridRowSpan = endSlotCeil - startSlotFloor;

					// top% and height% are relative to the wrapper's height (= gridRowSpan rows)
					const topPct = (topFraction / gridRowSpan) * 100;
					const heightPct = ((endSlotExact - startSlotExact) / gridRowSpan) * 100;

					const timeLabel = `${formatTime(event.start, schedule["24hr"])} - ${formatTime(event.end, schedule["24hr"])}`;

					return event.repeats.flatMap((day) => {
						const colIndex = activeDays.indexOf(day.toLowerCase());
						if (colIndex === -1) return [];
						const borderColor = colIndex % 2 === 0 ? "#eeeeee" : "#ffffff";
						const strokeW = 12;
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
									}}
								>
								{/* SVG border overlay — solid for in-person, round-capped dashes for online */}
								<svg className="sp-event-border" aria-hidden="true">
									<rect
										x={0}
										y={0}
										width="100%"
										height="100%"
										fill="none"
										stroke={borderColor}
										strokeWidth={strokeW}
										strokeLinecap={event.online ? "round" : "butt"}
										strokeDasharray={event.online ? "16 24" : "none"}
										rx={12}
									/>
								</svg>
								<span className="sp-event-name">{event.name}</span>
								<strong className="sp-event-time">{timeLabel}</strong>
								{event.additionalInfo && (
									<span className="sp-event-info">{event.additionalInfo}</span>
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
	const ref = useRef<HTMLDivElement>(null);

	// Ensure the print root is always a direct child of <body>
	// so @media print { body > * } targeting works correctly
	useEffect(() => {
		const el = ref.current;
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