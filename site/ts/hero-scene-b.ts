/**
 * hero-scene-b.ts — Interactive Three.js isometric campus/AI lab hero scene.
 * Renders a stylized low-poly workstation with GPU server, orbiting knowledge
 * symbols, glowing network paths, and rising data particles.
 */

import * as THREE from "three";

// ---------------------------------------------------------------------------
// Brand colors
// ---------------------------------------------------------------------------

const BLUE = 0x3b82f6;
const CYAN = 0x22d3ee;
const PINK = 0xec4899;
const PURPLE = 0xa855f7;
const GREEN = 0x10b981;
const AMBER = 0xf59e0b;
const BRAND_BLUE = 0x4f8fea;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lighten(hex: number, amount: number): number {
  const r = Math.min(255, ((hex >> 16) & 0xff) + amount);
  const g = Math.min(255, ((hex >> 8) & 0xff) + amount);
  const b = Math.min(255, (hex & 0xff) + amount);
  return (r << 16) | (g << 8) | b;
}

function darken(hex: number, amount: number): number {
  const r = Math.max(0, ((hex >> 16) & 0xff) - amount);
  const g = Math.max(0, ((hex >> 8) & 0xff) - amount);
  const b = Math.max(0, (hex & 0xff) - amount);
  return (r << 16) | (g << 8) | b;
}

function phong(
  color: number,
  opts?: { emissive?: number; emissiveIntensity?: number; opacity?: number }
): THREE.MeshPhongMaterial {
  return new THREE.MeshPhongMaterial({
    color,
    flatShading: true,
    transparent: opts?.opacity !== undefined && opts.opacity < 1,
    opacity: opts?.opacity ?? 1,
    emissive: opts?.emissive ?? 0x000000,
    emissiveIntensity: opts?.emissiveIntensity ?? 1,
  });
}

// ---------------------------------------------------------------------------
// Ground grid with glowing connection paths
// ---------------------------------------------------------------------------

