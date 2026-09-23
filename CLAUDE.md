# Processing Community Day, Bangalore – Generative Logos

## Project Overview
Creating 5 dynamic, generative logo options for Processing Community Day, Bangalore (PCD BLR) using p5.js. Each option explores a different visual approach to represent the community and Processing's core ethos, with interactive GUI controls for real-time parameter tweaking.

## Folder Structure
```
/1 - Concept 1 (index.html, sketch.js, lib/, reference images) — Blue Pottery Mandala built from rotating pixelated tech-cursor icons (arrow, hand, hourglass, gear, power, wifi, terminal, bolt)
/2 - Concept 2 (index.html, sketch.js, lib/, reference images) — Trail Type: click-drag paints a non-rotating "PCD / BLR / 2026" band stack that waves vertically along the trail, in a primary-RGB or pastel-harmonious palette
/3 - Concept 3 (index.html, sketch.js, lib/, reference images) — Letter Wave
/4 - Concept 4 (index.html, sketch.js, lib/, reference images)
/5 - Concept 5 (index.html, sketch.js, lib/, reference images) — Type Rotate: "PCD • BLR" fans out clockwise from the center dot as fading, concentric radial trails
/discarded - Previous attempts (archived)
```

## Technical Stack
- **Framework**: p5.js (loaded from the cdnjs CDN)
- **GUI Library**: [p5.gui](https://bitcraftlab.github.io/p5.gui/) – interactive controls for parameter tweaking, built on QuickSettings
- **Format**: Static HTML + JavaScript sketches
- **Structure**: Each concept folder contains:
  - `index.html` - HTML wrapper with p5.js CDN link + local p5.gui/quicksettings script tags
  - `sketch.js` - p5.js sketch with GUI controls
  - `lib/quicksettings.js`, `lib/p5.gui.js` - **self-hosted** copies of the GUI library (see below for why)
  - `reference/` - Reference images for visual inspiration

## Design Principles
- Generative & dynamic (changes on each run, customizable via GUI)
- Interactive controls to tweak parameters in real-time
- Representative of Processing community values: art, code, creative expression
- Works as a logo (recognizable, scalable, distinctive)
- Performance-optimized for web/social use
- Incorporates BLR/PCD visual or conceptual elements where appropriate

## p5.gui Implementation

Each sketch should include interactive sliders/controls for, at minimum:
- Animation speed/frequency (+ an `animate` boolean toggle)
- Color hue/saturation
- Scale/size (overall logo diameter)
- Complexity/detail level, and any ring/repeat/symmetry counts
- A `seed` slider so dragging it produces a new generative variant
- Other concept-specific parameters
- A **Randomize** button that rolls new values for every control at once

### Library setup (self-hosted, not CDN)
`p5.gui.js` is old/unmaintained and not on npm, so don't link it from a CDN
(GitHub-raw-via-jsdelivr has served it with the wrong content-type before,
causing scripts to silently fail to execute). Instead copy the two library
files into each concept's own `lib/` folder and reference them locally:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"></script>
<script src="lib/quicksettings.js"></script>
<script src="lib/p5.gui.js"></script>
```

The five concept folders already each have their own `lib/quicksettings.js`
and `lib/p5.gui.js` (copied from option 1) — reuse those, don't re-fetch.

### Two non-obvious gotchas that will silently break every control

1. **Declare bound params with `var`, never `let`/`const`.**
   `gui.addGlobals('foo', 'bar')` binds to `window.foo`/`window.bar`. A
   top-level `let`/`const` never attaches to `window`, so the control is
   created against `undefined` and either doesn't render or does nothing.

2. **Never name a param `hue`, `saturation`, `brightness`, `red`, `green`,
   `blue`, `lightness`, or `alpha`.** p5.js defines global functions with
   these exact names (`hue()`, `saturation()`, ...). p5 attaches them to
   `window` after your sketch script has already run, clobbering a
   same-named `var` — the slider silently disappears and the color drains
   out of the drawing. Prefix instead, e.g. `baseHue` / `baseSat`.

### Standard sketch skeleton

```js
var petals = 8, petalsMin = 5, petalsMax = 16, petalsStep = 1;
var baseHue = 213, baseHueMin = 180, baseHueMax = 250, baseHueStep = 1;
var seed = 7, seedMin = 1, seedMax = 200, seedStep = 1;
var animate = false;
// ...one var per control, each with Min/Max/Step companions for numbers

var gui; // global so the Randomize callback can reach gui.prototype

var NUMERIC_CONTROLS = [
  ['petals', petalsMin, petalsMax, petalsStep],
  ['baseHue', baseHueMin, baseHueMax, baseHueStep],
  ['seed', seedMin, seedMax, seedStep],
];
var BOOLEAN_CONTROLS = ['animate'];

function setup() {
  createCanvas(640, 640);
  colorMode(HSB, 360, 100, 100, 100);

  gui = createGui('<Concept name> — controls');
  gui.setPosition(16, 16);
  // gui.prototype is the raw QuickSettings panel — p5.gui doesn't wrap
  // addButton, so reach through to it directly for the Randomize button.
  gui.prototype.addButton('Randomize', randomizeAll);
  gui.addGlobals('petals', 'baseHue', 'seed', 'animate');
}

function randomizeAll() {
  NUMERIC_CONTROLS.forEach(function ([name, mn, mx, step]) {
    var steps = Math.round((mx - mn) / step);
    gui.prototype.setValue(name, mn + Math.round(random(steps)) * step);
  });
  BOOLEAN_CONTROLS.forEach(function (name) {
    gui.prototype.setValue(name, random() < 0.5);
  });
}
```

`gui.prototype.setValue(name, value)` updates both the slider UI and the
bound global in one call, so `draw()` (which should never call `noLoop()`)
picks up the change on the next frame automatically.

See [1/sketch.js](1/sketch.js) for a full working reference implementation.

## Typography
Type is meant to accompany the circular marks later, so any wordmark, label,
or type-on-canvas element **must** be set in one of these four typefaces —
no others:

- [Anek Latin](https://fonts.google.com/specimen/Anek+Latin) — chosen so we
  can try multilingual variants later (Anek has matching Devanagari, Tamil,
  Kannada, etc. companions under the same family design)
- [Space Mono](https://fonts.google.com/specimen/Space+Mono)
- [Doto](https://fonts.google.com/specimen/Doto)
- [Geist Pixel](https://fonts.google.com/specimen/Geist+Pixel)

### Loading the fonts
Pull all four from the Google Fonts CSS API in `index.html` (one link
covers all four families):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anek+Latin:wght@400;700&family=Space+Mono:wght@400;700&family=Doto:wght@400;700&family=Geist+Pixel&display=swap" rel="stylesheet">
```

Adjust the `:wght@` weights per font as needed — Doto and Geist Pixel may
only expose a subset of weights, check the specimen page linked above.

### Exposing it as a GUI control
p5.gui turns a bound array-of-strings global into a dropdown automatically
(see `bindDropDown` in `lib/p5.gui.js`), so declare the font choices as an
array and add it via `addGlobals` like any other control:

```js
var fontChoice = ['Anek Latin', 'Space Mono', 'Doto', 'Geist Pixel'];

function setup() {
  // ... createCanvas, colorMode, etc.
  gui.addGlobals('fontChoice' /* , ...other controls */);
}

function draw() {
  // ...
  textFont(fontChoice); // p5.gui rewrites fontChoice to the selected string
}
```

Don't hardcode a font choice in a sketch — always route it through this
dropdown so every concept can be tweaked to any of the four approved fonts.

## Local Preview Server
Sketches need to be served over HTTP (not opened as `file://`) for the GUI
scripts to load reliably. A `.claude/launch.json` config named
`static-server` runs `python3 -m http.server 8000` from the project root, so
every concept is reachable at `http://localhost:8000/<n>/index.html`.

**Always use port 8000, and never start a second server.** Before starting
one, check whether it's already up:

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

- If that prints a process, the server is already running — just navigate
  to `http://localhost:8000/<n>/index.html`, don't start another.
- If it prints nothing, start it via the `static-server` launch config (or
  `python3 -m http.server 8000` from the project root).

Port 8000 is reserved for this project's static server — don't reuse it for
anything else, and don't pick a different port "to be safe" if 8000 looks
busy; check what's on it first.

## Notes
- All sketches run client-side, no build process required
- Can be easily embedded in web pages or exported as static frames
- Each option represents a different visual philosophy with customizable behavior
