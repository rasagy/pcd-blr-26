/* =========================================================================
   PCD Bangalore — Logo Option 5
   "Type Rotate"

   The wordmark "PCD • BLR" is stamped over and over at growing rotation
   offsets, radius, and fade, so the repeated copies braid themselves into
   concentric trail-rings — see reference/type-rotate.jpg. A crisp, unrotated
   copy sits in the exact center as the anchor the trails spin around.
   ========================================================================= */

// each phrase is two words drawn as two separate text() calls — the first
// right-aligned up to the center, the second left-aligned from the center —
// so the gap between them (where the center dot sits) never drifts with
// font metrics, no matter how the copy is rotated.
var wordFirst = 'PCD', wordSecond = 'BLR'; // active words, recomputed each frame from `language`
var WORDS_EN = ['PCD', 'BLR'];
var WORDS_HI = ['पी सी डी', 'बैंगलोर'];
// p5.gui turns a bound array-of-strings global into a dropdown automatically
var language = ['English', 'Hindi'];
var isHindi = false; // recomputed each frame from `language`
// CENTER-aligned text() vertically centers on each font's own ascent/descent
// box, and Devanagari's is taller above the baseline (matras, headline) than
// Latin's — so at identical y it sits visibly higher than the fixed center
// dot. Nudging it down by a fixed % of the current text size keeps it
// optically centered on the dot at every ring size.
var HINDI_BASELINE_OFFSET_PCT = 0.09;

// rotational symmetry / density of the trail rings — rings can go to 0
// (just one layer, sized exactly like the center text); each ring above
// that adds another, more spaced-out layer. repetitions can go to 1 (a
// single trailing copy, no rotational repeat).
var repetitions = 9, repetitionsMin = 1, repetitionsMax = 28, repetitionsStep = 1;
var rings = 4, ringsMin = 0, ringsMax = 14, ringsStep = 1;
var logoSize = 480, logoSizeMin = 240, logoSizeMax = 560, logoSizeStep = 10;
// named baseHue/baseSat (not hue/saturation) — p5.js defines its own
// global hue()/saturation() functions that would clobber same-named vars
var baseHue = 140, baseHueMin = 0, baseHueMax = 360, baseHueStep = 1;
var baseSat = 75, baseSatMin = 0, baseSatMax = 100, baseSatStep = 1;
var fadeAmount = 99, fadeAmountMin = 10, fadeAmountMax = 99, fadeAmountStep = 1;
var animate = false;
var rotationSpeed = 0.15, rotationSpeedMin = 0, rotationSpeedMax = 1, rotationSpeedStep = 0.02;
// when on, the whole trail is drawn a second time flipped top-to-bottom, so
// wordFirst (normally upper-half only) also fills the lower half and
// wordSecond fills the upper half, instead of each word owning just its
// own half of the circle.
var mirror = false;
// p5.gui turns a bound array-of-strings global into a dropdown automatically
var fontChoice = ['Anek Latin', 'Space Mono', 'Doto', 'Geist Pixel'];

var globalRotation = 0;
var CANVAS_SIZE = 640;
var gui; // global so the Randomize callback can reach gui.prototype

var NUMERIC_CONTROLS = [
  ['repetitions', repetitionsMin, repetitionsMax, repetitionsStep],
  ['rings', ringsMin, ringsMax, ringsStep],
  ['logoSize', logoSizeMin, logoSizeMax, logoSizeStep],
  ['baseHue', baseHueMin, baseHueMax, baseHueStep],
  ['baseSat', baseSatMin, baseSatMax, baseSatStep],
  ['fadeAmount', fadeAmountMin, fadeAmountMax, fadeAmountStep],
  ['rotationSpeed', rotationSpeedMin, rotationSpeedMax, rotationSpeedStep]
];
var BOOLEAN_CONTROLS = ['animate', 'mirror'];

function setup() {
  var canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  canvas.parent(document.querySelector('main'));
  colorMode(HSB, 360, 100, 100, 100);
  angleMode(DEGREES);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);

  gui = createGui('Type Rotate — controls');
  gui.setPosition(16, 16);
  // gui.prototype is the raw QuickSettings panel — p5.gui doesn't wrap
  // addButton, so reach through to it directly for the Randomize button.
  gui.prototype.addButton('Randomize', randomizeAll);
  gui.addGlobals(
    'repetitions', 'rings', 'logoSize',
    'baseHue', 'baseSat', 'fadeAmount',
    'animate', 'rotationSpeed', 'mirror',
    'language', 'fontChoice'
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
  gui.prototype.setValue('fontChoice', random(['Anek Latin', 'Space Mono', 'Doto', 'Geist Pixel']));
  gui.prototype.setValue('language', random(['English', 'Hindi']));
}

