/**
 * hero-scene-b.ts — Production-quality Three.js isometric hero scene.
 * Detailed workstation with laptop, monitor, GPU server tower, desk accessories,
 * floating knowledge symbols, connection paths, and ambient data particles.
 */

import * as THREE from "three";

// ---------------------------------------------------------------------------
// Brand palette
// ---------------------------------------------------------------------------

const BLUE = 0x3b82f6;
const CYAN = 0x22d3ee;
const PINK = 0xec4899;
const PURPLE = 0xa855f7;
const GREEN = 0x10b981;
const AMBER = 0xf59e0b;

// Furniture / body neutrals
const CHARCOAL = 0x2a2a2e;
const MID_GRAY = 0x3a3a40;
const DARK_SURFACE = 0x222226;

// ---------------------------------------------------------------------------
// Shared materials (reused across builders to keep material count low)
// ---------------------------------------------------------------------------

const matCharcoal = new THREE.MeshStandardMaterial({
  color: CHARCOAL,
  roughness: 0.75,
  metalness: 0.05,
});

const matMidGray = new THREE.MeshStandardMaterial({
  color: MID_GRAY,
  roughness: 0.7,
  metalness: 0.05,
});

const matDarkSurface = new THREE.MeshStandardMaterial({
  color: DARK_SURFACE,
  roughness: 0.8,
  metalness: 0.0,
});

const matServerBody = new THREE.MeshStandardMaterial({
  color: CHARCOAL,
  roughness: 0.55,
  metalness: 0.3,
});

const matServerPanel = new THREE.MeshStandardMaterial({
  color: 0x303036,
  roughness: 0.5,
  metalness: 0.25,
});

const matScreenGlass = new THREE.MeshStandardMaterial({
  color: 0x0a1628,
  roughness: 0.2,
  metalness: 0.0,
  emissive: BLUE,
  emissiveIntensity: 0.15,
});

const matWhitePage = new THREE.MeshStandardMaterial({
  color: 0xe8e8f0,
  roughness: 0.9,
  metalness: 0.0,
});

const matChairSeat = new THREE.MeshStandardMaterial({
  color: 0x35354a,
  roughness: 0.8,
  metalness: 0.0,
});

// ---------------------------------------------------------------------------
// Ground grid — very subtle, just enough to ground the scene
// ---------------------------------------------------------------------------

function createGroundGrid(parent: THREE.Group): void {
  // Soft ground disc
  const groundGeo = new THREE.CircleGeometry(6, 48);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x18181e,
    roughness: 1.0,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  parent.add(ground);

  // Grid lines
  const gridMat = new THREE.LineBasicMaterial({
    color: BLUE,
    transparent: true,
    opacity: 0.04,
  });
  const half = 6;
  const step = 1.0;
  for (let i = -half; i <= half; i += step) {
    const xGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i, 0, -half),
      new THREE.Vector3(i, 0, half),
    ]);
    parent.add(new THREE.Line(xGeo, gridMat));
    const zGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-half, 0, i),
      new THREE.Vector3(half, 0, i),
    ]);
    parent.add(new THREE.Line(zGeo, gridMat));
  }
}

// ---------------------------------------------------------------------------
// Connection paths (L-shaped glowing lines on the ground plane)
// ---------------------------------------------------------------------------

interface PathData {
  line: THREE.Line;
  mat: THREE.LineBasicMaterial;
  phase: number;
}

function createPath(
  from: THREE.Vector3,
  to: THREE.Vector3,
  color: number,
  phase: number
): PathData {
  const mid = new THREE.Vector3(to.x, 0.02, from.z);
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(from.x, 0.02, from.z),
    mid,
    new THREE.Vector3(to.x, 0.02, to.z),
  ]);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.25,
  });
  return { line: new THREE.Line(geo, mat), mat, phase };
}

// ---------------------------------------------------------------------------
// Laptop — wedge base, keyboard grid, hinged screen with code lines
// ---------------------------------------------------------------------------

interface LaptopRefs {
  group: THREE.Group;
  codeLines: THREE.Mesh[];
}

