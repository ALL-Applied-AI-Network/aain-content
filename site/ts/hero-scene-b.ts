/**
 * hero-scene-b.ts — Clean isometric workstation vignette.
 * Desk, laptop, external monitor, GPU tower, chair. Nothing else.
 * Mouse parallax + RGB ambient lighting effects.
 */

import * as THREE from "three";

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const CHARCOAL = 0x2a2a2e;
const DARK_SURFACE = 0x1e1e22;
const MID_GRAY = 0x3a3a40;
const NVIDIA_GREEN = 0x76b900;
const SCREEN_BLUE = 0x3b82f6;
const CYAN = 0x22d3ee;
const GREEN = 0x10b981;
const PINK = 0xec4899;
const AMBER = 0xf59e0b;

// ---------------------------------------------------------------------------
// Shared materials
// ---------------------------------------------------------------------------

const matCharcoal = new THREE.MeshStandardMaterial({
  color: CHARCOAL,
  roughness: 0.75,
  metalness: 0.05,
});

const matDark = new THREE.MeshStandardMaterial({
  color: DARK_SURFACE,
  roughness: 0.75,
  metalness: 0.05,
});

const matMidGray = new THREE.MeshStandardMaterial({
  color: MID_GRAY,
  roughness: 0.7,
  metalness: 0.05,
});

const matChair = new THREE.MeshStandardMaterial({
  color: 0x303040,
  roughness: 0.8,
  metalness: 0.0,
});

const matTower = new THREE.MeshStandardMaterial({
  color: 0x252528,
  roughness: 0.5,
  metalness: 0.25,
});

const matTowerPanel = new THREE.MeshStandardMaterial({
  color: 0x2c2c30,
  roughness: 0.5,
  metalness: 0.25,
});

// ---------------------------------------------------------------------------
// Laptop
// ---------------------------------------------------------------------------

interface LaptopRefs {
  group: THREE.Group;
  codeLines: THREE.Mesh[];
}

function createLaptop(): LaptopRefs {
  const group = new THREE.Group();
  const codeLines: THREE.Mesh[] = [];

  // Base slab
  const baseW = 0.88;
  const baseD = 0.58;
  const baseH = 0.035;
  const baseGeo = new THREE.BoxGeometry(baseW, baseH, baseD);
  const base = new THREE.Mesh(baseGeo, matCharcoal);
  base.position.y = baseH / 2;
  group.add(base);

  // Keyboard area (subtle recessed rectangle)
  const kbGeo = new THREE.BoxGeometry(baseW - 0.12, 0.004, baseD - 0.16);
  const kbMat = new THREE.MeshStandardMaterial({
    color: 0x232328,
    roughness: 0.9,
    metalness: 0.0,
  });
  const kb = new THREE.Mesh(kbGeo, kbMat);
  kb.position.set(0, baseH + 0.002, -0.02);
  group.add(kb);

  // Trackpad
  const tpGeo = new THREE.BoxGeometry(0.2, 0.003, 0.12);
  const tp = new THREE.Mesh(tpGeo, kbMat);
  tp.position.set(0, baseH + 0.002, 0.2);
  group.add(tp);

  // Screen pivot (hinge at back edge)
  const screenPivot = new THREE.Group();
  screenPivot.position.set(0, baseH, -baseD / 2);
  // 110 degrees open: screen tilts 20 deg back from vertical
  screenPivot.rotation.x = -(Math.PI / 2) + (110 * Math.PI) / 180;

  const screenW = 0.82;
  const screenH = 0.52;
  const bezelT = 0.02;

  // Bezel shell
  const bezelGeo = new THREE.BoxGeometry(
    screenW + bezelT * 2,
    screenH + bezelT * 2,
    0.018
  );
  const bezel = new THREE.Mesh(bezelGeo, matCharcoal);
  bezel.position.y = screenH / 2 + bezelT;
  screenPivot.add(bezel);

  // Display surface
  const displayGeo = new THREE.PlaneGeometry(screenW, screenH);
  const displayMat = new THREE.MeshStandardMaterial({
    color: 0x0c1828,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x1a3060,
    emissiveIntensity: 0.35,
  });
  const display = new THREE.Mesh(displayGeo, displayMat);
  display.position.set(0, screenH / 2 + bezelT, 0.01);
  screenPivot.add(display);

  // Code lines on screen
  const lineConfigs = [
    { color: CYAN, width: 0.32, xOff: -0.18 },
    { color: GREEN, width: 0.22, xOff: -0.22 },
    { color: PINK, width: 0.38, xOff: -0.1 },
    { color: AMBER, width: 0.16, xOff: -0.26 },
    { color: SCREEN_BLUE, width: 0.28, xOff: -0.14 },
  ];
  for (let i = 0; i < lineConfigs.length; i++) {
    const cfg = lineConfigs[i];
    const lineGeo = new THREE.PlaneGeometry(cfg.width, 0.014);
    const lineMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.65,
    });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(
      cfg.xOff + cfg.width * 0.15,
      screenH / 2 + 0.13 - i * 0.055,
      0.011
    );
    screenPivot.add(line);
    codeLines.push(line);
  }

  group.add(screenPivot);
  return { group, codeLines };
}

