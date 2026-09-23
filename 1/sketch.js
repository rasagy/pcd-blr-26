/* =========================================================================
   PCD Bangalore — Logo Option 1
   "Blue Pottery Mandala"

   A generative, radially-symmetric mark inspired by:
     - Jaipur blue pottery / Indo-Portuguese azulejo tilework (cobalt blue +
       cream, hand-painted florals, dotted borders)
     - Flower-of-life style overlapping-circle mandalas

   Every ring is built with perfect rotational symmetry (so the mark always
   reads as a clean, scalable logo), while ring-level proportions/hue are
   nudged by a seed value so each seed produces a distinct variant.
   Type/wordmark is intentionally left off — this is the circular emblem
   only, meant to be paired with type later.
   ========================================================================= */

let params = {
  petals: 8,          // rotational symmetry order
  rings: 5,            // concentric bands
  complexity: 4,        // detail / linework density per ring
  logoSize: 460,        // overall diameter in px
  baseHue: 213,          // base hue (blue pottery cobalt sits ~205-225)
  baseSat: 72,
  strokeWeightVal: 2,
  seed: 7,              // drag to get a new generative variant
  animate: false,
  rotationSpeed: 0.2,
  goldAccent: true,      // touches of warm accent on the dotted rings
  useIcons: true          // swap petal motifs for pixelated tech-cursor icons
};

// --- p5.gui range hints (Min/Max/Step companion variables) -----------------
// NOTE: these must be `var` (not `let`/`const`) — p5.gui's addGlobals()
// binds to `window[name]`, and top-level `let`/`const` never attach to
// `window`, so the controls would silently find nothing to bind to.
var petals = params.petals, petalsMin = 5, petalsMax = 16, petalsStep = 1;
var rings = params.rings, ringsMin = 2, ringsMax = 9, ringsStep = 1;
var complexity = params.complexity, complexityMin = 1, complexityMax = 8, complexityStep = 1;
var logoSize = params.logoSize, logoSizeMin = 220, logoSizeMax = 540, logoSizeStep = 10;
// named baseHue/baseSat (not hue/saturation) because p5.js defines its own
// global hue()/saturation() functions, which would clobber a same-named var
var baseHue = params.baseHue, baseHueMin = 180, baseHueMax = 250, baseHueStep = 1;
var baseSat = params.baseSat, baseSatMin = 20, baseSatMax = 100, baseSatStep = 1;
var strokeWeightVal = params.strokeWeightVal, strokeWeightValMin = 0.5, strokeWeightValMax = 5, strokeWeightValStep = 0.5;
var seed = params.seed, seedMin = 1, seedMax = 200, seedStep = 1;
var animate = params.animate;
var rotationSpeed = params.rotationSpeed, rotationSpeedMin = 0, rotationSpeedMax = 1, rotationSpeedStep = 0.02;
var goldAccent = params.goldAccent;
var useIcons = params.useIcons;
// p5.gui turns a bound array-of-strings global into a dropdown automatically
var iconChoice = ['Mixed', 'Arrow', 'Hand', 'Hourglass', 'Gear', 'Power', 'Wifi', 'Terminal', 'Bolt'];

var rotationAngle = 0;
var CANVAS_SIZE = 640;
var gui; // kept global so the Randomize button callback can reach gui.prototype

// --- Pixelated tech-cursor icon glyphs --------------------------------------
// Each grid is drawn tip-first: row 0 is the outward tip (cursor point,
// fingertip, hourglass cap), the last row sits at the ring anchor point —
// same "points outward" convention as the hand-painted petals.
var ICON_GRIDS = {
  Arrow: [
    '0001000',
    '0011100',
    '0111110',
    '1111111',
    '0001000',
    '0001000',
    '0001000',
    '0001000',
    '0001000'
  ],
  // Pointer-hand cursor: tall index finger at the tip (outward), two
  // shorter folded fingers stepping down beside it, a thumb kicking out
  // to the side, and a tapered wrist at the anchor (near-center) end —
  // same silhouette family as the classic pixel hand cursor.
  Hand: [
    '0000011000000',
    '0000011000000',
    '0000011000000',
    '0000011000000',
    '0000011011000',
    '0000011011000',
    '0000011011011',
    '0001111111110',
    '0011111111110',
    '1111111111110',
    '1111111111110',
    '0111111111100',
    '0011111111000',
    '0001111110000',
    '0001111110000'
  ],
  Hourglass: [
    '1111111',
    '1000001',
    '0111110',
    '0011100',
    '0001000',
    '0011100',
    '0111110',
    '1000001',
    '1111111'
  ],
  Terminal: [
    '0100000',
    '0110000',
    '0111000',
    '0110000',
    '0100000',
    '0000000',
    '0000000',
    '0111100',
    '0111100'
  ],
  Bolt: [
    '0001100',
    '0001100',
    '0011000',
    '0111110',
    '0011000',
    '0011000',
    '0110000',
    '0110000',
    '0110000'
  ]
};
var ICON_NAMES = ['Arrow', 'Hand', 'Hourglass', 'Gear', 'Power', 'Wifi', 'Terminal', 'Bolt'];