function createGroundGrid(scene: THREE.Group): void {
  // Subtle flat ground disc
  const groundGeo = new THREE.CircleGeometry(6.5, 64);
  const groundMat = new THREE.MeshPhongMaterial({
    color: 0x1a1a2e,
    flatShading: true,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  scene.add(ground);

  // Grid lines
  const gridSize = 12;
  const gridStep = 1.0;
  const gridMat = new THREE.LineBasicMaterial({
    color: BRAND_BLUE,
    transparent: true,
    opacity: 0.06,
  });

  for (let i = -gridSize / 2; i <= gridSize / 2; i += gridStep) {
    // X lines
    const xPts = [
      new THREE.Vector3(i, 0, -gridSize / 2),
      new THREE.Vector3(i, 0, gridSize / 2),
    ];
    const xGeo = new THREE.BufferGeometry().setFromPoints(xPts);
    scene.add(new THREE.Line(xGeo, gridMat));

    // Z lines
    const zPts = [
      new THREE.Vector3(-gridSize / 2, 0, i),
      new THREE.Vector3(gridSize / 2, 0, i),
    ];
    const zGeo = new THREE.BufferGeometry().setFromPoints(zPts);
    scene.add(new THREE.Line(zGeo, gridMat));
  }
}

// ---------------------------------------------------------------------------
// Connection paths (glowing lines between objects on the ground)
// ---------------------------------------------------------------------------

interface PathData {
  line: THREE.Line;
  mat: THREE.LineBasicMaterial;
  phaseOffset: number;
}

function createConnectionPath(
  from: THREE.Vector3,
  to: THREE.Vector3,
  color: number,
  phaseOffset: number
): PathData {
  // Create an L-shaped path on the ground
  const mid = new THREE.Vector3(to.x, 0.02, from.z);
  const pts = [
    new THREE.Vector3(from.x, 0.02, from.z),
    mid,
    new THREE.Vector3(to.x, 0.02, to.z),
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.3,
  });
  const line = new THREE.Line(geo, mat);
  return { line, mat, phaseOffset };
}

// ---------------------------------------------------------------------------
// Desk / Workstation
// ---------------------------------------------------------------------------

function createDesk(): THREE.Group {
  const group = new THREE.Group();

  // Desktop surface
  const deskGeo = new THREE.BoxGeometry(2.0, 0.08, 1.2);
  const deskMat = phong(0x2d2d3d);
  const desk = new THREE.Mesh(deskGeo, deskMat);
  desk.position.y = 0.7;
  group.add(desk);

  // Desk legs (4)
  const legGeo = new THREE.BoxGeometry(0.08, 0.7, 0.08);
  const legMat = phong(0x3d3d4d);
  const legPositions = [
    [-0.85, 0.35, -0.5],
    [0.85, 0.35, -0.5],
    [-0.85, 0.35, 0.5],
    [0.85, 0.35, 0.5],
  ];
  for (const [lx, ly, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, ly, lz);
    group.add(leg);
  }

  // Laptop base
  const laptopBaseGeo = new THREE.BoxGeometry(0.9, 0.04, 0.6);
  const laptopBaseMat = phong(0x4a4a5a);
  const laptopBase = new THREE.Mesh(laptopBaseGeo, laptopBaseMat);
  laptopBase.position.set(0, 0.76, 0);
  group.add(laptopBase);

  // Laptop screen (angled back)
  const screenGroup = new THREE.Group();
  screenGroup.position.set(0, 0.78, -0.28);
  screenGroup.rotation.x = -0.25;

  // Screen frame
  const frameGeo = new THREE.BoxGeometry(0.88, 0.6, 0.03);
  const frameMat = phong(0x4a4a5a);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.y = 0.3;
  screenGroup.add(frame);

  // Glowing screen surface
  const screenGeo = new THREE.PlaneGeometry(0.78, 0.5);
  const screenMat = new THREE.MeshBasicMaterial({
    color: BRAND_BLUE,
    transparent: true,
    opacity: 0.9,
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.3, 0.02);
  screenGroup.add(screen);

  // Code lines on screen (simple horizontal bars)
  const lineColors = [CYAN, GREEN, PINK, BLUE, AMBER];
  for (let i = 0; i < 5; i++) {
    const width = 0.2 + Math.random() * 0.35;
    const lineGeo = new THREE.PlaneGeometry(width, 0.025);
    const lineMat = new THREE.MeshBasicMaterial({
      color: lineColors[i % lineColors.length],
      transparent: true,
      opacity: 0.7,
    });
    const codeLine = new THREE.Mesh(lineGeo, lineMat);
    codeLine.position.set(
      -0.15 + (width / 2 - 0.25) * 0.3,
      0.44 - i * 0.07,
      0.025
    );
    screenGroup.add(codeLine);
  }

  group.add(screenGroup);

  // Chair (simple geometric)
  const seatGeo = new THREE.BoxGeometry(0.55, 0.06, 0.5);
  const seatMat = phong(PURPLE);
  const seat = new THREE.Mesh(seatGeo, seatMat);
  seat.position.set(0, 0.45, 0.9);
  group.add(seat);

  // Chair back
  const backGeo = new THREE.BoxGeometry(0.55, 0.5, 0.06);
  const backMat = phong(darken(PURPLE, 20));
  const back = new THREE.Mesh(backGeo, backMat);
  back.position.set(0, 0.72, 1.13);
  group.add(back);

  // Chair legs
  const chairLegGeo = new THREE.BoxGeometry(0.06, 0.45, 0.06);
  const chairLegMat = phong(0x3d3d4d);
  const chairLegs = [
    [-0.2, 0.22, 0.7],
    [0.2, 0.22, 0.7],
    [-0.2, 0.22, 1.1],
    [0.2, 0.22, 1.1],
  ];
  for (const [cx, cy, cz] of chairLegs) {
    const cl = new THREE.Mesh(chairLegGeo, chairLegMat);
    cl.position.set(cx, cy, cz);
    group.add(cl);
  }

  return group;
}

// ---------------------------------------------------------------------------
// GPU Tower / Server rack
// ---------------------------------------------------------------------------

function createGPUTower(): THREE.Group {
  const group = new THREE.Group();

  // Main tower body
  const bodyGeo = new THREE.BoxGeometry(0.7, 2.0, 0.6);
  const bodyMat = phong(0x2a2a3a);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.0;
  group.add(body);

  // Front panel (slightly lighter)
  const panelGeo = new THREE.BoxGeometry(0.72, 2.0, 0.02);
  const panelMat = phong(0x33334a);
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(0, 1.0, 0.31);
  group.add(panel);

  // LED strips (emissive rectangles on front)
  const ledColors = [CYAN, GREEN, BLUE, CYAN, GREEN, AMBER];
  for (let i = 0; i < 6; i++) {
    const ledGeo = new THREE.PlaneGeometry(0.5, 0.04);
    const ledMat = new THREE.MeshBasicMaterial({
      color: ledColors[i],
      transparent: true,
      opacity: 0.9,
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 0.3 + i * 0.28, 0.33);
    group.add(led);
  }

  // Status light dots
  const dotGeo = new THREE.CircleGeometry(0.03, 8);
  for (let i = 0; i < 3; i++) {
    const dotMat = new THREE.MeshBasicMaterial({
      color: i === 0 ? GREEN : i === 1 ? CYAN : AMBER,
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(-0.2 + i * 0.15, 1.9, 0.33);
    group.add(dot);
  }

  // Vent lines on top
  const ventMat = phong(0x222233);
  for (let i = 0; i < 4; i++) {
    const ventGeo = new THREE.BoxGeometry(0.5, 0.01, 0.04);
    const vent = new THREE.Mesh(ventGeo, ventMat);
    vent.position.set(0, 2.01, -0.15 + i * 0.1);
    group.add(vent);
  }

  return group;
}

// ---------------------------------------------------------------------------
// Orbiting knowledge symbols
// ---------------------------------------------------------------------------

interface OrbitingSymbol {
  group: THREE.Group;
  orbitRadius: number;
  orbitSpeed: number;
  orbitPhase: number;
  floatPhase: number;
  floatSpeed: number;
  baseY: number;
}

function createBook(): THREE.Group {
  const group = new THREE.Group();

  // Left page
  const pageGeo = new THREE.BoxGeometry(0.3, 0.4, 0.03);
  const pageMat = phong(0xf0f0f0);
  const leftPage = new THREE.Mesh(pageGeo, pageMat);
  leftPage.rotation.y = 0.2;
  leftPage.position.x = -0.13;
  group.add(leftPage);

  // Right page
  const rightPage = new THREE.Mesh(pageGeo, pageMat);
  rightPage.rotation.y = -0.2;
  rightPage.position.x = 0.13;
  group.add(rightPage);

  // Spine
  const spineGeo = new THREE.BoxGeometry(0.04, 0.4, 0.06);
  const spineMat = phong(BLUE);
  const spine = new THREE.Mesh(spineGeo, spineMat);
  group.add(spine);

  // Text lines on pages
  const lineMat = new THREE.MeshBasicMaterial({
    color: 0xaaaacc,
    transparent: true,
    opacity: 0.5,
  });
  for (let i = 0; i < 4; i++) {
    const w = 0.12 + Math.random() * 0.08;
    const lineGeo = new THREE.PlaneGeometry(w, 0.015);
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(0.13, 0.1 - i * 0.06, 0.02);
    line.rotation.y = -0.2;
    group.add(line);
  }

  group.scale.setScalar(0.7);
  return group;
}

function createCodeBracket(): THREE.Group {
  const group = new THREE.Group();

  // Create </> shape from boxes
  const barMat = phong(CYAN, { emissive: CYAN, emissiveIntensity: 0.3 });

  // Left bracket <
  const leftDiag1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.04, 0.04),
    barMat
  );
  leftDiag1.rotation.z = 0.5;
  leftDiag1.position.set(-0.18, 0.06, 0);
  group.add(leftDiag1);

  const leftDiag2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.04, 0.04),
    barMat
  );
  leftDiag2.rotation.z = -0.5;
  leftDiag2.position.set(-0.18, -0.06, 0);
  group.add(leftDiag2);

  // Slash /
  const slash = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.3, 0.04),
    phong(PINK, { emissive: PINK, emissiveIntensity: 0.3 })
  );
  slash.rotation.z = 0.3;
  group.add(slash);

  // Right bracket >
  const rightDiag1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.04, 0.04),
    barMat
  );
  rightDiag1.rotation.z = -0.5;
  rightDiag1.position.set(0.18, 0.06, 0);
  group.add(rightDiag1);

  const rightDiag2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.04, 0.04),
    barMat
  );
  rightDiag2.rotation.z = 0.5;
  rightDiag2.position.set(0.18, -0.06, 0);
  group.add(rightDiag2);

  group.scale.setScalar(0.9);
  return group;
}

