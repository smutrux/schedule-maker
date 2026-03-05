# Pretty Schedule Maker

A weekly schedule builder that lets you create named schedules, add timed events, preview the result as a letter-sized page, and export it as PDF, JPEG, or JSON.

![Pretty Schedule Maker favicon](public/favicon.svg)

## Features

- **Weekly grid** — Mon–Fri by default, with Saturday and Sunday added automatically when events are scheduled on those days
- **Flexible time range** — set any earliest start and latest end time; the grid fills the full page height regardless of the range
- **12hr / 24hr toggle** — switch display format when creating a schedule
- **Off-grid event placement** — events that start at non-30-minute boundaries (e.g. 9:10, 14:45) are positioned with sub-row precision
- **Custom colours** — pick any colour via an integrated colour picker with hex input; colour names are looked up automatically via [The Color Name API](https://www.thecolorapi.com) with a local fallback
- **Online / in-person indicator** — online events get a dashed border, in-person events get a solid one
- **Export options** — download as PDF (letter size), high-resolution JPEG (3× pixel density), or JSON
- **Import** — load a previously exported JSON schedule back into the app
- **Print** — print directly from the browser with a dedicated print stylesheet
- **Persistent storage** — schedules are saved to localStorage and restored on next visit

## Tech Stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev)
- [react-colorful](https://github.com/omgovich/react-colorful) — colour picker
- [html2canvas](https://html2canvas.hertzen.com) — PDF and JPEG capture
- [jsPDF](https://github.com/parallax/jsPDF) — PDF generation

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm

### Install and run

```bash
git clone https://github.com/smutrux/schedule-maker.git
cd schedule-maker
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

### Deploy to GitHub Pages

```bash
npm run deploy
```

This runs the build and pushes the output to the `gh-pages` branch. The live site is at:

```
https://smutrux.github.io/schedule-maker/
```

## Usage

1. Click **Start New** to create a schedule — give it a name, set the time range, and choose 12hr or 24hr format
2. Click **Add Item** to add an event — set the title, time, colour, days of the week, and whether it's online
3. Click **Preview Schedule** to see the letter-sized page
4. Use **Download** to export as PDF, JPEG, or JSON
5. Use **Import** to load a saved JSON schedule
6. Click **Edit Preferences** to rename the schedule or add a custom colour
7. **Remove Last Item** removes the most recently added event

## Project Structure

```
src/
├── App.tsx                  # Main component, all state
├── SchedulePreview.tsx      # Grid renderer, print root, preview
├── SchedulePreview.css      # Grid styles and print media query
├── scheduleUtils.ts         # Pure helpers: build, validate, export, storage
├── schedule.types.ts        # TypeScript types
└── components/
    ├── Button/
    ├── Input/               # TextInput, Checkbox, ColourPicker, TimePicker, Dropdown
    └── Modal/
```