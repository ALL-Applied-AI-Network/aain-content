/**
 * hero-scene.ts — Interactive Three.js isometric hero scene.
 * Renders a network of floating island "hubs" connected by glowing beams,
 * representing the ALL Applied AI Network.
 */

import * as THREE from "three";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BRAND_BLUE = 0x4f8fea;

interface HubConfig {
  color: number;
  position: [number, number, number]; // x, y, z on the ground plane
  scale: number; // relative to base platform size
  buildings: { dx: number; dz: number; height: number }[];
}

const CENTRAL_HUB: HubConfig = {
  color: BRAND_BLUE,
  position: [0, 0, 0],
  scale: 1.4,
  buildings: [
    { dx: -0.3, dz: -0.2, height: 1.2 },
    { dx: 0.3, dz: 0.1, height: 0.8 },
    { dx: 0.0, dz: 0.35, height: 0.55 },
  ],
};

const SATELLITE_HUBS: HubConfig[] = [
  {
    color: 0x3b82f6,
    position: [3.2, 0.3, -1.0],
    scale: 0.7,
    buildings: [
      { dx: -0.15, dz: 0, height: 0.7 },
      { dx: 0.2, dz: 0.15, height: 0.45 },
    ],
  },
  {
    color: 0x22d3ee,
    position: [2.0, -0.2, 2.8],
    scale: 0.65,
    buildings: [
      { dx: 0, dz: -0.1, height: 0.6 },
      { dx: 0.2, dz: 0.1, height: 0.4 },
    ],
  },
  {
    color: 0xec4899,
    position: [-1.5, 0.5, 3.0],
    scale: 0.6,
    buildings: [
      { dx: 0, dz: 0, height: 0.55 },
      { dx: -0.15, dz: 0.15, height: 0.35 },
    ],
  },
  {
    color: 0xa855f7,
    position: [-3.5, 0.1, 0.5],
    scale: 0.7,
    buildings: [
      { dx: 0.1, dz: -0.1, height: 0.65 },
      { dx: -0.15, dz: 0.15, height: 0.5 },
    ],
  },
  {
    color: 0x10b981,
    position: [-2.5, -0.3, -2.5],
    scale: 0.6,
    buildings: [
      { dx: 0, dz: 0.05, height: 0.5 },
      { dx: 0.18, dz: -0.12, height: 0.35 },
    ],
  },
  {
    color: 0xf59e0b,
    position: [1.5, 0.4, -3.0],
    scale: 0.55,
    buildings: [
      { dx: -0.1, dz: 0, height: 0.45 },
      { dx: 0.12, dz: 0.1, height: 0.3 },
    ],
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
// Create hex platform geometry (flat hexagonal prism)
// ---------------------------------------------------------------------------

function createHexPlatform(
  color: number,
  radius: number,
  height: number
): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radius, radius, height, 6, 1);
  const mat = new THREE.MeshPhongMaterial({
    color,
    flatShading: true,
    transparent: true,
    opacity: 0.92,
  });
  const mesh = new THREE.Mesh(geo, mat);
  return mesh;
}

// ---------------------------------------------------------------------------
// Build a single hub (platform + buildings)
// ---------------------------------------------------------------------------