function createLaptop(): LaptopRefs {
  const group = new THREE.Group();
  const codeLines: THREE.Mesh[] = [];

  // --- Base (slightly wedge-shaped using a custom shape) ---
  // Front thicker (0.045), back thinner (0.025)
  const baseW = 0.92;
  const baseD = 0.62;
  const frontH = 0.045;
  const backH = 0.025;
  const baseVerts = new Float32Array([
    // Front face (z = +baseD/2)
    -baseW / 2, 0, baseD / 2,
    baseW / 2, 0, baseD / 2,
    baseW / 2, frontH, baseD / 2,
    -baseW / 2, 0, baseD / 2,
    baseW / 2, frontH, baseD / 2,
    -baseW / 2, frontH, baseD / 2,
    // Back face (z = -baseD/2)
    baseW / 2, 0, -baseD / 2,
    -baseW / 2, 0, -baseD / 2,
    -baseW / 2, backH, -baseD / 2,
    baseW / 2, 0, -baseD / 2,
    -baseW / 2, backH, -baseD / 2,
    baseW / 2, backH, -baseD / 2,
    // Top face
    -baseW / 2, frontH, baseD / 2,
    baseW / 2, frontH, baseD / 2,
    baseW / 2, backH, -baseD / 2,
    -baseW / 2, frontH, baseD / 2,
    baseW / 2, backH, -baseD / 2,
    -baseW / 2, backH, -baseD / 2,
    // Bottom face
    -baseW / 2, 0, -baseD / 2,
    baseW / 2, 0, -baseD / 2,
    baseW / 2, 0, baseD / 2,
    -baseW / 2, 0, -baseD / 2,
    baseW / 2, 0, baseD / 2,
    -baseW / 2, 0, baseD / 2,
    // Right face
    baseW / 2, 0, baseD / 2,
    baseW / 2, 0, -baseD / 2,
    baseW / 2, backH, -baseD / 2,
    baseW / 2, 0, baseD / 2,
    baseW / 2, backH, -baseD / 2,
    baseW / 2, frontH, baseD / 2,
    // Left face
    -baseW / 2, 0, -baseD / 2,
    -baseW / 2, 0, baseD / 2,
    -baseW / 2, frontH, baseD / 2,
    -baseW / 2, 0, -baseD / 2,
    -baseW / 2, frontH, baseD / 2,
    -baseW / 2, backH, -baseD / 2,
  ]);
  const baseGeo = new THREE.BufferGeometry();
  baseGeo.setAttribute("position", new THREE.BufferAttribute(baseVerts, 3));
  baseGeo.computeVertexNormals();
  const laptopBase = new THREE.Mesh(baseGeo, matCharcoal);
  group.add(laptopBase);

  // --- Keyboard grid (6 columns x 3 rows of tiny raised boxes) ---
  const keyMat = new THREE.MeshStandardMaterial({
    color: 0x38383e,
    roughness: 0.9,
    metalness: 0.0,
  });
  const keyGeo = new THREE.BoxGeometry(0.1, 0.008, 0.06);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      const key = new THREE.Mesh(keyGeo, keyMat);
      key.position.set(
        -0.3 + col * 0.12,
        frontH + 0.004,
        0.12 - row * 0.1
      );
      group.add(key);
    }
  }

  // Trackpad
  const trackpadGeo = new THREE.BoxGeometry(0.24, 0.004, 0.14);
  const trackpadMat = new THREE.MeshStandardMaterial({
    color: 0x323238,
    roughness: 0.6,
    metalness: 0.05,
  });
  const trackpad = new THREE.Mesh(trackpadGeo, trackpadMat);
  trackpad.position.set(0, frontH + 0.002, 0.22);
  group.add(trackpad);

  // --- Screen (hinged open at ~110 degrees) ---
  const screenPivot = new THREE.Group();
  screenPivot.position.set(0, backH, -baseD / 2);
  // 110 degrees open from closed = the screen tilts back by ~(180-110)=70 deg from vertical
  // In terms of rotation around X: -20 degrees past vertical = -(PI/2 - 20deg)
  // More simply: screen lies along -Z when closed (rotation.x = PI/2), opened to 110 deg means rotation.x = PI/2 - 110*PI/180
  screenPivot.rotation.x = -(Math.PI / 2) + (110 * Math.PI) / 180; // ~-0.35 rad tilt from vertical

  // Screen panel (bezel + display)
  const screenH = 0.56;
  const screenW = 0.88;
  const bezelThick = 0.022;

  // Bezel frame (back shell)
  const bezelGeo = new THREE.BoxGeometry(screenW + 0.04, screenH + 0.04, bezelThick);
  const bezel = new THREE.Mesh(bezelGeo, matCharcoal);
  bezel.position.y = screenH / 2 + 0.02;
  screenPivot.add(bezel);

  // Glowing screen surface
  const displayGeo = new THREE.PlaneGeometry(screenW, screenH);
  const displayMat = new THREE.MeshStandardMaterial({
    color: 0x0c1a30,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0x1a3a6a,
    emissiveIntensity: 0.4,
  });
  const display = new THREE.Mesh(displayGeo, displayMat);
  display.position.set(0, screenH / 2 + 0.02, bezelThick / 2 + 0.001);
  screenPivot.add(display);

  // Code lines on screen (4 horizontal emissive strips, different colors/widths)
  const lineConfigs = [
    { color: CYAN, width: 0.35, xOff: -0.15 },
    { color: GREEN, width: 0.25, xOff: -0.2 },
    { color: PINK, width: 0.42, xOff: -0.08 },
    { color: AMBER, width: 0.18, xOff: -0.25 },
  ];
  for (let i = 0; i < lineConfigs.length; i++) {
    const cfg = lineConfigs[i];
    const lineGeo = new THREE.PlaneGeometry(cfg.width, 0.018);
    const lineMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.75,
    });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(
      cfg.xOff + cfg.width * 0.15,
      screenH / 2 + 0.14 - i * 0.065,
      bezelThick / 2 + 0.002
    );
    screenPivot.add(line);
    codeLines.push(line);
  }

  group.add(screenPivot);

  return { group, codeLines };
}

