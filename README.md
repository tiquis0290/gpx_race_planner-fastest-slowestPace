# Changed how segments are created and added custom export to garmin pace pro
**Live demo:** [https://gpx.maslowski.cz](https://gpx.maslowski.cz)

to upload custom pace pro pplan you can use my [firefox extension](https://addons.mozilla.org/en-US/firefox/addon/garminconnect-pacepro-loader/)



# GPX Race Planner

[![Deploy](https://github.com/martinkobelka/gpx_race_planner/actions/workflows/deploy.yml/badge.svg)](https://github.com/martinkobelka/gpx_race_planner/actions/workflows/deploy.yml)

A browser-based tool for planning race pacing strategies from a GPX file or manually defined segments.

**Live demo:** [https://gpx.martinkobelka.cz](https://gpx.martinkobelka.cz)

![Screenshot](screenshot.png)

## Features

- **GPX mode** — upload a `.gpx` track file; elevation data is parsed and smoothed automatically
- **Manual mode** — define segments by distance and elevation change without a GPX file
- **Automatic segment classification** — each segment is labelled uphill / flat / downhill based on a configurable slope threshold (m/km)
- **5 effort models** for pace adjustment on climbs and descents:
  - Linear (default)
  - Power
  - Exponential
  - Strava GAP (approximation of Strava's grade-adjusted pace curve)
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
