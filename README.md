# GPX Race Planner

A browser-based tool for planning race pacing strategies from a GPX file or manually defined segments.

**Live demo:** [https://gpx.martinkobelka.cz](https://gpx.martinkobelka.cz)

![Screenshot](screenshot.png)

## Features

- **GPX mode** — upload a `.gpx` track file; elevation data is parsed and smoothed automatically
- **Manual mode** — define segments by distance and elevation change without a GPX file
- **Automatic segment classification** — each segment is labelled uphill / flat / downhill based on a configurable slope threshold (m/km)
- **4 effort models** for pace adjustment on climbs and descents:
  - Linear (default)
  - Power
  - Exponential
  - Minetti (biomechanical model based on Minetti et al. 2002)
- **Split strategy** — negative, even, or positive split with adjustable strength
- **Interactive elevation chart** — hover segments to highlight them on the chart and in the table
- **Summary stats** — total distance, ascent, descent, estimated time and base pace
- **FIT workout export** — download a structured Garmin FIT file with per-segment pace targets
- **Multilingual UI** — Czech, Slovak, English

## Tech stack

- React 18 + TypeScript
- Vite
- Redux Toolkit + redux-persist
- PrimeReact 10 + PrimeFlex
- SCSS

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
