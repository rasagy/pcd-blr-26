/* =========================================================================
   PCD Bangalore — Logo Option 3
   "Letter Wave"

   Inspired by reference/letter-wave.jpg (Kunstmaand Amsterdam poster):
   a word repeated over and over along a curving path, shrinking and
   fading as it trails away from a central, full-size instance.

   Here: "PCD" repeats and trails upward (curving away, shrinking, fading),
   "BLR" repeats and trails downward — the two meeting at the centre.
   ========================================================================= */

// --- p5.gui-bound globals ---------------------------------------------------
// NOTE: must be `var` (not `let`/`const`) — p5.gui's addGlobals() binds to
// `window[name]`, and a top-level `let`/`const` never attaches to `window`.

var letterSize = 92, letterSizeMin = 40, letterSizeMax = 140, letterSizeStep = 2;
var wordGap = 18, wordGapMin = 0, wordGapMax = 80, wordGapStep = 2;
var trailCount = 11, trailCountMin = 3, trailCountMax = 22, trailCountStep = 1;

var waveCurve = 9, waveCurveMin = 0, waveCurveMax = 30, waveCurveStep = 0.5;   // degrees turned per step
var waveSpread = 46, waveSpreadMin = 10, waveSpreadMax = 100, waveSpreadStep = 1; // px between steps
var spreadGrowth = 1.0, spreadGrowthMin = 0.85, spreadGrowthMax = 1.2, spreadGrowthStep = 0.01; // step distance multiplier per iteration
var mirrorTrails = true; // BLR bends the opposite way to PCD, like an S-curve

var shrinkRate = 0.9, shrinkRateMin = 0.6, shrinkRateMax = 0.99, shrinkRateStep = 0.01;
var fadeRate = 0.88, fadeRateMin = 0.5, fadeRateMax = 1.0, fadeRateStep = 0.01;
var minOpacity = 4, minOpacityMin = 0, minOpacityMax = 40, minOpacityStep = 1;

var baseHue = 8, baseHueMin = 0, baseHueMax = 360, baseHueStep = 1;
var baseSat = 78, baseSatMin = 0, baseSatMax = 100, baseSatStep = 1;
var bgBri = 52, bgBriMin = 10, bgBriMax = 95, bgBriStep = 1;

var seed = 7, seedMin = 1, seedMax = 200, seedStep = 1;
var jitter = 2, jitterMin = 0, jitterMax = 20, jitterStep = 1;

var animate = false;
var waveSpeed = 0.4, waveSpeedMin = 0.05, waveSpeedMax = 2, waveSpeedStep = 0.05;

// Only these four approved typefaces (see CLAUDE.md § Typography). p5.gui
// turns an array-of-strings global into a dropdown automatically.
var fontChoice = ['Anek Latin', 'Space Mono', 'Doto', 'Geist Pixel'];
var FONT_CHOICES = fontChoice.slice();

var gui;
var animPhase = 0;
var CANVAS_SIZE = 640;

var NUMERIC_CONTROLS = [
  ['letterSize', letterSizeMin, letterSizeMax, letterSizeStep],
  ['wordGap', wordGapMin, wordGapMax, wordGapStep],
  ['trailCount', trailCountMin, trailCountMax, trailCountStep],
  ['waveCurve', waveCurveMin, waveCurveMax, waveCurveStep],
  ['waveSpread', waveSpreadMin, waveSpreadMax, waveSpreadStep],
  ['spreadGrowth', spreadGrowthMin, spreadGrowthMax, spreadGrowthStep],
  ['shrinkRate', shrinkRateMin, shrinkRateMax, shrinkRateStep],
  ['fadeRate', fadeRateMin, fadeRateMax, fadeRateStep],
  ['minOpacity', minOpacityMin, minOpacityMax, minOpacityStep],
  ['baseHue', baseHueMin, baseHueMax, baseHueStep],
  ['baseSat', baseSatMin, baseSatMax, baseSatStep],
  ['bgBri', bgBriMin, bgBriMax, bgBriStep],
  ['seed', seedMin, seedMax, seedStep],
  ['jitter', jitterMin, jitterMax, jitterStep],
  ['waveSpeed', waveSpeedMin, waveSpeedMax, waveSpeedStep]
];
var BOOLEAN_CONTROLS = ['animate', 'mirrorTrails'];