// ---------------------------------------------------------------------------
// Desk with beveled edges, coffee mug, and mouse
// ---------------------------------------------------------------------------

function createDesk(): THREE.Group {
  const group = new THREE.Group();

  // Desktop surface (slightly beveled look via two layers)
  const deskTopGeo = new THREE.BoxGeometry(2.2, 0.06, 1.3);
  const deskTop = new THREE.Mesh(deskTopGeo, matDarkSurface);
  deskTop.position.y = 0.72;
  group.add(deskTop);

  // Thin edge bevel strip (lighter ring around the top)
  const bevelGeo = new THREE.BoxGeometry(2.24, 0.015, 1.34);
  const bevelMat = new THREE.MeshStandardMaterial({
    color: 0x2e2e34,
    roughness: 0.6,
    metalness: 0.1,
  });
  const bevel = new THREE.Mesh(bevelGeo, bevelMat);
  bevel.position.y = 0.69;
  group.add(bevel);

  // Desk legs (4 tapered legs using cylinders)
  const legGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.69, 6);
  const legPositions: [number, number, number][] = [
    [-0.95, 0.345, -0.55],
    [0.95, 0.345, -0.55],
    [-0.95, 0.345, 0.55],
    [0.95, 0.345, 0.55],
  ];
  for (const [lx, ly, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeo, matMidGray);
    leg.position.set(lx, ly, lz);
    group.add(leg);
  }

  // --- Coffee mug (right side of desk) ---
  const mugGroup = new THREE.Group();
  mugGroup.position.set(0.75, 0.75, 0.35);

  // Mug body (cylinder)
  const mugGeo = new THREE.CylinderGeometry(0.065, 0.06, 0.14, 12);
  const mugMat = new THREE.MeshStandardMaterial({
    color: 0x3d3d50,
    roughness: 0.7,
    metalness: 0.1,
  });
  const mugBody = new THREE.Mesh(mugGeo, mugMat);
  mugBody.position.y = 0.07;
  mugGroup.add(mugBody);

  // Mug handle (torus segment)
  const handleGeo = new THREE.TorusGeometry(0.045, 0.012, 6, 8, Math.PI);
  const handle = new THREE.Mesh(handleGeo, mugMat);
  handle.rotation.y = Math.PI / 2;
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(0.08, 0.07, 0);
  mugGroup.add(handle);

  // Coffee surface inside mug
  const coffeeSurface = new THREE.Mesh(
    new THREE.CircleGeometry(0.055, 12),
    new THREE.MeshStandardMaterial({
      color: 0x3a2010,
      roughness: 1.0,
    })
  );
  coffeeSurface.rotation.x = -Math.PI / 2;
  coffeeSurface.position.y = 0.13;
  mugGroup.add(coffeeSurface);

  group.add(mugGroup);

  // --- Mouse (small rounded box) ---
  const mouseGeo = new THREE.BoxGeometry(0.1, 0.03, 0.16);
  const mouseMat = new THREE.MeshStandardMaterial({
    color: 0x404048,
    roughness: 0.5,
    metalness: 0.1,
  });
  const mouse = new THREE.Mesh(mouseGeo, mouseMat);
  mouse.position.set(0.65, 0.765, 0.05);
  group.add(mouse);

  return group;
}

// ---------------------------------------------------------------------------
// External monitor on a stand (behind the laptop)
// ---------------------------------------------------------------------------

interface MonitorRefs {
  group: THREE.Group;
  codeLines: THREE.Mesh[];
}

function createMonitor(): MonitorRefs {
  const group = new THREE.Group();
  const codeLines: THREE.Mesh[] = [];

  // Stand base (thin disc)
  const standBaseGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.015, 12);
  const standBase = new THREE.Mesh(standBaseGeo, matMidGray);
  standBase.position.y = 0.008;
  group.add(standBase);

  // Stand neck
  const neckGeo = new THREE.BoxGeometry(0.04, 0.4, 0.04);
  const neck = new THREE.Mesh(neckGeo, matMidGray);
  neck.position.y = 0.21;
  group.add(neck);

  // Screen panel
  const sw = 1.05;
  const sh = 0.58;
  const panelGeo = new THREE.BoxGeometry(sw + 0.04, sh + 0.04, 0.025);
  const panel = new THREE.Mesh(panelGeo, matCharcoal);
  panel.position.y = 0.41 + sh / 2;
  group.add(panel);

  // Display surface
  const displayGeo = new THREE.PlaneGeometry(sw, sh);
  const displayMat = new THREE.MeshStandardMaterial({
    color: 0x0e1e38,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0x1a3a6a,
    emissiveIntensity: 0.35,
  });
  const display = new THREE.Mesh(displayGeo, displayMat);
  display.position.set(0, 0.41 + sh / 2, 0.014);
  group.add(display);

  // Content lines (different from laptop to suggest a different tool/window)
  const monitorLineConfigs = [
    { color: PURPLE, width: 0.5, xOff: -0.12 },
    { color: BLUE, width: 0.32, xOff: -0.2 },
    { color: GREEN, width: 0.4, xOff: -0.15 },
  ];
  for (let i = 0; i < monitorLineConfigs.length; i++) {
    const cfg = monitorLineConfigs[i];
    const lineGeo = new THREE.PlaneGeometry(cfg.width, 0.016);
    const lineMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.7,
    });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(
      cfg.xOff + cfg.width * 0.12,
      0.41 + sh / 2 + 0.1 - i * 0.07,
      0.015
    );
    group.add(line);
    codeLines.push(line);
  }

  return { group, codeLines };
}

