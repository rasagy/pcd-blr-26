/* =========================================================================
   PCD Bangalore — Logo Option 4
   "Radial Type"

   A pure-type mark: a comma-separated phrase is split into words, and each
   word becomes one strictly-concentric ring of type (no spiral, no drift —
   every ring shares one centre). By default the LAST word sits innermost
   (so "Processing, Community, Day, Bengaluru" puts Bengaluru at the centre
   and Processing outermost); `reverseOrder` flips that.

   Inspired by the reference: concentric rings of set type, alternating
   reading directions (so some rings read upside-down from outside), a
   couple of rings picked out in red among black, on cream paper.
   ========================================================================= */

// --- p5.gui-bound params -----------------------------------------------
// NOTE: every bound param is declared with `var` (never let/const) — p5.gui's
// addGlobals() binds to `window[name]`, and a top-level let/const never
// attaches to `window`, so the control would silently find nothing to bind
// to. Also: never name a param hue/saturation/brightness/red/green/blue/
// lightness/alpha — p5 defines its own same-named globals that would
// clobber ours after this script runs.

var words = 'Processing, Community, Day, Bengaluru';
var reverseOrder = false;

var fillMode = ['Once', 'Repeat'];
var textSizeVal = 28, textSizeValMin = 10, textSizeValMax = 64, textSizeValStep = 1;
var letterSpacing = 0, letterSpacingMin = -2, letterSpacingMax = 12, letterSpacingStep = 0.5;
var separator = [' · ', ' — ', '  ', ' • ', ' / '];

var innerRadius = 60, innerRadiusMin = 20, innerRadiusMax = 200, innerRadiusStep = 2;
var ringGap = 6, ringGapMin = -10, ringGapMax = 40, ringGapStep = 1;
var logoSize = 600, logoSizeMin = 300, logoSizeMax = 640, logoSizeStep = 10;

var startAngle = 0, startAngleMin = -180, startAngleMax = 180, startAngleStep = 1;
var offsetMode = ['Aligned', 'Step', 'Golden', 'Centred', 'Random'];
var offsetAmount = 24, offsetAmountMin = 0, offsetAmountMax = 180, offsetAmountStep = 1;
var direction = ['Clockwise', 'Counter-clockwise', 'Alternate', 'Random'];

var fontChoice = ['Anek Latin', 'Space Mono', 'Doto', 'Geist Pixel'];
var weightChoice = ['Regular', 'Bold'];

var baseHue = 0, baseHueMin = 0, baseHueMax = 360, baseHueStep = 1;
var baseSat = 0, baseSatMin = 0, baseSatMax = 100, baseSatStep = 1;
var baseBri = 12, baseBriMin = 0, baseBriMax = 100, baseBriStep = 1;
var accentHue = 355, accentHueMin = 0, accentHueMax = 360, accentHueStep = 1;
var accentMode = ['None', 'Innermost ring', 'Alternate rings', 'Random'];
var bgTone = 94, bgToneMin = 70, bgToneMax = 100, bgToneStep = 1;

var seed = 7, seedMin = 1, seedMax = 200, seedStep = 1;
var animate = false;
var rotationSpeed = 0.2, rotationSpeedMin = 0, rotationSpeedMax = 2, rotationSpeedStep = 0.02;

var gui; // global so the Randomize callback can reach gui.prototype

var CANVAS_SIZE = 640;
var SIZE_MIN = 8, SIZE_MAX = 80; // sanity guard on the textSizeVal slider
var ringRotation = []; // per-ring accumulated animation angle
var fontsReady = false;

// every numeric slider, for the Randomize button
var NUMERIC_CONTROLS = [
  ['textSizeVal', textSizeValMin, textSizeValMax, textSizeValStep],
  ['letterSpacing', letterSpacingMin, letterSpacingMax, letterSpacingStep],
  ['innerRadius', innerRadiusMin, innerRadiusMax, innerRadiusStep],
  ['ringGap', ringGapMin, ringGapMax, ringGapStep],
  ['logoSize', logoSizeMin, logoSizeMax, logoSizeStep],
  ['startAngle', startAngleMin, startAngleMax, startAngleStep],
  ['offsetAmount', offsetAmountMin, offsetAmountMax, offsetAmountStep],
  ['baseHue', baseHueMin, baseHueMax, baseHueStep],
  ['baseSat', baseSatMin, baseSatMax, baseSatStep],
  ['baseBri', baseBriMin, baseBriMax, baseBriStep],
  ['accentHue', accentHueMin, accentHueMax, accentHueStep],
  ['bgTone', bgToneMin, bgToneMax, bgToneStep],
  ['seed', seedMin, seedMax, seedStep],
  ['rotationSpeed', rotationSpeedMin, rotationSpeedMax, rotationSpeedStep]
];
var BOOLEAN_CONTROLS = ['reverseOrder', 'animate'];
var DROPDOWN_CONTROLS = [
  ['fillMode', fillMode],
  ['separator', separator],
  ['offsetMode', offsetMode],
  ['direction', direction],
  ['fontChoice', fontChoice],
  ['weightChoice', weightChoice],
  ['accentMode', accentMode]
];