function setup() {
  const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  canvas.parent(document.querySelector('main'));
  colorMode(HSB, 360, 100, 100, 100);
  angleMode(DEGREES);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);

  gui = createGui('Letter Wave — controls');
  gui.setPosition(16, 16);
  gui.prototype.addButton('Randomize', randomizeAll);
  gui.addGlobals(
    'letterSize', 'wordGap', 'trailCount',
    'waveCurve', 'waveSpread', 'spreadGrowth', 'mirrorTrails',
    'shrinkRate', 'fadeRate', 'minOpacity',
    'baseHue', 'baseSat', 'bgBri',
    'seed', 'jitter',
    'animate', 'waveSpeed',
    'fontChoice'
  );
}

function randomizeAll() {
  NUMERIC_CONTROLS.forEach(function (entry) {
    const name = entry[0], mn = entry[1], mx = entry[2], step = entry[3];
    const steps = Math.round((mx - mn) / step);
    const val = mn + Math.round(random(steps)) * step;
    gui.prototype.setValue(name, val);
  });
  BOOLEAN_CONTROLS.forEach(function (name) {
    gui.prototype.setValue(name, random() < 0.5);
  });
  // dropdown control expects an index, not the string itself
  gui.prototype.setValue('fontChoice', Math.floor(random(FONT_CHOICES.length)));
}

function draw() {
  background(baseHue, baseSat * 0.9, bgBri);
  textFont(fontChoice);

  if (animate) {
    animPhase += waveSpeed;
  }

  randomSeed(seed);

  const cx = width / 2;
  const cy = height / 2;

  // Pick letter brightness from whichever end of the HSB brightness range
  // sits furthest from the background, so text and bg never randomize into
  // near-identical tones. The two words get slightly different shades of
  // that same end, for a bit of depth without ever closing the contrast gap.
  const anchor = bgBri < 50 ? 95 : 5;
  const shade = bgBri < 50 ? -8 : 8;

  // PCD trails upward from just above centre.
  drawWaveTrail('PCD', cx, cy - wordGap / 2, -1, 1, anchor);

  // BLR trails downward from just below centre.
  drawWaveTrail('BLR', cx, cy + wordGap / 2, 1, (mirrorTrails ? -1 : 1), anchor + shade);
}

// word      — text to repeat
// originX/Y — where the full-size (i = 0) instance sits
// dir       — -1 travels upward, +1 travels downward
// curveSign — which way the path bends (±1), lets PCD/BLR mirror each other
// briv      — letter brightness (HSB) for this word's trail
function drawWaveTrail(word, originX, originY, dir, curveSign, briv) {
  // heading is the direction of travel along the path (0 = +x/right,
  // 90 = +y/down in p5's screen coords). Text rotation is derived from it
  // (perpendicular to the path) but offset by ±90 depending on travel
  // direction so the letters stay right-side-up instead of upside-down.
  let heading = dir < 0 ? -90 : 90;
  const textRotOffset = dir < 0 ? 90 : -90;
  let px = originX;
  let py = originY;
  let step = waveSpread;
  const phase = animate ? animPhase * dir : 0;

  for (let i = 0; i <= trailCount; i++) {
    const size = max(2, letterSize * pow(shrinkRate, i));
    const alpha = max(minOpacity, 100 * pow(fadeRate, i));

    push();
    translate(px, py);
    rotate(heading + textRotOffset + phase * 0.3);
    noStroke();
    fill(baseHue, baseSat, briv, alpha);
    textSize(size);
    text(word, 0, 0);
    pop();

    // advance along the curving path for the next (smaller) copy
    heading += curveSign * waveCurve;
    const jx = jitter > 0 ? random(-jitter, jitter) : 0;
    const jy = jitter > 0 ? random(-jitter, jitter) : 0;
    px += cos(heading) * step + jx;
    py += sin(heading) * step + jy;
    step *= spreadGrowth;
  }
}