function buildHub(config: HubConfig): THREE.Group {
  const group = new THREE.Group();
  const baseRadius = 1.0 * config.scale;
  const platformHeight = 0.2 * config.scale;

  // Platform
  const platform = createHexPlatform(config.color, baseRadius, platformHeight);
  group.add(platform);

  // Subtle glow disc under platform
  const glowGeo = new THREE.CircleGeometry(baseRadius * 1.3, 6);
  const glowMat = new THREE.MeshBasicMaterial({
    color: config.color,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -platformHeight / 2 - 0.01;
  group.add(glow);

  // Buildings
  for (const b of config.buildings) {
    const bHeight = b.height * config.scale;
    const bWidth = 0.25 * config.scale;
    const geo = new THREE.BoxGeometry(bWidth, bHeight, bWidth);
    const buildingColor =
      Math.random() > 0.5
        ? lighten(config.color, 30)
        : darken(config.color, 20);
    const mat = new THREE.MeshPhongMaterial({
      color: buildingColor,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      b.dx * config.scale,
      platformHeight / 2 + bHeight / 2,
      b.dz * config.scale
    );
    group.add(mesh);
  }

  group.position.set(
    config.position[0],
    config.position[1],
    config.position[2]
  );

  return group;
}

// ---------------------------------------------------------------------------
// Connection beams
// ---------------------------------------------------------------------------

interface BeamData {
  line: THREE.Line;
  baseMat: THREE.LineBasicMaterial;
}

function createBeam(
  from: THREE.Vector3,
  to: THREE.Vector3,
  color: number
): BeamData {
  const points = [from, to];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35,
  });
  const line = new THREE.Line(geo, mat);
  return { line, baseMat: mat };
}

// ---------------------------------------------------------------------------
// Particle system along beams
// ---------------------------------------------------------------------------

interface ParticleSystem {
  points: THREE.Points;
  velocities: Float32Array;
  targets: Float32Array;
  origins: Float32Array;
  progress: Float32Array;
  speeds: Float32Array;
}

function createBeamParticles(
  centralPos: THREE.Vector3,
  hubPositions: THREE.Vector3[],
  particlesPerBeam: number
): ParticleSystem {
  const totalParticles = hubPositions.length * particlesPerBeam;
  const positions = new Float32Array(totalParticles * 3);
  const origins = new Float32Array(totalParticles * 3);
  const targets = new Float32Array(totalParticles * 3);
  const progress = new Float32Array(totalParticles);
  const speeds = new Float32Array(totalParticles);
  const colors = new Float32Array(totalParticles * 3);

  let idx = 0;
  for (let h = 0; h < hubPositions.length; h++) {
    const hub = hubPositions[h];
    const hubColor = new THREE.Color(SATELLITE_HUBS[h].color);
    for (let p = 0; p < particlesPerBeam; p++) {
      const t = Math.random();
      progress[idx] = t;
      speeds[idx] = 0.002 + Math.random() * 0.004;

      // Determine direction: half go center->hub, half hub->center
      const goingOut = p % 2 === 0;
      const o = goingOut ? centralPos : hub;
      const d = goingOut ? hub : centralPos;

      origins[idx * 3] = o.x;
      origins[idx * 3 + 1] = o.y;
      origins[idx * 3 + 2] = o.z;
      targets[idx * 3] = d.x;
      targets[idx * 3 + 1] = d.y;
      targets[idx * 3 + 2] = d.z;

      // Interpolate initial position
      positions[idx * 3] = o.x + (d.x - o.x) * t;
      positions[idx * 3 + 1] = o.y + (d.y - o.y) * t + Math.sin(t * Math.PI) * 0.3;
      positions[idx * 3 + 2] = o.z + (d.z - o.z) * t;

      colors[idx * 3] = hubColor.r;
      colors[idx * 3 + 1] = hubColor.g;
      colors[idx * 3 + 2] = hubColor.b;

      idx++;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  return { points, velocities: new Float32Array(0), targets, origins, progress, speeds };
}

function updateParticles(ps: ParticleSystem): void {
  const posAttr = ps.points.geometry.getAttribute("position") as THREE.BufferAttribute;
  const positions = posAttr.array as Float32Array;

  for (let i = 0; i < ps.progress.length; i++) {
    ps.progress[i] += ps.speeds[i];
    if (ps.progress[i] > 1) ps.progress[i] -= 1;

    const t = ps.progress[i];
    const ox = ps.origins[i * 3];
    const oy = ps.origins[i * 3 + 1];
    const oz = ps.origins[i * 3 + 2];
    const tx = ps.targets[i * 3];
    const ty = ps.targets[i * 3 + 1];
    const tz = ps.targets[i * 3 + 2];

    positions[i * 3] = ox + (tx - ox) * t;
    positions[i * 3 + 1] = oy + (ty - oy) * t + Math.sin(t * Math.PI) * 0.3;
    positions[i * 3 + 2] = oz + (tz - oz) * t;
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

  // True isometric: rotate Y by 45 deg, then tilt down by arctan(sin(45deg)) ~ 35.264 deg
  const isoAngle = Math.atan(Math.sin(Math.PI / 4)); // ~0.6155 rad = ~35.264 deg
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

  // --- Hub groups ---
  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const centralGroup = buildHub(CENTRAL_HUB);
  rootGroup.add(centralGroup);

  const hubGroups: THREE.Group[] = [];
  for (const hub of SATELLITE_HUBS) {
    const g = buildHub(hub);
    rootGroup.add(g);
    hubGroups.push(g);
  }

  // --- Connection beams ---
  const centralPos = new THREE.Vector3(...CENTRAL_HUB.position);
  const beams: BeamData[] = [];
  const hubPositions: THREE.Vector3[] = [];

  for (let i = 0; i < SATELLITE_HUBS.length; i++) {
    const hp = new THREE.Vector3(...SATELLITE_HUBS[i].position);
    hubPositions.push(hp);
    const beam = createBeam(centralPos, hp, SATELLITE_HUBS[i].color);
    rootGroup.add(beam.line);
    beams.push(beam);
  }

  // --- Particles ---
  const particleSys = createBeamParticles(centralPos, hubPositions, 8);
  rootGroup.add(particleSys.points);

  // --- Floating animation data ---
  const hubFloatOffsets = SATELLITE_HUBS.map(() => Math.random() * Math.PI * 2);
  const centralFloatOffset = Math.random() * Math.PI * 2;

  // --- Mouse tracking ---
  let mouseX = 0;
  let mouseY = 0;
  let isHovering = false;

  function onMouseMove(e: MouseEvent): void {
    const rect = container.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }

  function onMouseEnter(): void {
    isHovering = true;
  }

  function onMouseLeave(): void {
    isHovering = false;
  }

  // Listen on the parent container rather than the canvas (pointer-events:none)
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
  let baseRotation = 0;
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

    // Idle auto-rotation
    baseRotation += 0.001;

    // Mouse parallax (smooth lerp)
    targetParallaxX = mouseX * 0.12;
    targetParallaxY = mouseY * 0.06;
    currentParallaxX += (targetParallaxX - currentParallaxX) * 0.03;
    currentParallaxY += (targetParallaxY - currentParallaxY) * 0.03;

    rootGroup.rotation.y = baseRotation + currentParallaxX;
    rootGroup.rotation.x = currentParallaxY;

    // Hover brightness
    targetBrightness = isHovering ? 0.75 : 0.6;
    currentBrightness += (targetBrightness - currentBrightness) * 0.05;
    ambient.intensity = currentBrightness;

    // Float hubs gently
    centralGroup.position.y =
      CENTRAL_HUB.position[1] + Math.sin(time * 0.8 + centralFloatOffset) * 0.08;

    for (let i = 0; i < hubGroups.length; i++) {
      const baseY = SATELLITE_HUBS[i].position[1];
      hubGroups[i].position.y =
        baseY + Math.sin(time * 0.6 + hubFloatOffsets[i]) * 0.12;
    }

    // Pulse beam opacity
    for (let i = 0; i < beams.length; i++) {
      const pulse = 0.25 + Math.sin(time * 1.5 + i * 1.2) * 0.12;
      beams[i].baseMat.opacity = pulse;
    }

    // Update particles
    updateParticles(particleSys);

    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      // Force reflow so the browser registers opacity:0 before transitioning
      void container.offsetHeight;
      requestAnimationFrame(() => container.classList.add("loaded"));
    }
  }

  animate();

  // --- Cleanup on page navigation (if ever needed) ---
  (container as any).__heroSceneCleanup = () => {
    resizeObserver.disconnect();
    parentEl.removeEventListener("mousemove", onMouseMove);
    parentEl.removeEventListener("mouseenter", onMouseEnter);
    parentEl.removeEventListener("mouseleave", onMouseLeave);
    renderer.dispose();
  };
}
