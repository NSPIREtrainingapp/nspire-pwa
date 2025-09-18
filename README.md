# NSPIRE Training App

A web-based application for organizing and managing NSPIRE inspection training materials and images.

## Features

- Image organization tool for NSPIRE deficiency documentation
- Drag-and-drop interface
- Standards and deficiencies catalog
- Responsive design
- Per-location weighted scoring using HUD sampling rules and a severity×location weight matrix

## Setup

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/nspire-training-app.git
cd nspire-training-app
```

2. Start a local server (using Python for example)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

3. Open your browser and navigate to `http://localhost:8000`

## Usage

- Drag and drop images directly into the placeholder boxes for each deficiency
- Remove images by clicking the × button that appears when hovering over an image
- Scroll through standards and deficiencies while the interface remains responsive
- Enter the total number of units to automatically calculate the HUD sample size and show per-location weighted scores.

### Weighted Scoring

The app computes a per-location score for each deficiency criteria line:

1. You enter Total Units on the property.
2. The app looks up the sample size in `src/score/hud_sampling_table.json`.
3. For every Location/Severity line it reads a base value from `src/score/severity_location_weights.json`.
4. Score = (base value ÷ sample size), rounded to 2 decimals, displayed beside the line.

Example: 50 units → sample size 20. LIFE THREATENING + UNIT has base 60.0 → 60 / 20 = 3.00.

To adjust scoring:
- Edit `src/score/severity_location_weights.json` for base values.
- Edit `src/score/hud_sampling_table.json` for sampling boundaries.

Both files are plain JSON so you can update them without code changes.

## Development

The application is built using pure HTML, CSS, and JavaScript without any external dependencies.

### File Overview (Scoring)
- `src/score/severity_location_weights.json`: Single source of truth for 24 base weights (Severity × Location).
- `src/score/hud_sampling_table.json`: Maps total unit count ranges to required sample size.
- `index.html`: Loads both JSON files and calculates per-location scores dynamically.

### Future Enhancements
- Add aggregation of total score across all observed deficiencies.
- Provide an export (CSV/JSON) of calculated impacts.
- Inline editor for adjusting matrix values from the UI.