function setup() {
  var canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  canvas.parent(document.querySelector('main'));
  colorMode(HSB, 360, 100, 100, 100);
  angleMode(RADIANS);
  textAlign(CENTER, CENTER);

  gui = createGui('Radial Type — controls');
  gui.setPosition(16, 16);
  // gui.prototype is the raw QuickSettings panel — p5.gui doesn't wrap
  // addButton, so reach through to it directly for the Randomize button.
  gui.prototype.addButton('Randomize', randomizeAll);
  gui.addGlobals(
    'words', 'reverseOrder',
    'fillMode', 'textSizeVal', 'letterSpacing', 'separator',
    'innerRadius', 'ringGap', 'logoSize',
    'startAngle', 'offsetMode', 'offsetAmount', 'direction',
    'fontChoice', 'weightChoice',
    'baseHue', 'baseSat', 'baseBri', 'accentHue', 'accentMode', 'bgTone',
    'seed', 'animate', 'rotationSpeed'
  );

  // Gate the first real draw on the four families actually being ready so
  // textWidth() metrics (used for ring sizing) aren't measured against a
  // fallback font, which would make the layout jump once fonts land.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { fontsReady = true; });
  } else {
    fontsReady = true;
  }
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
  DROPDOWN_CONTROLS.forEach(function (entry) {
    var name = entry[0], options = entry[1];
    // QuickSettings' dropdown setValue takes the option INDEX (or
    // {index: n}), not the option string itself — passing the string
    // straight through indexes `options[str]`, which is undefined.
    gui.prototype.setValue(name, Math.floor(random(options.length)));
  });
}

function draw() {
  background(0, 0, bgTone);

  if (!fontsReady) {
    // Fonts not confirmed ready yet — skip drawing the mark this frame
    // rather than measuring text against a fallback font.
    return;
  }

  randomSeed(seed);

  var phrases = parseWords(words);
  if (phrases.length === 0) return;

  textFont(fontChoice);
  textStyle(weightChoice === 'Bold' ? BOLD : NORMAL);

  var ringData = layoutRings(phrases);
  var naturalOuterR = ringData.length > 0
    ? ringData[ringData.length - 1].radius + ringData[ringData.length - 1].size / 2
    : innerRadius;

  var fitScale = naturalOuterR > 0 ? (logoSize / 2) / naturalOuterR : 1;

  push();
  translate(width / 2, height / 2);
  scale(fitScale);

  for (var i = 0; i < ringData.length; i++) {
    drawRing(ringData[i], i, ringData.length);
  }

  pop();
}

// Split the comma-separated `words` string into trimmed, non-empty phrases,
// ordered so ring 0 is OUTERMOST. By default the last typed word ends up
// innermost; reverseOrder flips which end is outermost.
function parseWords(raw) {
  var parts = raw.split(',')
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s.length > 0; });
  if (!reverseOrder) {
    parts.reverse(); // last word -> innermost -> drawn last -> index 0 is outermost after this reverse
  }
  return parts;
}

// Computes radius + resolved textSize + angular span + per-ring direction
// + per-ring start angle for every ring, working outward from the centre.
//
// Both fill modes take their size straight from the textSizeVal slider, so
// size no longer depends on radius — the radius/size relationship is a
// simple forward accumulation, no circular dependency to solve:
//   r[0] = innerRadius
//   r[i] = r[i-1] + size[i-1]/2 + size[i]/2 + ringGap
// Since every ring uses the same size, that's just r[i] = r[i-1] + size + ringGap
// for i > 0, but written out below in the general form for clarity.
// Sums per-character textWidth() — matches how drawRing() accumulates
// angular advance one glyph at a time, which can differ slightly from
// textWidth() on the whole string (that can include cross-character
// kerning). Used wherever a width needs to line up exactly with rendering.
function sumCharWidths(str) {
  var total = 0;
  for (var i = 0; i < str.length; i++) total += textWidth(str[i]);
  return total;
}