// ---------------------------------------------------------------------------
// External monitor
// ---------------------------------------------------------------------------

interface MonitorRefs {
  group: THREE.Group;
  codeLines: THREE.Mesh[];
}

function createMonitor(): MonitorRefs {
  const group = new THREE.Group();
  const codeLines: THREE.Mesh[] = [];

  // Stand base
  const standBaseGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.012, 10);
  const standBase = new THREE.Mesh(standBaseGeo, matMidGray);
  standBase.position.y = 0.006;
  group.add(standBase);

  // Stand neck
  const neckGeo = new THREE.BoxGeometry(0.035, 0.36, 0.035);
  const neck = new THREE.Mesh(neckGeo, matMidGray);
  neck.position.y = 0.19;
  group.add(neck);

  // Screen panel
  const sw = 1.0;
  const sh = 0.56;
  const panelGeo = new THREE.BoxGeometry(sw + 0.03, sh + 0.03, 0.02);
  const panel = new THREE.Mesh(panelGeo, matCharcoal);
  panel.position.y = 0.37 + sh / 2;
  group.add(panel);

  // Display
  const displayGeo = new THREE.PlaneGeometry(sw, sh);
  const displayMat = new THREE.MeshStandardMaterial({
    color: 0x0e1a30,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x1a3060,
    emissiveIntensity: 0.3,
  });
  const display = new THREE.Mesh(displayGeo, displayMat);
  display.position.set(0, 0.37 + sh / 2, 0.011);
  group.add(display);

  // Content lines (different colors to suggest a different tool)
  const monitorLines = [
    { color: SCREEN_BLUE, width: 0.45, xOff: -0.14 },
    { color: GREEN, width: 0.3, xOff: -0.22 },
    { color: CYAN, width: 0.36, xOff: -0.16 },
  ];
  for (let i = 0; i < monitorLines.length; i++) {
    const cfg = monitorLines[i];
    const lineGeo = new THREE.PlaneGeometry(cfg.width, 0.013);
    const lineMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.6,
    });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(
      cfg.xOff + cfg.width * 0.12,
      0.37 + sh / 2 + 0.1 - i * 0.065,
      0.012
    );
    group.add(line);
    codeLines.push(line);
  }

  return { group, codeLines };
}

// ---------------------------------------------------------------------------
// Desk with coffee mug and mouse
// ---------------------------------------------------------------------------

function createDesk(): THREE.Group {
  const group = new THREE.Group();

  // Desktop surface
  const topGeo = new THREE.BoxGeometry(2.1, 0.055, 1.2);
  const top = new THREE.Mesh(topGeo, matDark);
  top.position.y = 0.72;
  group.add(top);

  // Thin edge accent
  const edgeGeo = new THREE.BoxGeometry(2.14, 0.012, 1.24);
  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0x2c2c32,
    roughness: 0.6,
    metalness: 0.1,
  });
  const edge = new THREE.Mesh(edgeGeo, edgeMat);
  edge.position.y = 0.69;
  group.add(edge);

  // Legs (4 thin cylinders)
  const legGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.69, 6);
  const legs: [number, number, number][] = [
    [-0.9, 0.345, -0.5],
    [0.9, 0.345, -0.5],
    [-0.9, 0.345, 0.5],
    [0.9, 0.345, 0.5],
  ];
  for (const [lx, ly, lz] of legs) {
    const leg = new THREE.Mesh(legGeo, matMidGray);
    leg.position.set(lx, ly, lz);
    group.add(leg);
  }

  // Coffee mug
  const mugGroup = new THREE.Group();
  mugGroup.position.set(0.7, 0.75, 0.32);

  const mugGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.12, 10);
  const mugMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a4c,
    roughness: 0.7,
    metalness: 0.1,
  });
  const mugBody = new THREE.Mesh(mugGeo, mugMat);
  mugBody.position.y = 0.06;
  mugGroup.add(mugBody);

  const handleGeo = new THREE.TorusGeometry(0.035, 0.01, 6, 8, Math.PI);
  const handle = new THREE.Mesh(handleGeo, mugMat);
  handle.rotation.y = Math.PI / 2;
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(0.065, 0.06, 0);
  mugGroup.add(handle);

  const coffeeSurface = new THREE.Mesh(
    new THREE.CircleGeometry(0.045, 10),
    new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 1.0 })
  );
  coffeeSurface.rotation.x = -Math.PI / 2;
  coffeeSurface.position.y = 0.115;
  mugGroup.add(coffeeSurface);

  group.add(mugGroup);

  // Mouse
  const mouseGeo = new THREE.BoxGeometry(0.08, 0.025, 0.13);
  const mouseMat = new THREE.MeshStandardMaterial({
    color: 0x3e3e46,
    roughness: 0.5,
    metalness: 0.1,
  });
  const mouse = new THREE.Mesh(mouseGeo, mouseMat);
  mouse.position.set(0.6, 0.76, 0.05);
  group.add(mouse);

  return group;
}