// ---------------------------------------------------------------------------
// GPU / Server Tower — detailed with panel lines, scanning LEDs, fan grill
// ---------------------------------------------------------------------------

interface TowerRefs {
  group: THREE.Group;
  ledMeshes: THREE.Mesh[];
}

function createGPUTower(): TowerRefs {
  const group = new THREE.Group();
  const ledMeshes: THREE.Mesh[] = [];

  const towerW = 0.65;
  const towerH = 1.9;
  const towerD = 0.55;

  // Main body
  const bodyGeo = new THREE.BoxGeometry(towerW, towerH, towerD);
  const body = new THREE.Mesh(bodyGeo, matServerBody);
  body.position.y = towerH / 2;
  group.add(body);

  // Front panel (slightly lighter, inset feel)
  const fpGeo = new THREE.BoxGeometry(towerW + 0.005, towerH - 0.06, 0.015);
  const frontPanel = new THREE.Mesh(fpGeo, matServerPanel);
  frontPanel.position.set(0, towerH / 2, towerD / 2 + 0.008);
  group.add(frontPanel);

  // Panel seam lines on front (horizontal dividers between "bays")
  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e24,
    roughness: 0.9,
  });
  for (let i = 0; i < 5; i++) {
    const seamGeo = new THREE.BoxGeometry(towerW - 0.06, 0.008, 0.002);
    const seam = new THREE.Mesh(seamGeo, seamMat);
    seam.position.set(0, 0.25 + i * 0.35, towerD / 2 + 0.017);
    group.add(seam);
  }

  // Side panel lines (vertical accent strips)
  for (let i = 0; i < 3; i++) {
    const stripGeo = new THREE.BoxGeometry(0.006, towerH - 0.3, 0.002);
    const strip = new THREE.Mesh(stripGeo, seamMat);
    strip.position.set(
      towerW / 2 + 0.004,
      towerH / 2,
      -0.12 + i * 0.12
    );
    group.add(strip);
  }

  // LED rows (8 small indicators that animate in scanning pattern)
  const ledColors = [CYAN, CYAN, GREEN, CYAN, GREEN, CYAN, BLUE, GREEN];
  for (let i = 0; i < 8; i++) {
    const ledGeo = new THREE.PlaneGeometry(0.38, 0.022);
    const ledMat = new THREE.MeshBasicMaterial({
      color: ledColors[i % ledColors.length],
      transparent: true,
      opacity: 0.8,
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 0.18 + i * 0.22, towerD / 2 + 0.02);
    group.add(led);
    ledMeshes.push(led);
  }

  // Status dots near top
  const dotGeo = new THREE.CircleGeometry(0.02, 8);
  const dotColors = [GREEN, CYAN, AMBER];
  for (let i = 0; i < 3; i++) {
    const dotMat = new THREE.MeshBasicMaterial({ color: dotColors[i] });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(-0.15 + i * 0.12, towerH - 0.06, towerD / 2 + 0.02);
    group.add(dot);
  }

  // Fan grill on top (circle with radial lines)
  const grillRingGeo = new THREE.RingGeometry(0.08, 0.18, 24);
  const grillRingMat = new THREE.MeshStandardMaterial({
    color: 0x28282e,
    roughness: 0.6,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });
  const grillRing = new THREE.Mesh(grillRingGeo, grillRingMat);
  grillRing.rotation.x = -Math.PI / 2;
  grillRing.position.set(0, towerH + 0.002, 0);
  group.add(grillRing);

  // Radial spokes
  const spokeMat = new THREE.LineBasicMaterial({ color: 0x343438 });
  for (let a = 0; a < 6; a++) {
    const angle = (a / 6) * Math.PI * 2;
    const spokeGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(
        Math.cos(angle) * 0.08,
        towerH + 0.003,
        Math.sin(angle) * 0.08
      ),
      new THREE.Vector3(
        Math.cos(angle) * 0.17,
        towerH + 0.003,
        Math.sin(angle) * 0.17
      ),
    ]);
    group.add(new THREE.Line(spokeGeo, spokeMat));
  }

  // Cable from back (simple thin cylinder angling down)
  const cableGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.6, 6);
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1e,
    roughness: 0.9,
  });
  const cable = new THREE.Mesh(cableGeo, cableMat);
  cable.position.set(0, 0.3, -towerD / 2 - 0.05);
  cable.rotation.x = 0.3;
  group.add(cable);

  return { group, ledMeshes };
}