function createGraduationCap(): THREE.Group {
  const group = new THREE.Group();

  // Mortarboard top (flat diamond shape via rotated box)
  const topGeo = new THREE.BoxGeometry(0.5, 0.03, 0.5);
  const topMat = phong(AMBER, { emissive: AMBER, emissiveIntensity: 0.15 });
  const top = new THREE.Mesh(topGeo, topMat);
  top.rotation.y = Math.PI / 4;
  top.position.y = 0.1;
  group.add(top);

  // Cap base (short cylinder)
  const baseGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.12, 6);
  const baseMat = phong(darken(AMBER, 30));
  const base = new THREE.Mesh(baseGeo, baseMat);
  group.add(base);

  // Tassel (small drooping line represented by thin boxes)
  const tasselMat = phong(PINK);
  const tasselTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.15, 0.03),
    tasselMat
  );
  tasselTop.position.set(0.2, 0.02, 0.2);
  group.add(tasselTop);

  const tasselBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 6, 6),
    tasselMat
  );
  tasselBall.position.set(0.2, -0.06, 0.2);
  group.add(tasselBall);

  group.scale.setScalar(0.65);
  return group;
}

function createOrbitingSymbols(): OrbitingSymbol[] {
  const symbols: OrbitingSymbol[] = [];

  const configs = [
    { create: createBook, radius: 3.2, speed: 0.25, phase: 0, y: 2.5 },
    {
      create: createCodeBracket,
      radius: 3.6,
      speed: 0.3,
      phase: (Math.PI * 2) / 3,
      y: 2.8,
    },
    {
      create: createGraduationCap,
      radius: 3.0,
      speed: 0.2,
      phase: ((Math.PI * 2) / 3) * 2,
      y: 2.2,
    },
  ];

  for (const cfg of configs) {
    const mesh = cfg.create();
    symbols.push({
      group: mesh,
      orbitRadius: cfg.radius,
      orbitSpeed: cfg.speed,
      orbitPhase: cfg.phase,
      floatPhase: Math.random() * Math.PI * 2,
      floatSpeed: 0.8 + Math.random() * 0.4,
      baseY: cfg.y,
    });
  }

  return symbols;
}