function draw() {
  background(0, 0, 4);

  // Hindi has no companion glyphs in the other three approved faces, so it
  // always renders in Anek Devanagari — the Devanagari sibling of Anek Latin.
  isHindi = language === 'Hindi';
  var words = isHindi ? WORDS_HI : WORDS_EN;
  wordFirst = words[0];
  wordSecond = words[1];
  textFont(isHindi ? 'Anek Devanagari' : fontChoice);

  push();
  translate(width / 2, height / 2);

  if (animate) {
    globalRotation += rotationSpeed;
  }

  var R = logoSize / 2;

  drawTrailRings(R, 1);
  if (mirror) {
    // negating the rotation angle reflects each copy's position across the
    // horizontal axis without flipping the glyphs themselves (unlike
    // scale(1, -1), which would mirror the letters backwards) — so
    // wordFirst also fills the lower half and wordSecond the upper half.
    drawTrailRings(R, -1);
  }
  drawCenterWord(R);

  pop();
}

// Each copy draws wordFirst right-aligned TO the origin and wordSecond
// left-aligned FROM the origin — never one combined string — so the gap
// between them sits exactly on (0, 0) for every rotated copy, which is what
// keeps the center dot pinned while the words themselves sweep outward as
// radial spokes.
function drawWordPair(gap, size) {
  var y = isHindi ? size * HINDI_BASELINE_OFFSET_PCT : 0;
  textAlign(RIGHT, CENTER);
  text(wordFirst, -gap, y);
  textAlign(LEFT, CENTER);
  text(wordSecond, gap, y);
}

function drawTrailRings(R, dir) {
  var centerSize = R * 0.235;

  // layer 0 is always the same size as the center text; each layer above
  // that (up to `rings`) grows larger and fades further out. With
  // rings === 0 there is exactly one layer, at centerSize — the trail reads
  // as the same size as the main text, just repeated around the rotation.
  for (var i = rings; i >= 0; i--) {
    var t = rings > 0 ? i / rings : 0; // 0 (innermost, centerSize) .. 1 (outermost)

    var ringSize = lerp(centerSize, R * 0.34, t);
    var ringAlpha = lerp(90, 100 - fadeAmount, t);
    var gap = ringSize * 0.16;

    textSize(ringSize);

    // wordFirst starts pointing at 9 o'clock (its right-aligned home), and
    // wordSecond starts pointing at 3 o'clock (its left-aligned home) — see
    // drawWordPair. Rotating both by the same clockwise angle sweeps
    // wordFirst 9 -> 12 -> 3 and wordSecond 3 -> 6 -> 9, so each repetition
    // only needs to divide a 180° arc, not the full 360°, and every step
    // fades further from its home position.
    for (var k = 0; k < repetitions; k++) {
      var kFrac = repetitions > 1 ? k / repetitions : 0;
      var ang = dir * ((180 / repetitions) * k + globalRotation * (1 + t));
      var kFade = lerp(1, 1 - fadeAmount / 100, kFrac);

      push();
      rotate(ang);
      fill(baseHue, baseSat, lerp(85, 25, t), ringAlpha * kFade);
      drawWordPair(gap, ringSize);
      pop();
    }
  }
}

// Crisp, unrotated anchor pair sitting dead center on top of the trails,
// plus the solid dot that anchors the whole rotation.
function drawCenterWord(R) {
  var centerSize = R * 0.235;
  var gap = centerSize * 0.16;
  textSize(centerSize);

  noStroke();
  push();
  translate(R * 0.01, R * 0.02);
  fill(0, 0, 4, 80);
  drawWordPair(gap, centerSize);
  pop();

  fill(baseHue, baseSat * 0.35, 100, 100);
  drawWordPair(gap, centerSize);

  fill(baseHue, baseSat * 0.35, 100, 100);
  circle(0, 0, centerSize * 0.16);
}