// ---------------------------------------------------------------------------
// Chair — seat, backrest, central pedestal with base spokes
// ---------------------------------------------------------------------------

function createChair(): THREE.Group {
  const group = new THREE.Group();

  // Seat (slightly rounded box)
  const seatGeo = new THREE.BoxGeometry(0.52, 0.05, 0.48);
  const seat = new THREE.Mesh(seatGeo, matChairSeat);
  seat.position.y = 0.48;
  group.add(seat);

  // Backrest
  const backGeo = new THREE.BoxGeometry(0.48, 0.42, 0.04);
  const backrest = new THREE.Mesh(backGeo, matChairSeat);
  backrest.position.set(0, 0.72, -0.22);
  backrest.rotation.x = 0.08; // slight recline
  group.add(backrest);

  // Central pedestal
  const pedastalGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8);
  const pedestal = new THREE.Mesh(pedastalGeo, matMidGray);
  pedestal.position.y = 0.28;
  group.add(pedestal);

  // Base spokes (5 directions like a real office chair)
  const spokeGeo = new THREE.BoxGeometry(0.3, 0.02, 0.03);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const spoke = new THREE.Mesh(spokeGeo, matMidGray);
    spoke.position.set(
      Math.sin(angle) * 0.14,
      0.08,
      Math.cos(angle) * 0.14
    );
    spoke.rotation.y = -angle;
    group.add(spoke);

    // Tiny wheel at end
    const wheelGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.03, 6);
    const wheel = new THREE.Mesh(wheelGeo, matDarkSurface);
    wheel.position.set(
      Math.sin(angle) * 0.28,
      0.025,
      Math.cos(angle) * 0.28
    );
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
  }

  return group;
}

// ---------------------------------------------------------------------------
// Floating symbols — open book, terminal window, neural-net wireframe
// ---------------------------------------------------------------------------

interface OrbitingSymbol {
  group: THREE.Group;
  radius: number;
  speed: number;
  phase: number;
  floatPhase: number;
  floatFreq: number;
  baseY: number;
}

function createOpenBook(): THREE.Group {
  const group = new THREE.Group();

  // Spine
  const spineGeo = new THREE.BoxGeometry(0.03, 0.35, 0.05);
  const spineMat = new THREE.MeshStandardMaterial({
    color: BLUE,
    roughness: 0.6,
    emissive: BLUE,
    emissiveIntensity: 0.1,
  });
  const spine = new THREE.Mesh(spineGeo, spineMat);
  group.add(spine);

  // Left page (angled outward like an open book)
  // Slightly curved using a custom bend: approximate with two flat segments
  const pageW = 0.2;
  const pageH = 0.32;

  // Left inner page
  const leftInnerGeo = new THREE.BoxGeometry(pageW * 0.6, pageH, 0.008);
  const leftInner = new THREE.Mesh(leftInnerGeo, matWhitePage);
  leftInner.position.set(-pageW * 0.3 - 0.015, 0, 0);
  leftInner.rotation.y = 0.15;
  group.add(leftInner);

  // Left outer page (slight additional angle for curve effect)
  const leftOuterGeo = new THREE.BoxGeometry(pageW * 0.45, pageH, 0.006);
  const leftOuter = new THREE.Mesh(leftOuterGeo, matWhitePage);
  leftOuter.position.set(-pageW - 0.01, 0, -0.015);
  leftOuter.rotation.y = 0.3;
  group.add(leftOuter);

  // Right inner page
  const rightInner = new THREE.Mesh(leftInnerGeo, matWhitePage);
  rightInner.position.set(pageW * 0.3 + 0.015, 0, 0);
  rightInner.rotation.y = -0.15;
  group.add(rightInner);

  // Right outer page
  const rightOuter = new THREE.Mesh(leftOuterGeo, matWhitePage);
  rightOuter.position.set(pageW + 0.01, 0, -0.015);
  rightOuter.rotation.y = -0.3;
  group.add(rightOuter);

  // Text lines on right page
  const textMat = new THREE.MeshBasicMaterial({
    color: 0x8888aa,
    transparent: true,
    opacity: 0.4,
  });
  for (let i = 0; i < 5; i++) {
    const w = 0.06 + Math.random() * 0.06;
    const tGeo = new THREE.PlaneGeometry(w, 0.012);
    const t = new THREE.Mesh(tGeo, textMat);
    t.position.set(pageW * 0.35, 0.09 - i * 0.045, 0.006);
    t.rotation.y = -0.15;
    group.add(t);
  }

  group.scale.setScalar(0.65);
  return group;
}