// ---------------------------------------------------------------------------
// GPU / Compute tower
// ---------------------------------------------------------------------------

interface TowerRefs {
  group: THREE.Group;
  leds: THREE.Mesh[];
  ledMats: THREE.MeshBasicMaterial[];
  stripMat: THREE.MeshStandardMaterial;
}

function createGPUTower(): TowerRefs {
  const group = new THREE.Group();
  const leds: THREE.Mesh[] = [];
  const ledMats: THREE.MeshBasicMaterial[] = [];

  const tw = 0.58;
  const th = 1.75;
  const td = 0.48;

  // Main body
  const bodyGeo = new THREE.BoxGeometry(tw, th, td);
  const body = new THREE.Mesh(bodyGeo, matTower);
  body.position.y = th / 2;
  group.add(body);

  // Front panel (subtle inset)
  const fpGeo = new THREE.BoxGeometry(tw - 0.02, th - 0.06, 0.01);
  const fp = new THREE.Mesh(fpGeo, matTowerPanel);
  fp.position.set(0, th / 2, td / 2 + 0.006);
  group.add(fp);

  // Horizontal seam lines (bay dividers)
  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c20,
    roughness: 0.9,
  });
  for (let i = 0; i < 4; i++) {
    const seamGeo = new THREE.BoxGeometry(tw - 0.08, 0.006, 0.002);
    const seam = new THREE.Mesh(seamGeo, seamMat);
    seam.position.set(0, 0.3 + i * 0.38, td / 2 + 0.012);
    group.add(seam);
  }

  // LED accent stripe (thin vertical strip on front-right edge) — will cycle RGB
  const stripGeo = new THREE.BoxGeometry(0.012, th - 0.2, 0.012);
  const stripMat = new THREE.MeshStandardMaterial({
    color: NVIDIA_GREEN,
    roughness: 0.4,
    metalness: 0.3,
    emissive: NVIDIA_GREEN,
    emissiveIntensity: 0.15,
  });
  const strip = new THREE.Mesh(stripGeo, stripMat);
  strip.position.set(tw / 2 - 0.02, th / 2, td / 2 + 0.007);
  group.add(strip);

  // Status LEDs (2-3 small dots near top)
  const ledGeo = new THREE.CircleGeometry(0.012, 6);
  const ledConfigs = [
    { color: NVIDIA_GREEN, x: -0.1 },
    { color: NVIDIA_GREEN, x: 0.0 },
    { color: 0x3388ff, x: 0.1 },
  ];
  for (const cfg of ledConfigs) {
    const mat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.7,
    });
    const led = new THREE.Mesh(ledGeo, mat);
    led.position.set(cfg.x, th - 0.08, td / 2 + 0.013);
    group.add(led);
    leds.push(led);
    ledMats.push(mat);
  }

  return { group, leds, ledMats, stripMat };
}

// ---------------------------------------------------------------------------
// Chair
// ---------------------------------------------------------------------------