// --- Procedurally-rasterized icons ------------------------------------------
// Gear, Power and Wifi are all curved shapes (a toothed ring, a full circle,
// concentric signal arcs) that read poorly hand-typed as a handful of '0'/'1'
// rows, so these are rasterized from real circle/angle math at a high enough
// grid resolution to actually look round once blocky-filled — same idea as
// the hand-typed glyphs above, just computed instead of drawn by eye.

// Toothed ring with a hollow center hole, like a cog/settings icon.
function buildGearGrid(size) {
  const teeth = 8;
  const c = (size - 1) / 2;
  const bodyR = size * 0.30;
  const toothR = size * 0.46;
  const holeR = size * 0.15;
  const slice = 360 / teeth;
  const rows = [];
  for (let r = 0; r < size; r++) {
    let row = '';
    for (let col = 0; col < size; col++) {
      const dx = col - c, dy = r - c;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angleDeg = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
      const posInSlice = angleDeg % slice;
      const isTooth = posInSlice > slice * 0.22 && posInSlice < slice * 0.78;
      const outerR = isTooth ? toothR : bodyR;
      row += (dist <= outerR && dist >= holeR) ? '1' : '0';
    }
    rows.push(row);
  }
  return rows;
}

// A full, unbroken ring with a vertical stem crossing its top edge and
// continuing out to the tip — the classic "power" glyph, but with the
// circle left whole (not gapped) per the reference.
function buildPowerGrid(size) {
  const c = (size - 1) / 2;
  const outerR = size * 0.42;
  const thickness = size * 0.15;
  const rows = [];
  for (let r = 0; r < size; r++) {
    let row = '';
    for (let col = 0; col < size; col++) {
      const dx = col - c, dy = r - c;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const onRing = dist <= outerR && dist >= outerR - thickness;
      const onStem = Math.abs(col - c) <= 1 && r <= c;
      row += (onRing || onStem) ? '1' : '0';
    }
    rows.push(row);
  }
  return rows;
}

// Three concentric arcs fanning out above a dot — the dot sits at the
// anchor (near-center) row and the arcs widen toward the outward tip,
// echoing the mandala's own radiating-outward rings.
function buildWifiGrid(size) {
  const cx = (size - 1) / 2;
  const cy = size - 1;
  const radii = [size * 0.3, size * 0.52, size * 0.74];
  const thickness = size * 0.07;
  const dotR = size * 0.08;
  const rows = [];
  for (let r = 0; r < size; r++) {
    let row = '';
    for (let col = 0; col < size; col++) {
      const dx = col - cx, dy = r - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let on = dist <= dotR;
      if (!on && dy <= 0) {
        for (let ri = 0; ri < radii.length; ri++) {
          const rad = radii[ri];
          if (Math.abs(dist - rad) < thickness && Math.abs(dx) <= rad * 0.78) {
            on = true;
            break;
          }
        }
      }
      row += on ? '1' : '0';
    }
    rows.push(row);
  }
  return rows;
}

var ICON_RASTER_SIZE = 15;
ICON_GRIDS.Gear = buildGearGrid(ICON_RASTER_SIZE);
ICON_GRIDS.Power = buildPowerGrid(ICON_RASTER_SIZE);
// Wifi needs its 3 arcs to stay visibly separated, which takes more grid
// resolution than the other rasterized icons at this arc thickness.
ICON_GRIDS.Wifi = buildWifiGrid(21);

// every slider-bound param as [name, min, max, step], for the Randomize button
var NUMERIC_CONTROLS = [
  ['petals', petalsMin, petalsMax, petalsStep],
  ['rings', ringsMin, ringsMax, ringsStep],
  ['complexity', complexityMin, complexityMax, complexityStep],
  ['logoSize', logoSizeMin, logoSizeMax, logoSizeStep],
  ['baseHue', baseHueMin, baseHueMax, baseHueStep],
  ['baseSat', baseSatMin, baseSatMax, baseSatStep],
  ['strokeWeightVal', strokeWeightValMin, strokeWeightValMax, strokeWeightValStep],
  ['seed', seedMin, seedMax, seedStep],
  ['rotationSpeed', rotationSpeedMin, rotationSpeedMax, rotationSpeedStep]
];
var BOOLEAN_CONTROLS = ['animate', 'goldAccent', 'useIcons'];