function createTerminalWindow(): THREE.Group {
  const group = new THREE.Group();

  // Window frame (thin dark box)
  const frameW = 0.45;
  const frameH = 0.32;
  const frameGeo = new THREE.BoxGeometry(frameW, frameH, 0.02);
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a24,
    roughness: 0.6,
    metalness: 0.1,
    emissive: 0x0a0a18,
    emissiveIntensity: 0.3,
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  group.add(frame);

  // Title bar (top strip)
  const titleGeo = new THREE.PlaneGeometry(frameW - 0.02, 0.035);
  const titleMat = new THREE.MeshBasicMaterial({
    color: 0x2a2a3a,
    transparent: true,
    opacity: 0.9,
  });
  const title = new THREE.Mesh(titleGeo, titleMat);
  title.position.set(0, frameH / 2 - 0.03, 0.011);
  group.add(title);

  // Three window dots (close/minimize/maximize)
  const dotGeo = new THREE.CircleGeometry(0.008, 6);
  const dotColors = [0xe05555, AMBER, GREEN];
  for (let i = 0; i < 3; i++) {
    const d = new THREE.Mesh(
      dotGeo,
      new THREE.MeshBasicMaterial({ color: dotColors[i] })
    );
    d.position.set(-frameW / 2 + 0.04 + i * 0.025, frameH / 2 - 0.03, 0.012);
    group.add(d);
  }

  // Command lines (colored strips)
  const cmdConfigs = [
    { color: GREEN, w: 0.22 },
    { color: CYAN, w: 0.3 },
    { color: PINK, w: 0.16 },
  ];
  for (let i = 0; i < cmdConfigs.length; i++) {
    const cfg = cmdConfigs[i];
    const lGeo = new THREE.PlaneGeometry(cfg.w, 0.015);
    const lMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.7,
    });
    const l = new THREE.Mesh(lGeo, lMat);
    l.position.set(
      -frameW / 2 + 0.04 + cfg.w / 2,
      frameH / 2 - 0.08 - i * 0.05,
      0.011
    );
    group.add(l);
  }

  // Blinking cursor (tiny square)
  const cursorGeo = new THREE.PlaneGeometry(0.012, 0.02);
  const cursorMat = new THREE.MeshBasicMaterial({
    color: GREEN,
    transparent: true,
    opacity: 0.8,
  });
  const cursor = new THREE.Mesh(cursorGeo, cursorMat);
  cursor.position.set(-frameW / 2 + 0.04, frameH / 2 - 0.08 - 3 * 0.05, 0.011);
  group.add(cursor);

  group.scale.setScalar(0.7);
  return group;
}

function createNeuralNet(): THREE.Group {
  const group = new THREE.Group();

  // Icosahedron wireframe to suggest a brain/neural network
  const icoGeo = new THREE.IcosahedronGeometry(0.22, 1);
  const icoWire = new THREE.LineSegments(
    new THREE.WireframeGeometry(icoGeo),
    new THREE.LineBasicMaterial({
      color: PURPLE,
      transparent: true,
      opacity: 0.55,
    })
  );
  group.add(icoWire);

  // Small glowing nodes at some vertices
  const nodeGeo = new THREE.SphereGeometry(0.02, 6, 6);
  const nodeMat = new THREE.MeshBasicMaterial({
    color: PURPLE,
    transparent: true,
    opacity: 0.8,
  });
  const posArr = icoGeo.getAttribute("position");
  // Place nodes at every 3rd unique position to keep it sparse
  const placed = new Set<string>();
  for (let i = 0; i < posArr.count; i++) {
    const x = Math.round(posArr.getX(i) * 100);
    const y = Math.round(posArr.getY(i) * 100);
    const z = Math.round(posArr.getZ(i) * 100);
    const key = `${x},${y},${z}`;
    if (!placed.has(key)) {
      placed.add(key);
      if (placed.size % 3 === 0) {
        const node = new THREE.Mesh(nodeGeo, nodeMat);
        node.position.set(
          posArr.getX(i),
          posArr.getY(i),
          posArr.getZ(i)
        );
        group.add(node);
      }
    }
  }

  group.scale.setScalar(0.85);
  return group;
}

function createOrbitingSymbols(): OrbitingSymbol[] {
  const configs = [
    { create: createOpenBook, radius: 2.8, speed: 0.18, phase: 0, y: 2.4 },
    {
      create: createTerminalWindow,
      radius: 3.2,
      speed: 0.22,
      phase: (Math.PI * 2) / 3,
      y: 2.9,
    },
    {
      create: createNeuralNet,
      radius: 2.5,
      speed: 0.14,
      phase: ((Math.PI * 2) / 3) * 2,
      y: 2.1,
    },
  ];

  return configs.map((cfg) => ({
    group: cfg.create(),
    radius: cfg.radius,
    speed: cfg.speed,
    phase: cfg.phase,
    floatPhase: Math.random() * Math.PI * 2,
    floatFreq: 0.6 + Math.random() * 0.3,
    baseY: cfg.y,
  }));
}

