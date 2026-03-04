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
	const displayM = m === 0 ? "00" : String(m);
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
	const gridTemplateRows = `40px repeat(${totalSlots}, 1fr)`;

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
				{activeDays.map((day) => (
					<div key={day} className="sp-header-cell">
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
								className={`sp-grid-cell ${borderClass} ${colIdx % 2 === 0 ? "sp-col-alt-1" : "sp-col-alt-2"}`}
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
					const startRow = (evtStartMin - startMin) / 30 + 2;
					const spanRows = (evtEndMin - evtStartMin) / 30;
					const timeLabel = `${formatTime(event.start, schedule["24hr"])} - ${formatTime(event.end, schedule["24hr"])}`;

					return event.repeats.flatMap((day) => {
						const colIndex = activeDays.indexOf(day.toLowerCase());
						if (colIndex === -1) return [];
						return (
							<div
								key={`${event.name}-${day}`}
								className="sp-event-card"
								style={{
									backgroundColor: event.colour,
									gridColumn: colIndex + 2,
									gridRow: `${startRow} / span ${spanRows}`,
									// if event is online, add dashed border
									borderStyle: event.online ? "dashed" : "none",
									// background-image: event.online ? "none" : "url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='3' ry='3' stroke='black' stroke-width='8' stroke-dasharray='16' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e")",
								}}
							>
								<span className="sp-event-name">{event.name}</span>
								<strong className="sp-event-time">{timeLabel}</strong>
								{event.additionalInfo && (
									<span className="sp-event-info">{event.additionalInfo}</span>
								)}
								{event.online && (
									<span className="sp-event-online">Online</span>
								)}
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