function setup() {
  const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  canvas.parent(document.querySelector('main'));
  colorMode(HSB, 360, 100, 100, 100);
  angleMode(DEGREES);
  strokeCap(ROUND);

  gui = createGui('Blue Pottery Mandala — controls');
  gui.setPosition(16, 16);
  // gui.prototype is the raw QuickSettings panel — p5.gui doesn't wrap
  // addButton, so we reach through to it directly.
  gui.prototype.addButton('Randomize', randomizeAll);
  gui.addGlobals(
    'petals', 'rings', 'complexity', 'logoSize',
    'baseHue', 'baseSat', 'strokeWeightVal',
    'seed', 'animate', 'rotationSpeed', 'goldAccent',
    'useIcons', 'iconChoice'
  );
}

// Rolls a fresh value for every bound control and pushes it through
// QuickSettings' own setValue (updates the slider UI + the bound global).
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
  const iconOptions = ['Mixed'].concat(ICON_NAMES);
  gui.prototype.setValue('iconChoice', random(iconOptions));
}

function draw() {
  background(42, 16, 97); // warm cream, like unglazed pottery ground

  push();
  translate(width / 2, height / 2);

  if (animate) {
    rotationAngle += rotationSpeed;
  }
  rotate(rotationAngle);

  const R = logoSize / 2;

  // outer plate rim — thin double circle, ceramic-plate style
  noFill();
  stroke(baseHue, baseSat * 0.55, 32, 45);
  strokeWeight(1);
  circle(0, 0, R * 2.08);
  circle(0, 0, R * 2.14);

  drawRings(R);
  drawCenterMark(R * 0.15);
  drawOuterDotBorder(R);

  pop();
}

function drawRings(R) {
  for (let i = 0; i < rings; i++) {
    randomSeed(seed * 97 + i * 13); // per-ring jitter, symmetric within the ring

    const t = rings > 1 ? i / (rings - 1) : 0;
    const rad = lerp(R * 0.34, R * 0.97, t);
    const type = i % 3;

    const jitterHue = random(-8, 8);
    const jitterBri = random(-6, 6);
    const ringHue = (baseHue + jitterHue + 360) % 360;
    const ringBri = constrain(58 - t * 22 + jitterBri, 18, 70);

    if (type === 0) {
      if (useIcons) {
        const iconLen = R * (0.16 + complexity * 0.014) * random(0.9, 1.1);
        const iconName = iconChoice === 'Mixed' ? ICON_NAMES[i % ICON_NAMES.length] : iconChoice;
        drawIconRing(rad, petals, iconName, iconLen, ringHue, baseSat, ringBri, 92);
      } else {
        const petalLen = R * (0.14 + complexity * 0.012) * random(0.9, 1.1);
        const petalWidth = petalLen * random(0.28, 0.38);
        drawPetalRing(rad, petals, petalLen, petalWidth, ringHue, baseSat, ringBri, 92);
      }
    } else if (type === 1) {
      push();
      rotate(180 / petals); // offset so it nests between the previous ring's petals
      if (useIcons) {
        const iconLen = R * 0.1 * random(0.85, 1.15);
        const iconName = iconChoice === 'Mixed' ? ICON_NAMES[(i + 1) % ICON_NAMES.length] : iconChoice;
        drawIconRing(rad, petals, iconName, iconLen, (ringHue + 14) % 360, baseSat * 0.82, ringBri + 16, 80);
      } else {
        const petalLen = R * 0.085 * random(0.85, 1.15);
        const petalWidth = petalLen * random(0.4, 0.55);
        drawPetalRing(rad, petals, petalLen, petalWidth, (ringHue + 14) % 360, baseSat * 0.82, ringBri + 16, 80);
      }
      pop();
    } else {
      const dotCount = petals * 2;
      const dotSize = map(complexity, 1, 8, R * 0.018, R * 0.045);
      if (goldAccent) {
        drawDotRing(rad, dotCount, dotSize, 42, 68, 88, 95);
      } else {
        drawDotRing(rad, dotCount, dotSize, ringHue, baseSat, ringBri + 24, 95);
      }
    }
  }
}