function createChair(): THREE.Group {
  const group = new THREE.Group();

  // Seat
  const seatGeo = new THREE.BoxGeometry(0.48, 0.045, 0.44);
  const seat = new THREE.Mesh(seatGeo, matChair);
  seat.position.y = 0.46;
  group.add(seat);

  // Backrest
  const backGeo = new THREE.BoxGeometry(0.44, 0.38, 0.035);
  const back = new THREE.Mesh(backGeo, matChair);
  back.position.set(0, 0.68, -0.2);
  back.rotation.x = 0.08;
  group.add(back);

  // Pedestal
  const pedGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.32, 6);
  const ped = new THREE.Mesh(pedGeo, matMidGray);
  ped.position.y = 0.27;
  group.add(ped);

  // Base spokes (5)
  const spokeGeo = new THREE.BoxGeometry(0.26, 0.018, 0.025);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const spoke = new THREE.Mesh(spokeGeo, matMidGray);
    spoke.position.set(
      Math.sin(angle) * 0.12,
      0.07,
      Math.cos(angle) * 0.12
    );
    spoke.rotation.y = -angle;
    group.add(spoke);

    // Wheel
    const wheelGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.025, 6);
    const wheel = new THREE.Mesh(wheelGeo, matDark);
    wheel.position.set(
      Math.sin(angle) * 0.24,
      0.02,
      Math.cos(angle) * 0.24
    );
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
  }

  return group;
}

// ---------------------------------------------------------------------------
// HSL helper: convert hue (0-1) to THREE.Color
// ---------------------------------------------------------------------------

function hslColor(h: number, s: number, l: number): THREE.Color {
  return new THREE.Color().setHSL(h, s, l);
}

// ---------------------------------------------------------------------------
// Scene init
// ---------------------------------------------------------------------------