// ---------------------------------------------------------------------------
// Rising data particles
// ---------------------------------------------------------------------------

interface RisingParticles {
  points: THREE.Points;
  positions: Float32Array;
  velocities: Float32Array;
  count: number;
}

function createRisingParticles(count: number): RisingParticles {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const velocities = new Float32Array(count);

  const palette = [CYAN, BLUE, PINK, GREEN, PURPLE, AMBER];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 1] = Math.random() * 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    velocities[i] = 0.003 + Math.random() * 0.008;

    const c = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return { points: new THREE.Points(geo, mat), positions, velocities, count };
}

function updateRisingParticles(ps: RisingParticles): void {
  const posAttr = ps.points.geometry.getAttribute(
    "position"
  ) as THREE.BufferAttribute;
  const positions = posAttr.array as Float32Array;

  for (let i = 0; i < ps.count; i++) {
    positions[i * 3 + 1] += ps.velocities[i];

    // Gentle horizontal drift
    positions[i * 3] += Math.sin(positions[i * 3 + 1] * 2 + i) * 0.001;
    positions[i * 3 + 2] += Math.cos(positions[i * 3 + 1] * 2 + i) * 0.001;

    // Reset when too high
    if (positions[i * 3 + 1] > 6) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = -0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
  }

  posAttr.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// Main init
// ---------------------------------------------------------------------------

export function initHeroScene(container: HTMLElement): void {
  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  renderer.domElement.style.pointerEvents = "none";

  // --- Scene ---
  const scene = new THREE.Scene();

  // --- Camera (isometric orthographic) ---
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

  // True isometric angle
  const isoAngle = Math.atan(Math.sin(Math.PI / 4)); // ~35.264 deg
  const distance = 20;
  camera.position.set(
    distance * Math.cos(isoAngle) * Math.sin(Math.PI / 4),
    distance * Math.sin(isoAngle),
    distance * Math.cos(isoAngle) * Math.cos(Math.PI / 4)
  );
  camera.lookAt(0, 1.0, 0);

  // --- Lighting ---
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // Subtle colored fill light from below/side
  const fillLight = new THREE.DirectionalLight(BRAND_BLUE, 0.15);
  fillLight.position.set(-3, -2, 4);
  scene.add(fillLight);

  // --- Root group for parallax ---
  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  // --- Ground grid ---
  createGroundGrid(rootGroup);

  // --- Desk ---
  const desk = createDesk();
  desk.position.set(-0.3, 0, 0.2);
  rootGroup.add(desk);

  // --- GPU Tower ---
  const tower = createGPUTower();
  tower.position.set(2.2, 0, -0.8);
  rootGroup.add(tower);

  // --- Connection paths ---
  const deskPos = new THREE.Vector3(-0.3, 0, 0.2);
  const towerPos = new THREE.Vector3(2.2, 0, -0.8);

  const paths: PathData[] = [];

  // Desk to tower
  const p1 = createConnectionPath(deskPos, towerPos, CYAN, 0);
  rootGroup.add(p1.line);
  paths.push(p1);

  // Desk to left area (representing network)
  const p2 = createConnectionPath(
    deskPos,
    new THREE.Vector3(-3.5, 0, -1.5),
    PURPLE,
    1.5
  );
  rootGroup.add(p2.line);
  paths.push(p2);

  // Tower to back area
  const p3 = createConnectionPath(
    towerPos,
    new THREE.Vector3(1.0, 0, -3.5),
    GREEN,
    3.0
  );
  rootGroup.add(p3.line);
  paths.push(p3);

  // Extra path
  const p4 = createConnectionPath(
    deskPos,
    new THREE.Vector3(-2.0, 0, 2.5),
    PINK,
    4.5
  );
  rootGroup.add(p4.line);
  paths.push(p4);

  // Small node markers at path endpoints
  const nodeMat = new THREE.MeshBasicMaterial({
    color: BRAND_BLUE,
    transparent: true,
    opacity: 0.5,
  });
  const nodeGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const nodePositions = [
    new THREE.Vector3(-3.5, 0.08, -1.5),
    new THREE.Vector3(1.0, 0.08, -3.5),
    new THREE.Vector3(-2.0, 0.08, 2.5),
  ];
  for (const np of nodePositions) {
    const node = new THREE.Mesh(nodeGeo, nodeMat.clone());
    node.position.copy(np);
    rootGroup.add(node);
  }

  // --- Orbiting symbols ---
  const symbols = createOrbitingSymbols();
  for (const sym of symbols) {
    rootGroup.add(sym.group);
  }

  // --- Rising particles ---
  const risingParticles = createRisingParticles(40);
  rootGroup.add(risingParticles.points);

  // --- Glow halos around key objects ---
  const haloGeo = new THREE.RingGeometry(0.6, 0.9, 32);
  const haloMat = new THREE.MeshBasicMaterial({
    color: BRAND_BLUE,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
  });
  const deskHalo = new THREE.Mesh(haloGeo, haloMat);
  deskHalo.rotation.x = -Math.PI / 2;
  deskHalo.position.set(-0.3, 0.01, 0.2);
  rootGroup.add(deskHalo);

  const towerHaloGeo = new THREE.RingGeometry(0.4, 0.65, 32);
  const towerHaloMat = new THREE.MeshBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
  });
  const towerHalo = new THREE.Mesh(towerHaloGeo, towerHaloMat);
  towerHalo.rotation.x = -Math.PI / 2;
  towerHalo.position.set(2.2, 0.01, -0.8);
  rootGroup.add(towerHalo);

  // --- Mouse tracking ---
  let mouseX = 0;
  let mouseY = 0;
  let isHovering = false;

  function onMouseMove(e: MouseEvent): void {
    const rect = container.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }

  function onMouseEnter(): void {
    isHovering = true;
  }

  function onMouseLeave(): void {
    isHovering = false;
  }

  const parentEl = container.parentElement || container;
  parentEl.addEventListener("mousemove", onMouseMove);
  parentEl.addEventListener("mouseenter", onMouseEnter);
  parentEl.addEventListener("mouseleave", onMouseLeave);

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

  // --- LED references for animation ---
  const ledMeshes: THREE.Mesh[] = [];
  tower.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.geometry instanceof THREE.PlaneGeometry
    ) {
      const params = child.geometry.parameters;
      if (params && params.width === 0.5 && params.height === 0.04) {
        ledMeshes.push(child);
      }
    }
  });

  // --- Animation loop ---
  let targetParallaxX = 0;
  let targetParallaxY = 0;
  let currentParallaxX = 0;
  let currentParallaxY = 0;
  let targetBrightness = 0.6;
  let currentBrightness = 0.6;
  let firstFrame = true;

  function animate(): void {
    requestAnimationFrame(animate);

    const time = performance.now() * 0.001;

    // Mouse parallax
    targetParallaxX = mouseX * 0.08;
    targetParallaxY = mouseY * 0.04;
    currentParallaxX += (targetParallaxX - currentParallaxX) * 0.03;
    currentParallaxY += (targetParallaxY - currentParallaxY) * 0.03;

    rootGroup.rotation.y = currentParallaxX;
    rootGroup.rotation.x = currentParallaxY;

    // Hover brightness
    targetBrightness = isHovering ? 0.75 : 0.6;
    currentBrightness += (targetBrightness - currentBrightness) * 0.05;
    ambient.intensity = currentBrightness;

    // Pulse connection paths
    for (const path of paths) {
      const pulse = 0.2 + Math.sin(time * 1.2 + path.phaseOffset) * 0.15;
      path.mat.opacity = pulse;
    }

    // Pulse LED strips
    for (let i = 0; i < ledMeshes.length; i++) {
      const mat = ledMeshes[i].material as THREE.MeshBasicMaterial;
      mat.opacity = 0.6 + Math.sin(time * 2.0 + i * 1.5) * 0.35;
    }

    // Pulse node markers
    for (const np of nodePositions) {
      // Nodes just pulse via the shared material — handled by path pulse timing
    }

    // Orbit knowledge symbols
    for (const sym of symbols) {
      const angle = time * sym.orbitSpeed + sym.orbitPhase;
      sym.group.position.x = Math.cos(angle) * sym.orbitRadius;
      sym.group.position.z = Math.sin(angle) * sym.orbitRadius;
      sym.group.position.y =
        sym.baseY + Math.sin(time * sym.floatSpeed + sym.floatPhase) * 0.2;

      // Gentle self-rotation
      sym.group.rotation.y = time * 0.5;
      sym.group.rotation.x = Math.sin(time * 0.3 + sym.orbitPhase) * 0.15;
    }

    // Screen glow pulse
    // (the laptop screen emits a subtle brightness variation)

    // Rising particles
    updateRisingParticles(risingParticles);

    // Halo pulse
    (deskHalo.material as THREE.MeshBasicMaterial).opacity =
      0.04 + Math.sin(time * 0.8) * 0.03;
    (towerHalo.material as THREE.MeshBasicMaterial).opacity =
      0.04 + Math.sin(time * 0.8 + 1.5) * 0.03;

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
    parentEl.removeEventListener("mouseenter", onMouseEnter);
    parentEl.removeEventListener("mouseleave", onMouseLeave);
    renderer.dispose();
  };
}