function layoutRings(phrases) {
  var n = phrases.length;
  var rings = [];
  var size = constrain(textSizeVal, SIZE_MIN, SIZE_MAX);
  textSize(size);

  for (var i = 0; i < n; i++) {
    var phrase = phrases[i];
    var r;

    if (i === 0) {
      r = innerRadius;
    } else {
      r = rings[i - 1].radius + rings[i - 1].size / 2 + size / 2 + ringGap;
    }

    var content, span, tracking;
    if (fillMode === 'Once') {
      // draw the phrase a single time; it occupies whatever arc it happens
      // to occupy and does NOT stretch to close the circle.
      content = phrase;
      tracking = 0;
      span = (sumCharWidths(content) + letterSpacing * content.length) / r;
    } else {
      // Repeat: the phrase + separator repeats until THIS ring's own
      // circumference (computed from its own, already-settled radius) is
      // filled — using a stale radius here was the earlier bug.
      //
      // Math.round() on the repeat count either overlaps the seam (rounds
      // up, content wider than the circumference) or leaves a gap (rounds
      // down) — neither is correct on its own. Instead: floor the repeat
      // count (always leaves a gap or exact fit, never an overlap), then
      // distribute the leftover as extra per-glyph tracking so the ring
      // closes exactly with no seam collision.
      var unit = phrase + separator;
      var unitW = sumCharWidths(unit);
      if (unitW <= 0) unitW = size * unit.length * 0.5;
      unitW += letterSpacing * unit.length; // account for spacing before sizing the repeat count
      var circumference = TWO_PI * r;
      var repeats = Math.max(1, Math.floor(circumference / unitW));
      content = '';
      for (var k = 0; k < repeats; k++) content += unit;
      // Measured as the SUM of per-character widths (not textWidth(content)
      // as one string) so this matches exactly what drawRing() accumulates
      // per glyph — a whole-string measurement can differ slightly due to
      // kerning, which would leave a sub-pixel-to-few-pixel seam error.
      var contentW = sumCharWidths(content) + letterSpacing * content.length;
      var slack = circumference - contentW;
      tracking = content.length > 0 ? slack / content.length : 0;
      span = TWO_PI; // Repeat rings close exactly by construction
    }

    rings.push({
      phrase: phrase,
      content: content,
      radius: r,
      size: size,
      span: span,
      tracking: tracking,
      index: i
    });
  }

  return rings;
}

function ringDirectionCW(i, n) {
  if (direction === 'Clockwise') return true;
  if (direction === 'Counter-clockwise') return false;
  if (direction === 'Alternate') return i % 2 === 0;
  // Random, seed-driven
  return random() < 0.5;
}

function ringStartAngle(ringInfo, i, n) {
  var base = radians(startAngle) - HALF_PI; // 0 => 12 o'clock (p5 0 is 3 o'clock)
  var a;
  if (offsetMode === 'Aligned') {
    a = base;
  } else if (offsetMode === 'Step') {
    a = base + i * radians(offsetAmount);
  } else if (offsetMode === 'Golden') {
    a = base + i * radians(137.5);
  } else if (offsetMode === 'Centred') {
    a = base - ringInfo.span / 2;
  } else if (offsetMode === 'Random') {
    a = base + random(TWO_PI);
  } else {
    a = base;
  }
  return a;
}

function ringColor(i, n) {
  var isAccent = false;
  if (accentMode === 'Innermost ring') {
    isAccent = (i === n - 1);
  } else if (accentMode === 'Alternate rings') {
    isAccent = (i % 2 === 1);
  } else if (accentMode === 'Random') {
    isAccent = random() < 0.3;
  }
  if (isAccent) {
    return color(accentHue, 78, 55);
  }
  return color(baseHue, baseSat, baseBri);
}

function drawRing(ringInfo, i, n) {
  var cw = ringDirectionCW(i, n);
  var start = ringStartAngle(ringInfo, i, n);
  var col = ringColor(i, n);

  if (animate) {
    if (ringRotation[i] === undefined) ringRotation[i] = 0;
    // alternate rings counter-rotate against each other
    var spin = (i % 2 === 0 ? 1 : -1) * rotationSpeed * 0.01;
    ringRotation[i] += spin;
    start += ringRotation[i];
  }

  push();
  textSize(ringInfo.size);
  fill(col);
  noStroke();

  var content = ringInfo.content;
  var radius = ringInfo.radius;
  var travel = cw ? 1 : -1;
  var angle = start;

  for (var c = 0; c < content.length; c++) {
    var ch = content[c];
    var w = textWidth(ch) + letterSpacing + (ringInfo.tracking || 0);
    var deltaTheta = (w / radius) * travel;

    // advance half the char's angular width to place the glyph centre
    angle += deltaTheta / 2;

    push();
    rotate(angle);
    translate(radius, 0);
    // orient the glyph so its baseline is tangent to the circle; the
    // travel-direction flip also flips the glyph 180 degrees so
    // counter-clockwise rings read right-way-up from the outside (this is
    // what makes alternating rings appear upside-down, per the reference).
    rotate(cw ? HALF_PI : -HALF_PI);
    text(ch, 0, 0);
    pop();

    angle += deltaTheta / 2;
  }

  pop();
}