// A single petal, drawn pointing "outward" along local -y, from rInner to
// rInner+petalLen. Caller has already translate()/rotate()'d into place.
function drawPetal(rInner, petalLen, halfWidth, huev, satv, briv, alph) {
  const rOuter = rInner + petalLen;
  fill(huev, satv, briv, alph);
  stroke(huev, min(100, satv + 12), max(0, briv - 30), 90);
  strokeWeight(strokeWeightVal);

  beginShape();
  vertex(0, -rInner);
  bezierVertex(halfWidth, -lerp(rInner, rOuter, 0.35), halfWidth * 0.6, -lerp(rInner, rOuter, 0.82), 0, -rOuter);
  bezierVertex(-halfWidth * 0.6, -lerp(rInner, rOuter, 0.82), -halfWidth, -lerp(rInner, rOuter, 0.35), 0, -rInner);
  endShape(CLOSE);

  // inner vein — hand-painted pottery linework, scales with complexity
  if (complexity > 2) {
    stroke(huev, satv * 0.5, max(0, briv - 40), 65);
    strokeWeight(max(0.4, strokeWeightVal * 0.4));
    line(0, -lerp(rInner, rOuter, 0.12), 0, -lerp(rInner, rOuter, 0.88));
  }
  if (complexity > 5) {
    stroke(huev, satv * 0.5, max(0, briv - 40), 45);
    strokeWeight(max(0.3, strokeWeightVal * 0.3));
    line(0, -lerp(rInner, rOuter, 0.3), halfWidth * 0.35, -lerp(rInner, rOuter, 0.55));
    line(0, -lerp(rInner, rOuter, 0.3), -halfWidth * 0.35, -lerp(rInner, rOuter, 0.55));
  }
}

function drawPetalRing(radius, count, petalLen, halfWidth, huev, satv, briv, alph) {
  const step = 360 / count;
  for (let k = 0; k < count; k++) {
    push();
    rotate(step * k);
    translate(0, -radius);
    drawPetal(0, petalLen, halfWidth, huev, satv, briv, alph);
    pop();
  }
}

// Draws one pixel-grid icon (arrow / hand / hourglass) anchored at the
// origin with its tip pointing outward along local -y, matching the
// orientation drawPetal() uses. `grid` is an array of equal-length '0'/'1'
// row strings; row 0 is the outward tip, the last row sits at the anchor.
function drawPixelIcon(grid, cell, huev, satv, briv, alph) {
  const cols = grid[0].length;
  const rows = grid.length;
  const startX = -(cols * cell) / 2;
  const startY = -(rows * cell);

  noStroke();
  fill(huev, satv, briv, alph);
  for (let r = 0; r < rows; r++) {
    const row = grid[r];
    const y = startY + r * cell;
    for (let c = 0; c < cols; c++) {
      if (row[c] === '1') {
        rect(startX + c * cell, y, cell, cell);
      }
    }
  }
}

// `iconLen` is the icon's overall outward extent in px — each icon's own
// grid resolution (row count) varies (9 rows for the hand-typed glyphs, 15
// for the rasterized gear/power/wifi), so the per-cell size is derived here
// rather than passed in, keeping every icon the same visual size in the ring.
function drawIconRing(radius, count, iconName, iconLen, huev, satv, briv, alph) {
  const grid = ICON_GRIDS[iconName] || ICON_GRIDS.Arrow;
  const cell = iconLen / grid.length;
  const step = 360 / count;
  for (let k = 0; k < count; k++) {
    push();
    rotate(step * k);
    translate(0, -radius);
    drawPixelIcon(grid, cell, huev, satv, briv, alph);
    pop();
  }
}

function drawDotRing(radius, count, dotSize, huev, satv, briv, alph) {
  noStroke();
  fill(huev, satv, briv, alph);
  const step = 360 / count;
  for (let k = 0; k < count; k++) {
    const a = step * k;
    const x = radius * sin(a);
    const y = -radius * cos(a);
    circle(x, y, dotSize);
  }
}

// Central mark — a single stroked ring plus a filled dot, anchoring the
// mandala's rotational center without any overlapping circle pattern.
function drawCenterMark(r) {
  noFill();
  stroke(baseHue, baseSat * 0.9, 34, 85);
  strokeWeight(strokeWeightVal * 0.8);
  circle(0, 0, r * 2);
  fill(baseHue, baseSat, 30, 90);
  noStroke();
  circle(0, 0, r * 0.5);
}

function drawOuterDotBorder(R) {
  const count = petals * 3;
  const dotSize = R * 0.02;
  const radius = R * 1.11;
  const huev = goldAccent ? 42 : baseHue;
  const satv = goldAccent ? 72 : baseSat;
  drawDotRing(radius, count, dotSize, huev, satv, goldAccent ? 82 : 30, 90);
}