// ---------------------------------------------------------------------------
// Rising data particles — organic drift using combined sine waves
// ---------------------------------------------------------------------------

interface ParticleSystem {
  points: THREE.Points;
  positions: Float32Array;
  seeds: Float32Array; // per-particle random seed for noise-like drift
  count: number;
}

function createParticles(count: number): ParticleSystem {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const palette = [CYAN, BLUE, PINK, GREEN, PURPLE, AMBER];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 1] = Math.random() * 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    seeds[i] = Math.random() * 100;

    const c = new THREE.Color(
      palette[Math.floor(Math.random() * palette.length)]
    );
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return { points: new THREE.Points(geo, mat), positions, seeds, count };
}

function updateParticles(ps: ParticleSystem, time: number): void {
  const pos = ps.positions;
  for (let i = 0; i < ps.count; i++) {
    const ix = i * 3;
    const iy = ix + 1;
    const iz = ix + 2;
    const s = ps.seeds[i];

    // Rise speed (varies per particle)
    pos[iy] += 0.003 + (s % 1) * 0.005;

    // Organic horizontal drift (combined sine waves for noise-like motion)
    pos[ix] +=
      Math.sin(time * 0.7 + s * 1.3) * 0.0015 +
      Math.sin(time * 1.8 + s * 0.7) * 0.0008;
    pos[iz] +=
      Math.cos(time * 0.9 + s * 1.1) * 0.0012 +
      Math.cos(time * 2.1 + s * 0.5) * 0.0007;

    // Reset when too high
    if (pos[iy] > 6) {
      pos[ix] = (Math.random() - 0.5) * 8;
      pos[iy] = -0.5;
      pos[iz] = (Math.random() - 0.5) * 8;
    }
  }
  (
    ps.points.geometry.getAttribute("position") as THREE.BufferAttribute
  ).needsUpdate = true;
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export function initHeroScene(container: HTMLElement): void {
  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.pointerEvents = "none";

  // --- Scene ---
  const scene = new THREE.Scene();

  // --- Camera (true isometric orthographic) ---
  const frustumSize = 8;
  let aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.OrthographicCamera(
    (-frustumSize * aspect) / 2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    -frustumSize / 2,
    -50,
    50
  );

  const isoAngle = Math.atan(Math.sin(Math.PI / 4)); // ~35.264 deg
  const dist = 20;
  camera.position.set(
    dist * Math.cos(isoAngle) * Math.sin(Math.PI / 4),
    dist * Math.sin(isoAngle),
    dist * Math.cos(isoAngle) * Math.cos(Math.PI / 4)
  );
  camera.lookAt(0, 1.0, 0);

  // --- Lighting (professional three-point setup) ---

  // Hemisphere fill — cool sky, warm ground
  const hemiLight = new THREE.HemisphereLight(0x4488cc, 0x222244, 0.4);
  scene.add(hemiLight);

  // Key light — upper-left directional
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
  keyLight.position.set(-6, 10, 5);
  scene.add(keyLight);

  // Screen glow — blue-tinted point light near laptop area
  const screenGlow = new THREE.PointLight(0x3366cc, 0.3, 4.0);
  screenGlow.position.set(0, 1.6, 0.3);
  scene.add(screenGlow);

  // Server glow — subtle cyan point light near the tower
  const serverGlow = new THREE.PointLight(CYAN, 0.2, 3.5);
  serverGlow.position.set(2.2, 1.2, -0.5);
  scene.add(serverGlow);

  // --- Root group for parallax ---
  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  // --- Ground grid ---
  createGroundGrid(rootGroup);

  // --- Desk ---
  const desk = createDesk();
  desk.position.set(0.2, 0, 0.3);
  rootGroup.add(desk);

  // --- Laptop on desk ---
  const laptop = createLaptop();
  laptop.group.position.set(-0.1, 0.75, 0.3);
  rootGroup.add(laptop.group);

  // --- Monitor behind laptop ---
  const monitor = createMonitor();
  monitor.group.position.set(-0.1, 0.75, -0.25);
  rootGroup.add(monitor.group);

  // --- Chair in front of desk ---
  const chair = createChair();
  chair.position.set(0.1, 0, 1.1);
  rootGroup.add(chair);

  // --- GPU Tower (slightly behind and to the right) ---
  const tower = createGPUTower();
  tower.group.position.set(2.0, 0, -0.6);
  rootGroup.add(tower.group);

  // --- Connection paths ---
  const deskPos = new THREE.Vector3(0.2, 0, 0.3);
  const towerPos = new THREE.Vector3(2.0, 0, -0.6);
  const paths: PathData[] = [];

  const p1 = createPath(deskPos, towerPos, CYAN, 0);
  rootGroup.add(p1.line);
  paths.push(p1);

  const p2 = createPath(deskPos, new THREE.Vector3(-3.0, 0, -1.5), PURPLE, 1.5);
  rootGroup.add(p2.line);
  paths.push(p2);

  const p3 = createPath(towerPos, new THREE.Vector3(1.0, 0, -3.0), GREEN, 3.0);
  rootGroup.add(p3.line);
  paths.push(p3);

  // Small endpoint markers
  const endpointGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const endpointMat = new THREE.MeshBasicMaterial({
    color: BLUE,
    transparent: true,
    opacity: 0.4,
  });
  const endpoints = [
    new THREE.Vector3(-3.0, 0.06, -1.5),
    new THREE.Vector3(1.0, 0.06, -3.0),
  ];
  for (const ep of endpoints) {
    const m = new THREE.Mesh(endpointGeo, endpointMat);
    m.position.copy(ep);
    rootGroup.add(m);
  }

  // --- Orbiting symbols ---
  const symbols = createOrbitingSymbols();
  for (const sym of symbols) rootGroup.add(sym.group);

  // --- Rising particles ---
  const particles = createParticles(35);
  rootGroup.add(particles.points);

  // --- Mouse tracking ---
  let mouseX = 0;
  let mouseY = 0;

  function onMouseMove(e: MouseEvent): void {
    const rect = container.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }

  const parentEl = container.parentElement || container;
  parentEl.addEventListener("mousemove", onMouseMove);

  // --- Resize handler ---
  function handleResize(): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    aspect = w / h;
    camera.left = (-frustumSize * aspect) / 2;
    camera.right = (frustumSize * aspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(container);
  handleResize();

  // --- Collect all animated code lines ---
  const allCodeLines = [...laptop.codeLines, ...monitor.codeLines];

  // --- Animation state ---
  let curPX = 0;
  let curPY = 0;
  let firstFrame = true;

  function animate(): void {
    requestAnimationFrame(animate);

    const time = performance.now() * 0.001;

    // ---- Mouse parallax (smooth lerp) ----
    const tPX = mouseX * 0.07;
    const tPY = mouseY * 0.035;
    curPX += (tPX - curPX) * 0.03;
    curPY += (tPY - curPY) * 0.03;

    // Subtle idle sway (breathing effect) layered on top of parallax
    const breathX = Math.sin(time * 0.15) * 0.008;
    const breathY = Math.cos(time * 0.12) * 0.005;

    rootGroup.rotation.y = curPX + breathX;
    rootGroup.rotation.x = curPY + breathY;

    // ---- Pulse connection paths ----
    for (const p of paths) {
      p.mat.opacity = 0.15 + Math.sin(time * 1.0 + p.phase) * 0.12;
    }

    // ---- Server LED scanning pattern ----
    // A bright "scan line" sweeps up and down the rows
    const scanPos = (Math.sin(time * 1.5) * 0.5 + 0.5) * (tower.ledMeshes.length - 1);
    for (let i = 0; i < tower.ledMeshes.length; i++) {
      const dist = Math.abs(i - scanPos);
      const brightness = Math.max(0.15, 1.0 - dist * 0.25);
      (tower.ledMeshes[i].material as THREE.MeshBasicMaterial).opacity = brightness;
    }

    // ---- Code lines slow scroll (tiny Y oscillation) ----
    for (let i = 0; i < allCodeLines.length; i++) {
      const line = allCodeLines[i];
      if (line.userData.baseY === undefined) {
        line.userData.baseY = line.position.y;
      }
      // Very slow vertical oscillation to suggest scrolling code
      const drift = Math.sin(time * 0.2 + i * 0.8) * 0.012;
      line.position.y = line.userData.baseY + drift;
    }

    // ---- Orbit knowledge symbols at different speeds/heights ----
    for (const sym of symbols) {
      const angle = time * sym.speed + sym.phase;
      sym.group.position.x = Math.cos(angle) * sym.radius;
      sym.group.position.z = Math.sin(angle) * sym.radius;

      // Multi-frequency float for organic bobbing
      sym.group.position.y =
        sym.baseY +
        Math.sin(time * sym.floatFreq + sym.floatPhase) * 0.18 +
        Math.sin(time * sym.floatFreq * 1.7 + sym.floatPhase * 2.3) * 0.06;

      // Gentle tumble
      sym.group.rotation.y = time * 0.35 + sym.phase;
      sym.group.rotation.x =
        Math.sin(time * 0.25 + sym.phase) * 0.12;
    }

    // ---- Rising particles (organic drift) ----
    updateParticles(particles, time);

    // ---- Screen glow subtle pulse ----
    screenGlow.intensity = 0.25 + Math.sin(time * 0.6) * 0.05;
    serverGlow.intensity = 0.15 + Math.sin(time * 0.8 + 1.0) * 0.05;

    // ---- Render ----
    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      void container.offsetHeight;
      requestAnimationFrame(() => container.classList.add("loaded"));
    }
  }

  animate();

  // --- Cleanup ---
  (container as any).__heroSceneCleanup = () => {
    resizeObserver.disconnect();
    parentEl.removeEventListener("mousemove", onMouseMove);
    renderer.dispose();
  };
}