export function initHeroScene(container: HTMLElement): void {
  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Scene
  const scene = new THREE.Scene();

  // Orthographic camera (isometric)
  const frustum = 2.2;
  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.OrthographicCamera(
    -frustum * aspect,
    frustum * aspect,
    frustum,
    -frustum,
    0.1,
    50
  );

  // True isometric: elevation ~35.264 degrees
  const isoAngle = Math.atan(1 / Math.sqrt(2)); // ~35.264 deg
  const dist = 12;
  // Position camera upper-left
  const baseCamX = -dist * Math.cos(isoAngle) * Math.sin(Math.PI / 4);
  const baseCamY = dist * Math.sin(isoAngle);
  const baseCamZ = dist * Math.cos(isoAngle) * Math.cos(Math.PI / 4);
  camera.position.set(baseCamX, baseCamY, baseCamZ);
  camera.lookAt(0, 0.7, 0);

  // Lighting — clean and simple
  const hemi = new THREE.HemisphereLight(0x4466aa, 0x1a1a2e, 0.5);
  scene.add(hemi);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
  dirLight.position.set(-4, 6, 3);
  scene.add(dirLight);

  const screenGlow = new THREE.PointLight(SCREEN_BLUE, 0.15, 3);
  screenGlow.position.set(0, 1.2, 0.3);
  scene.add(screenGlow);

  // RGB ambient glow — PointLight near the GPU tower, cycles through rainbow
  const rgbLight = new THREE.PointLight(0xff0000, 0.12, 4);
  rgbLight.position.set(1.2, 0.9, 0.3);
  scene.add(rgbLight);

  // Scene root — offset slightly right so text overlay sits on left
  const root = new THREE.Group();
  root.position.set(0.3, 0, 0);
  scene.add(root);

  // Build objects
  const desk = createDesk();
  root.add(desk);

  const laptop = createLaptop();
  // Place laptop on desk surface
  laptop.group.position.set(-0.15, 0.75, 0.05);
  root.add(laptop.group);

  const monitor = createMonitor();
  // Behind laptop, centered
  monitor.group.position.set(-0.15, 0.75, -0.5);
  root.add(monitor.group);

  const tower = createGPUTower();
  // Right of desk, slightly behind
  tower.group.position.set(1.2, 0, 0.0);
  root.add(tower.group);

  const chair = createChair();
  // In front of desk
  chair.position.set(-0.1, 0, 1.0);
  chair.rotation.y = 0.15; // slightly angled
  root.add(chair);

  // Collect all code lines for animation
  const allCodeLines = [...laptop.codeLines, ...monitor.codeLines];

  // -----------------------------------------------------------------------
  // Mouse parallax state
  // -----------------------------------------------------------------------

  const lookAtTarget = new THREE.Vector3(0, 0.7, 0);

  // Parallax: normalized mouse position (-1 to 1)
  let mouseX = 0;
  let mouseY = 0;

  // Smoothed camera offsets
  let smoothOffX = 0;
  let smoothOffY = 0;

  // Parallax strength
  const PARALLAX_X = 0.6;
  const PARALLAX_Y = 0.35;

  // Hover reaction state
  let isHovered = false;
  let hoverIntensity = 0; // 0 = not hovered, 1 = fully hovered (lerped)

  // RGB cycle speed: full rainbow in ~18 seconds
  const RGB_CYCLE_PERIOD = 18;

  // Default cursor
  container.style.cursor = "default";

  // -----------------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------------

  function onMouseMove(e: MouseEvent): void {
    // Normalize to -1..1 across the whole viewport
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }

  function onMouseEnter(): void {
    isHovered = true;
  }

  function onMouseLeave(): void {
    isHovered = false;
  }

  window.addEventListener("mousemove", onMouseMove);
  container.addEventListener("mouseenter", onMouseEnter);
  container.addEventListener("mouseleave", onMouseLeave);

  // -----------------------------------------------------------------------
  // Resize
  // -----------------------------------------------------------------------

  function resize(): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const a = w / h;
    camera.left = -frustum * a;
    camera.right = frustum * a;
    camera.top = frustum;
    camera.bottom = -frustum;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // -----------------------------------------------------------------------
  // Animation
  // -----------------------------------------------------------------------

  let running = true;
  let firstFrame = true;

  // Base intensities for RGB effects
  const RGB_LIGHT_BASE = 0.12;
  const RGB_LIGHT_HOVER = 0.22;
  const SCREEN_GLOW_BASE = 0.15;

  // Temp color for HSL operations
  const tmpColor = new THREE.Color();

  function animate(): void {
    if (!running) return;
    requestAnimationFrame(animate);

    const t = performance.now() * 0.001;

    // --- Mouse parallax ---
    const targetOffX = mouseX * PARALLAX_X;
    const targetOffY = -mouseY * PARALLAX_Y;
    smoothOffX += (targetOffX - smoothOffX) * 0.05;
    smoothOffY += (targetOffY - smoothOffY) * 0.05;

    camera.position.set(
      baseCamX + smoothOffX,
      baseCamY + smoothOffY,
      baseCamZ
    );
    camera.lookAt(lookAtTarget);

    // --- Hover intensity lerp ---
    const hoverTarget = isHovered ? 1 : 0;
    hoverIntensity += (hoverTarget - hoverIntensity) * 0.04;

    // --- RGB hue cycle ---
    const hue = (t / RGB_CYCLE_PERIOD) % 1;

    // RGB ambient PointLight: cycle color, intensity reacts to hover
    tmpColor.setHSL(hue, 0.8, 0.5);
    rgbLight.color.copy(tmpColor);
    rgbLight.intensity =
      RGB_LIGHT_BASE + (RGB_LIGHT_HOVER - RGB_LIGHT_BASE) * hoverIntensity;

    // GPU tower LED strip: cycle through RGB
    const stripHue = hue;
    tower.stripMat.color.setHSL(stripHue, 0.9, 0.5);
    tower.stripMat.emissive.setHSL(stripHue, 0.9, 0.45);
    tower.stripMat.emissiveIntensity =
      0.15 + 0.15 * hoverIntensity;

    // Screen glow: subtle hue shift (much slower, muted)
    const screenHue = ((t / 30) % 1); // full cycle over 30s
    tmpColor.setHSL(screenHue, 0.3, 0.35);
    screenGlow.color.copy(tmpColor);
    screenGlow.intensity =
      SCREEN_GLOW_BASE + 0.05 * hoverIntensity;

    // Code lines: very slow lateral drift (barely perceptible)
    for (let i = 0; i < allCodeLines.length; i++) {
      const line = allCodeLines[i];
      line.position.x += Math.sin(t * 0.3 + i * 1.7) * 0.00008;
    }

    // GPU LED pulse — slow, subtle, also cycle color
    for (let i = 0; i < tower.ledMats.length; i++) {
      const phase = t * 0.5 + i * 1.2;
      tower.ledMats[i].opacity = 0.45 + 0.25 * Math.sin(phase);
      // Cycle LED colors offset from the strip
      const ledHue = (hue + i * 0.15) % 1;
      tower.ledMats[i].color.setHSL(ledHue, 0.85, 0.55);
    }

    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      void container.offsetHeight;
      requestAnimationFrame(() => container.classList.add("loaded"));
    }
  }

  requestAnimationFrame(animate);

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  (container as any).__heroSceneCleanup = (): void => {
    running = false;
    ro.disconnect();
    window.removeEventListener("mousemove", onMouseMove);
    container.removeEventListener("mouseenter", onMouseEnter);
    container.removeEventListener("mouseleave", onMouseLeave);
    renderer.dispose();
    renderer.domElement.remove();
  };
}
