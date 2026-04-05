/**
 * hero-scene-c.ts — Isometric skill tree / learning path hero scene.
 * Renders an animated branching tree of learning nodes connected by
 * glowing paths, representing the ALL Applied AI Network curriculum.
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

// ---------------------------------------------------------------------------
// Node definitions
// ---------------------------------------------------------------------------

interface NodeDef {
  id: string;
  label: string;
  color: number;
  position: [number, number, number]; // x, y, z in world
  type: "book" | "code" | "ai" | "tools" | "rocket" | "data" | "deploy";
  connections: string[]; // ids this node connects TO
}

const NODES: NodeDef[] = [
  {
    id: "foundations",
    label: "Foundations",
    color: BLUE,
    position: [-3.5, 0, 1.5],
    type: "book",
    connections: ["code", "data"],
  },
  {
    id: "code",
    label: "Code",
    color: CYAN,
    position: [-1.0, 0, -0.5],
    type: "code",
    connections: ["ai"],
  },
  {
    id: "data",
    label: "Data",
    color: GREEN,
    position: [-1.0, 0, 3.0],
    type: "tools",
    connections: ["ai"],
  },
  {
    id: "ai",
    label: "AI / ML",
    color: PURPLE,
    position: [1.5, 0, 1.2],
    type: "ai",
    connections: ["deploy", "rocket"],
  },
  {
    id: "deploy",
    label: "Deploy",
    color: PINK,
    position: [4.0, 0, -0.3],
    type: "tools",
    connections: ["rocket"],
  },
  {
    id: "rocket",
    label: "Launch",
    color: AMBER,
    position: [4.0, 0, 2.8],
    type: "rocket",
    connections: [],
  },
];

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

// ---------------------------------------------------------------------------
// Icon builders — small shapes sitting atop each node platform
// ---------------------------------------------------------------------------

function buildBookIcon(color: number): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhongMaterial({ color: lighten(color, 40), flatShading: true });

  // Two angled planes forming an open book
  const pageGeo = new THREE.BoxGeometry(0.35, 0.28, 0.03);
  const left = new THREE.Mesh(pageGeo, mat);
  left.rotation.z = 0.25;
  left.position.set(-0.12, 0.14, 0);
  g.add(left);

  const right = new THREE.Mesh(pageGeo, mat);
  right.rotation.z = -0.25;
  right.position.set(0.12, 0.14, 0);
  g.add(right);

  // Spine
  const spineGeo = new THREE.BoxGeometry(0.03, 0.28, 0.06);
  const spine = new THREE.Mesh(spineGeo, new THREE.MeshPhongMaterial({ color: darken(color, 20), flatShading: true }));
  spine.position.set(0, 0.12, 0);
  g.add(spine);

  return g;
}

function buildCodeIcon(color: number): THREE.Group {
  const g = new THREE.Group();

  // Monitor body
  const bodyGeo = new THREE.BoxGeometry(0.45, 0.32, 0.08);
  const bodyMat = new THREE.MeshPhongMaterial({ color: darken(color, 30), flatShading: true });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.2;
  g.add(body);

  // Screen (emissive)
  const screenGeo = new THREE.PlaneGeometry(0.36, 0.22);
  const screenMat = new THREE.MeshPhongMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.5,
    flatShading: true,
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.2, 0.045);
  g.add(screen);

  // Stand
  const standGeo = new THREE.BoxGeometry(0.06, 0.08, 0.06);
  const standMat = new THREE.MeshPhongMaterial({ color: darken(color, 50), flatShading: true });
  const stand = new THREE.Mesh(standGeo, standMat);
  stand.position.y = 0.02;
  g.add(stand);

  return g;
}

function buildAIIcon(color: number): THREE.Group {
  const g = new THREE.Group();

  // Core sphere
  const sphereGeo = new THREE.SphereGeometry(0.18, 8, 6);
  const sphereMat = new THREE.MeshPhongMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.3,
    flatShading: true,
    transparent: true,
    opacity: 0.85,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.position.y = 0.22;
  g.add(sphere);

  // Wireframe overlay
  const wireGeo = new THREE.IcosahedronGeometry(0.24, 1);
  const wireMat = new THREE.MeshBasicMaterial({
    color: lighten(color, 60),
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  wire.position.y = 0.22;
  g.add(wire);

  return g;
}

function buildToolsIcon(color: number): THREE.Group {
  const g = new THREE.Group();

  // Gear (cylinder with notches approximated by octagonal shape)
  const gearGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.06, 8);
  const gearMat = new THREE.MeshPhongMaterial({ color: lighten(color, 20), flatShading: true });
  const gear = new THREE.Mesh(gearGeo, gearMat);
  gear.position.y = 0.18;
  g.add(gear);

  // Center hole
  const holeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8);
  const holeMat = new THREE.MeshPhongMaterial({ color: darken(color, 40), flatShading: true });
  const hole = new THREE.Mesh(holeGeo, holeMat);
  hole.position.y = 0.18;
  g.add(hole);

  // Wrench handle
  const handleGeo = new THREE.BoxGeometry(0.06, 0.04, 0.32);
  const handleMat = new THREE.MeshPhongMaterial({ color: darken(color, 20), flatShading: true });
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.set(0.12, 0.25, 0);
  handle.rotation.y = Math.PI / 4;
  handle.rotation.z = Math.PI / 6;
  g.add(handle);

  return g;
}

function buildRocketIcon(color: number): THREE.Group {
  const g = new THREE.Group();

  // Body cylinder
  const bodyGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.35, 6);
  const bodyMat = new THREE.MeshPhongMaterial({ color: lighten(color, 30), flatShading: true });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.28;
  g.add(body);

  // Nose cone
  const coneGeo = new THREE.ConeGeometry(0.08, 0.15, 6);
  const coneMat = new THREE.MeshPhongMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.3,
    flatShading: true,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.y = 0.53;
  g.add(cone);

  // Fins (three small boxes)
  const finGeo = new THREE.BoxGeometry(0.03, 0.12, 0.1);
  const finMat = new THREE.MeshPhongMaterial({ color: darken(color, 20), flatShading: true });
  for (let i = 0; i < 3; i++) {
    const fin = new THREE.Mesh(finGeo, finMat);
    const angle = (i / 3) * Math.PI * 2;
    fin.position.set(Math.cos(angle) * 0.1, 0.14, Math.sin(angle) * 0.1);
    fin.rotation.y = -angle;
    g.add(fin);
  }

  // Exhaust glow
  const exhaustGeo = new THREE.ConeGeometry(0.07, 0.12, 6);
  const exhaustMat = new THREE.MeshBasicMaterial({
    color: AMBER,
    transparent: true,
    opacity: 0.5,
  });
  const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
  exhaust.position.y = 0.05;
  exhaust.rotation.x = Math.PI; // point down
  g.add(exhaust);

  return g;
}

function buildIconForType(type: NodeDef["type"], color: number): THREE.Group {
  switch (type) {
    case "book":
      return buildBookIcon(color);
    case "code":
      return buildCodeIcon(color);
    case "ai":
      return buildAIIcon(color);
    case "tools":
    case "data":
      return buildToolsIcon(color);
    case "rocket":
    case "deploy":
      return buildRocketIcon(color);
  }
}

// ---------------------------------------------------------------------------
// Build a node platform + icon
// ---------------------------------------------------------------------------

interface NodeMesh {
  group: THREE.Group;
  platform: THREE.Mesh;
  glowDisc: THREE.Mesh;
  icon: THREE.Group;
  def: NodeDef;
  floatOffset: number;
}

function buildNode(def: NodeDef): NodeMesh {
  const group = new THREE.Group();
  const platformRadius = 0.55;
  const platformHeight = 0.15;

  // Hex platform
  const platGeo = new THREE.CylinderGeometry(platformRadius, platformRadius, platformHeight, 6, 1);
  const platMat = new THREE.MeshPhongMaterial({
    color: def.color,
    flatShading: true,
    transparent: true,
    opacity: 0.9,
  });
  const platform = new THREE.Mesh(platGeo, platMat);
  group.add(platform);

  // Glow disc under platform
  const glowGeo = new THREE.CircleGeometry(platformRadius * 1.4, 6);
  const glowMat = new THREE.MeshBasicMaterial({
    color: def.color,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
  });
  const glowDisc = new THREE.Mesh(glowGeo, glowMat);
  glowDisc.rotation.x = -Math.PI / 2;
  glowDisc.position.y = -platformHeight / 2 - 0.01;
  group.add(glowDisc);

  // Icon on top
  const icon = buildIconForType(def.type, def.color);
  icon.position.y = platformHeight / 2;
  group.add(icon);

  group.position.set(def.position[0], def.position[1], def.position[2]);

  return {
    group,
    platform,
    glowDisc,
    icon,
    def,
    floatOffset: Math.random() * Math.PI * 2,
  };
}

// ---------------------------------------------------------------------------
// Badge / achievement markers near some nodes
// ---------------------------------------------------------------------------

function buildStarBadge(color: number): THREE.Group {
  const g = new THREE.Group();

  // Simple star approximation: two overlapping triangles
  const triGeo = new THREE.ConeGeometry(0.12, 0.2, 3);
  const triMat = new THREE.MeshPhongMaterial({
    color: lighten(color, 50),
    emissive: color,
    emissiveIntensity: 0.2,
    flatShading: true,
    transparent: true,
    opacity: 0.85,
  });

  const top = new THREE.Mesh(triGeo, triMat);
  g.add(top);

  const bottom = new THREE.Mesh(triGeo, triMat);
  bottom.rotation.z = Math.PI;
  bottom.position.y = -0.03;
  g.add(bottom);

  return g;
}

function buildCheckBadge(color: number): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhongMaterial({
    color: lighten(color, 40),
    emissive: color,
    emissiveIntensity: 0.2,
    flatShading: true,
  });

  // Checkmark: two small elongated boxes at an angle
  const longGeo = new THREE.BoxGeometry(0.04, 0.18, 0.04);
  const long = new THREE.Mesh(longGeo, mat);
  long.rotation.z = -0.3;
  long.position.set(0.03, 0, 0);
  g.add(long);

  const shortGeo = new THREE.BoxGeometry(0.04, 0.1, 0.04);
  const short = new THREE.Mesh(shortGeo, mat);
  short.rotation.z = 0.6;
  short.position.set(-0.07, -0.04, 0);
  g.add(short);

  return g;
}

// ---------------------------------------------------------------------------
// Connection paths between nodes (curved lines with flowing particles)
// ---------------------------------------------------------------------------

interface ConnectionPath {
  line: THREE.Line;
  material: THREE.LineDashedMaterial;
  from: THREE.Vector3;
  to: THREE.Vector3;
  midpoint: THREE.Vector3;
  color: number;
}

function createConnectionPath(from: NodeDef, to: NodeDef): ConnectionPath {
  const fromV = new THREE.Vector3(...from.position);
  const toV = new THREE.Vector3(...to.position);

  // Raise start/end slightly above platform
  fromV.y += 0.1;
  toV.y += 0.1;

  // Create a subtle arc via midpoint
  const mid = new THREE.Vector3().lerpVectors(fromV, toV, 0.5);
  mid.y += 0.4;

  // Build curve
  const curve = new THREE.QuadraticBezierCurve3(fromV, mid, toV);
  const pts = curve.getPoints(24);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);

  const color = to.color;
  const mat = new THREE.LineDashedMaterial({
    color,
    transparent: true,
    opacity: 0.4,
    dashSize: 0.15,
    gapSize: 0.1,
  });

  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();

  return { line, material: mat, from: fromV, to: toV, midpoint: mid, color };
}

// ---------------------------------------------------------------------------
// Flowing particle dots along connection paths
// ---------------------------------------------------------------------------

interface PathParticleSystem {
  points: THREE.Points;
  curves: THREE.QuadraticBezierCurve3[];
  progress: Float32Array;
  speeds: Float32Array;
  curveIndices: Int32Array;
}

function createPathParticles(
  connections: ConnectionPath[],
  particlesPerPath: number
): PathParticleSystem {
  const total = connections.length * particlesPerPath;
  const positions = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);
  const progress = new Float32Array(total);
  const speeds = new Float32Array(total);
  const curveIndices = new Int32Array(total);
  const curves: THREE.QuadraticBezierCurve3[] = [];

  for (let c = 0; c < connections.length; c++) {
    const conn = connections[c];
    const curve = new THREE.QuadraticBezierCurve3(conn.from, conn.midpoint, conn.to);
    curves.push(curve);

    const col = new THREE.Color(conn.color);

    for (let p = 0; p < particlesPerPath; p++) {
      const idx = c * particlesPerPath + p;
      const t = Math.random();
      progress[idx] = t;
      speeds[idx] = 0.003 + Math.random() * 0.005;
      curveIndices[idx] = c;

      const pt = curve.getPoint(t);
      positions[idx * 3] = pt.x;
      positions[idx * 3 + 1] = pt.y;
      positions[idx * 3 + 2] = pt.z;

      colors[idx * 3] = col.r;
      colors[idx * 3 + 1] = col.g;
      colors[idx * 3 + 2] = col.b;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.07,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  return { points, curves, progress, speeds, curveIndices };
}

function updatePathParticles(ps: PathParticleSystem): void {
  const posAttr = ps.points.geometry.getAttribute("position") as THREE.BufferAttribute;
  const positions = posAttr.array as Float32Array;
  const tmpVec = new THREE.Vector3();

  for (let i = 0; i < ps.progress.length; i++) {
    ps.progress[i] += ps.speeds[i];
    if (ps.progress[i] > 1) ps.progress[i] -= 1;

    const curve = ps.curves[ps.curveIndices[i]];
    curve.getPoint(ps.progress[i], tmpVec);

    positions[i * 3] = tmpVec.x;
    positions[i * 3 + 1] = tmpVec.y;
    positions[i * 3 + 2] = tmpVec.z;
  }
  posAttr.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// Faint ground grid
// ---------------------------------------------------------------------------

function buildGroundGrid(): THREE.Group {
  const g = new THREE.Group();

  // Dot grid
  const dotCount = 400;
  const spread = 12;
  const positions = new Float32Array(dotCount * 3);
  for (let i = 0; i < dotCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = -0.15;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x6b7280,
    size: 0.03,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
  });

  g.add(new THREE.Points(geo, mat));

  // Faint grid lines
  const gridMat = new THREE.LineBasicMaterial({
    color: 0x4b5563,
    transparent: true,
    opacity: 0.06,
  });

  const gridSize = 10;
  const step = 1;
  for (let x = -gridSize / 2; x <= gridSize / 2; x += step) {
    const pts = [
      new THREE.Vector3(x, -0.14, -gridSize / 2),
      new THREE.Vector3(x, -0.14, gridSize / 2),
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    g.add(new THREE.Line(lineGeo, gridMat));
  }
  for (let z = -gridSize / 2; z <= gridSize / 2; z += step) {
    const pts = [
      new THREE.Vector3(-gridSize / 2, -0.14, z),
      new THREE.Vector3(gridSize / 2, -0.14, z),
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    g.add(new THREE.Line(lineGeo, gridMat));
  }

  return g;
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
  const frustumSize = 10;
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
  camera.lookAt(0, 0, 0);

  // --- Lighting ---
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // Subtle fill from below-left for depth
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.15);
  fillLight.position.set(-4, -2, -3);
  scene.add(fillLight);

  // --- Root group for parallax ---
  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  // --- Ground grid ---
  const ground = buildGroundGrid();
  rootGroup.add(ground);

  // --- Build nodes ---
  const nodeMap = new Map<string, NodeMesh>();
  const nodeMeshes: NodeMesh[] = [];

  for (const def of NODES) {
    const nm = buildNode(def);
    rootGroup.add(nm.group);
    nodeMap.set(def.id, nm);
    nodeMeshes.push(nm);
  }

  // --- Build connection paths ---
  const connections: ConnectionPath[] = [];
  for (const def of NODES) {
    for (const targetId of def.connections) {
      const targetDef = NODES.find((n) => n.id === targetId);
      if (targetDef) {
        const conn = createConnectionPath(def, targetDef);
        rootGroup.add(conn.line);
        connections.push(conn);
      }
    }
  }

  // --- Path particles ---
  const pathParticles = createPathParticles(connections, 5);
  rootGroup.add(pathParticles.points);

  // --- Badges near select nodes ---
  const badges: { mesh: THREE.Group; baseY: number; offset: number }[] = [];

  // Star badge near the rocket/launch node
  const rocketNode = nodeMap.get("rocket");
  if (rocketNode) {
    const star = buildStarBadge(AMBER);
    star.position.set(
      rocketNode.def.position[0] + 0.7,
      rocketNode.def.position[1] + 0.9,
      rocketNode.def.position[2] - 0.3
    );
    star.scale.setScalar(0.7);
    rootGroup.add(star);
    badges.push({ mesh: star, baseY: star.position.y, offset: Math.random() * Math.PI * 2 });
  }

  // Check badge near AI node
  const aiNode = nodeMap.get("ai");
  if (aiNode) {
    const check = buildCheckBadge(PURPLE);
    check.position.set(
      aiNode.def.position[0] - 0.75,
      aiNode.def.position[1] + 0.85,
      aiNode.def.position[2] + 0.3
    );
    check.scale.setScalar(0.65);
    rootGroup.add(check);
    badges.push({ mesh: check, baseY: check.position.y, offset: Math.random() * Math.PI * 2 });
  }

  // Star badge near foundations
  const foundNode = nodeMap.get("foundations");
  if (foundNode) {
    const star2 = buildStarBadge(BLUE);
    star2.position.set(
      foundNode.def.position[0] + 0.65,
      foundNode.def.position[1] + 0.8,
      foundNode.def.position[2] + 0.4
    );
    star2.scale.setScalar(0.55);
    rootGroup.add(star2);
    badges.push({ mesh: star2, baseY: star2.position.y, offset: Math.random() * Math.PI * 2 });
  }

  // --- Unlock wave state ---
  // Nodes activate in order: foundations -> code -> data -> ai -> deploy -> rocket
  const activationOrder = ["foundations", "code", "data", "ai", "deploy", "rocket"];
  const WAVE_CYCLE_DURATION = 6.0; // seconds for full cycle
  const NODE_ACTIVATE_DURATION = 1.2; // how long each node stays "active"

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

    // Mouse parallax (smooth lerp)
    targetParallaxX = mouseX * 0.1;
    targetParallaxY = mouseY * 0.05;
    currentParallaxX += (targetParallaxX - currentParallaxX) * 0.03;
    currentParallaxY += (targetParallaxY - currentParallaxY) * 0.03;

    rootGroup.rotation.y = currentParallaxX;
    rootGroup.rotation.x = currentParallaxY;

    // Hover brightness
    targetBrightness = isHovering ? 0.75 : 0.6;
    currentBrightness += (targetBrightness - currentBrightness) * 0.05;
    ambient.intensity = currentBrightness;

    // --- Float nodes gently ---
    for (const nm of nodeMeshes) {
      const baseY = nm.def.position[1];
      nm.group.position.y = baseY + Math.sin(time * 0.7 + nm.floatOffset) * 0.08;
    }

    // --- Unlock wave animation ---
    // Wave position cycles through nodes over time
    const waveT = (time % WAVE_CYCLE_DURATION) / WAVE_CYCLE_DURATION; // 0..1
    const wavePos = waveT * activationOrder.length; // 0..numNodes

    for (let i = 0; i < activationOrder.length; i++) {
      const nm = nodeMap.get(activationOrder[i]);
      if (!nm) continue;

      // Each node activates when the wave reaches it
      const nodePhase = wavePos - i;
      const activeFrac = Math.max(0, Math.min(1, nodePhase / (NODE_ACTIVATE_DURATION / (WAVE_CYCLE_DURATION / activationOrder.length))));
      // Fade back out after peak
      const fadeOut = nodePhase > 1.5 ? Math.max(0, 1 - (nodePhase - 1.5)) : 1;
      const intensity = activeFrac * fadeOut;

      // Pulse platform opacity
      const platMat = nm.platform.material as THREE.MeshPhongMaterial;
      platMat.opacity = 0.75 + intensity * 0.25;
      platMat.emissive = new THREE.Color(nm.def.color);
      platMat.emissiveIntensity = intensity * 0.35;

      // Pulse glow disc
      const glowMat = nm.glowDisc.material as THREE.MeshBasicMaterial;
      glowMat.opacity = 0.06 + intensity * 0.15;

      // Subtle scale bounce on activation
      const scaleBoost = 1.0 + intensity * 0.08;
      nm.icon.scale.setScalar(scaleBoost);
    }

    // --- Pulse connection path opacity ---
    for (let i = 0; i < connections.length; i++) {
      const pulse = 0.3 + Math.sin(time * 1.2 + i * 1.5) * 0.15;
      connections[i].material.opacity = pulse;
    }

    // --- Animate path particles ---
    updatePathParticles(pathParticles);

    // --- Float badges ---
    for (const badge of badges) {
      badge.mesh.position.y = badge.baseY + Math.sin(time * 1.0 + badge.offset) * 0.06;
      badge.mesh.rotation.y = time * 0.4 + badge.offset;
    }

    // --- Slowly rotate wireframe on AI node ---
    const aiNm = nodeMap.get("ai");
    if (aiNm && aiNm.icon.children.length > 1) {
      aiNm.icon.children[1].rotation.y = time * 0.3;
      aiNm.icon.children[1].rotation.x = time * 0.2;
    }

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
