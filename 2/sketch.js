/* =========================================================================
   PCD Bangalore — Logo Option 2
   "Trail Type"

   Inspired by the reference poster: repeated lines of type, each set inside
   its own solid-color band, riding a wave that undulates as the line runs.
   Click and drag on the canvas — the trail follows your horizontal motion,
   while each stamp's vertical position rides a sine wave (never rotating),
   so the three bands ("PCD" / "BLR" / "2026") stay flat and legible and
   just bob up and down like the reference's flowing ribbon. A palette
   dropdown switches all three bands at once between the pure #f00/#0f0/#00f
   primaries and a softer, harmonious triad.
   ========================================================================= */

var textSizeVal = 26, textSizeValMin = 14, textSizeValMax = 64, textSizeValStep = 1;
var bandPadding = 8, bandPaddingMin = 2, bandPaddingMax = 30, bandPaddingStep = 1;
var stampSpacing = 14, stampSpacingMin = 4, stampSpacingMax = 50, stampSpacingStep = 1;
var opacity = 255, opacityMin = 60, opacityMax = 255, opacityStep = 5;
var waveAmp = 18, waveAmpMin = 0, waveAmpMax = 60, waveAmpStep = 1;
var waveFreq = 0.12, waveFreqMin = 0.02, waveFreqMax = 0.6, waveFreqStep = 0.01;
var seed = 7, seedMin = 1, seedMax = 200, seedStep = 1;
var animate = false;

// p5.gui turns a bound array-of-strings global into a dropdown automatically
var fontChoice = ['Anek Latin', 'Space Mono', 'Doto', 'Geist Pixel'];
var paletteChoice = ['Primary (RGB)', 'Harmonious'];

var CANVAS_SIZE = 640;
var gui;
var PALETTES; // filled in setup() once color() is available
var lastStampX = null, lastStampY = null;
var stampCount = 0;
var pulsePhase = 0;

var NUMERIC_CONTROLS = [
  ['textSizeVal', textSizeValMin, textSizeValMax, textSizeValStep],
  ['bandPadding', bandPaddingMin, bandPaddingMax, bandPaddingStep],
  ['stampSpacing', stampSpacingMin, stampSpacingMax, stampSpacingStep],
  ['opacity', opacityMin, opacityMax, opacityStep],
  ['waveAmp', waveAmpMin, waveAmpMax, waveAmpStep],
  ['waveFreq', waveFreqMin, waveFreqMax, waveFreqStep],
  ['seed', seedMin, seedMax, seedStep]
];
var BOOLEAN_CONTROLS = ['animate'];

function setup() {
  var canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  canvas.parent(document.querySelector('main'));
  colorMode(RGB, 255);
  rectMode(CENTER);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);

  PALETTES = {
    'Primary (RGB)': [color('#f00'), color('#0f0'), color('#00f')],
    // a richer pastel triad (dusty pink / mint / powder blue)
    'Harmonious': [color('#E8829B'), color('#4FBFA0'), color('#5089C2')]
  };

  background(255);

  gui = createGui('Trail Type — controls');
  gui.setPosition(16, 16);
  // gui.prototype is the raw QuickSettings panel — p5.gui doesn't wrap
  // addButton, so we reach through to it directly.
  gui.prototype.addButton('Randomize', randomizeAll);
  gui.prototype.addButton('Clear canvas', clearCanvas);
  gui.addGlobals(
    'textSizeVal', 'bandPadding', 'stampSpacing',
    'opacity', 'waveAmp', 'waveFreq', 'seed', 'animate', 'fontChoice', 'paletteChoice'
  );
}

function randomizeAll() {
  NUMERIC_CONTROLS.forEach(function (entry) {
    var name = entry[0], mn = entry[1], mx = entry[2], step = entry[3];
    var steps = Math.round((mx - mn) / step);
    var val = mn + Math.round(random(steps)) * step;
    gui.prototype.setValue(name, val);
  });
  BOOLEAN_CONTROLS.forEach(function (name) {
    gui.prototype.setValue(name, random() < 0.5);
  });
}

function clearCanvas() {
  background(255);
  lastStampX = null;
  lastStampY = null;
  stampCount = 0;
}

function overCanvas(x, y) {
  return x >= 0 && x <= width && y >= 0 && y <= height;
}

function draw() {
  if (animate) {
    pulsePhase += 0.08;
  }

  if (!mouseIsPressed || !overCanvas(mouseX, mouseY) || lastStampX === null) {
    return;
  }

  var d = dist(mouseX, mouseY, lastStampX, lastStampY);
  if (d <= stampSpacing) {
    return;
  }

  var steps = Math.max(1, Math.floor(d / stampSpacing));
  for (var i = 1; i <= steps; i++) {
    var t = i / steps;
    var x = lerp(lastStampX, mouseX, t);
    var y = lerp(lastStampY, mouseY, t);
    stampText(x, y);
  }
  lastStampX = mouseX;
  lastStampY = mouseY;
}

function mousePressed() {
  if (!overCanvas(mouseX, mouseY)) {
    return;
  }
  lastStampX = mouseX;
  lastStampY = mouseY;
  stampText(mouseX, mouseY);
}

function stampText(x, y) {
  stampCount++;
  randomSeed(seed * 1000 + stampCount);

  // No rotation — the stamp always stays upright. The only motion besides
  // following the drag is this sine wave riding on the vertical position.
  var waveY = sin(stampCount * waveFreq) * waveAmp;
  var sizeNow = textSizeVal + (animate ? sin(pulsePhase) * textSizeVal * 0.15 : 0);

  push();
  translate(x, y + waveY);
  textFont(fontChoice); // p5.gui rewrites fontChoice to the selected string
  textSize(sizeNow);

  // All three bands share one width — the widest line ("2026") sets it —
  // so the stack always reads as a clean, evenly-edged block. Text stays
  // centered (textAlign CENTER) inside that shared width. Band height
  // scales with textSizeVal, and rows are spaced by exactly that height
  // so they sit flush against each other with no gap.
  var w = max(textWidth('PCD'), textWidth('BLR'), textWidth('2026')) + bandPadding * 2;
  var h = textSizeVal + bandPadding * 1.2;
  var cols = PALETTES[paletteChoice]; // p5.gui rewrites paletteChoice to the selected string

  drawBand('PCD', 0, -h, cols[0], w, h);
  drawBand('BLR', 0, 0, cols[1], w, h);
  drawBand('2026', 0, h, cols[2], w, h);
  pop();
}

function drawBand(txt, x, y, col, w, h) {
  noStroke();
  fill(red(col), green(col), blue(col), opacity);
  rect(x, y, w, h);

  fill(255, 255, 255, opacity);
  text(txt, x, y);
}
