/**
 * hero-scene-node-graph.ts — Interactive 3D node graph hero scene.
 * Dense network of glowing spheres with bright pulsing connections,
 * RGB energy flow, mouse proximity reactions, and flowing particles.
 */

import * as THREE from "three";

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const CYAN = 0x22d3ee;
const BLUE = 0x3b82f6;
const PINK = 0xec4899;
const PURPLE = 0xa855f7;
const GREEN = 0x10b981;
const AMBER = 0xf59e0b;

const LAYER_PALETTES: number[][] = [
  [BLUE, CYAN, GREEN],
  [CYAN, BLUE, GREEN, AMBER],
  [PURPLE, PINK, BLUE],
  [PINK, PURPLE, AMBER],
  [AMBER, PINK, CYAN],
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GraphNode {
  position: THREE.Vector3;
  color: THREE.Color;
  colorHex: number;
  radius: number;
  mesh: THREE.Mesh;
  haloMat: THREE.MeshBasicMaterial;
  layer: number;
  currentScale: number;
  emissiveBase: number;
  emissiveTarget: number;
  emissiveCurrent: number;
  phase: number;
  connections: number[];
}

interface GraphEdge {
  from: number;
  to: number;
  line: THREE.Line;
  material: THREE.LineBasicMaterial;
  baseOpacity: number;
  currentOpacity: number;
  targetOpacity: number;
  phase: number;
}

interface Particle {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  x: number;
  z: number;
  y: number;
  speed: number;
  baseOpacity: number;
  phase: number;
}

// ---------------------------------------------------------------------------
// Seeded PRNG
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed;
  return (): number => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------------------
// Scene init
// ---------------------------------------------------------------------------

export function initHeroScene(container: HTMLElement): void {
  const rand = seededRandom(42);

  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // --- Camera (isometric) ---
  const frustum = 2.8;
  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.OrthographicCamera(
    -frustum * aspect, frustum * aspect, frustum, -frustum, 0.1, 50
  );

  const isoAngle = Math.atan(1 / Math.sqrt(2));
  const dist = 12;
  const baseCamX = dist * Math.cos(isoAngle) * Math.sin(Math.PI / 4);
  const baseCamY = dist * Math.sin(isoAngle);
  const baseCamZ = dist * Math.cos(isoAngle) * Math.cos(Math.PI / 4);
  camera.position.set(baseCamX, baseCamY, baseCamZ);

  const lookAt = new THREE.Vector3(0, 1.8, 0);
  camera.lookAt(lookAt);

  // --- Lighting ---
  scene.add(new THREE.HemisphereLight(0x4466aa, 0x1a1a2e, 0.35));

  const dir = new THREE.DirectionalLight(0xffffff, 0.3);
  dir.position.set(-3, 8, 5);
  scene.add(dir);

  // RGB cycling light at the core
  const rgbLight = new THREE.PointLight(0xff0000, 0.35, 10);
  rgbLight.position.set(0, 2.2, 0);
  scene.add(rgbLight);

  // Secondary accent lights
  const accentLight1 = new THREE.PointLight(CYAN, 0.2, 6);
  accentLight1.position.set(-1.5, 0.5, 1);
  scene.add(accentLight1);

  const accentLight2 = new THREE.PointLight(PINK, 0.15, 6);
  accentLight2.position.set(1.5, 3.5, -0.5);
  scene.add(accentLight2);

  // --- Root group ---
  const root = new THREE.Group();
  root.position.set(0.4, 0, 0);
  scene.add(root);

  // =========================================================================
  // Generate graph — DENSE, TIGHT, CONCENTRATED
  // =========================================================================

  const layerSpecs = [
    { count: 8,  y: 0.0,  r: 0.13, spread: 1.3 },
    { count: 9,  y: 0.9,  r: 0.11, spread: 1.2 },
    { count: 8,  y: 1.75, r: 0.10, spread: 1.1 },
    { count: 7,  y: 2.5,  r: 0.09, spread: 0.9 },
    { count: 5,  y: 3.2,  r: 0.08, spread: 0.7 },
    { count: 3,  y: 3.8,  r: 0.11, spread: 0.4 },
  ];

  const positions: THREE.Vector3[] = [];
  const layerIds: number[] = [];
  const colorHexes: number[] = [];
  const nodeRadii: number[] = [];

  for (let li = 0; li < layerSpecs.length; li++) {
    const spec = layerSpecs[li];
    const palette = LAYER_PALETTES[Math.min(li, LAYER_PALETTES.length - 1)];
    for (let ni = 0; ni < spec.count; ni++) {
      const angle = (ni / spec.count) * Math.PI * 2 + (rand() - 0.5) * 0.8;
      const d = 0.35 + rand() * 0.65;
      const x = Math.cos(angle) * spec.spread * d;
      const z = Math.sin(angle) * spec.spread * d * 0.7;
      const y = spec.y + (rand() - 0.5) * 0.25;
      positions.push(new THREE.Vector3(x, y, z));
      layerIds.push(li);
      const ci = rand() < 0.5 ? 0 : Math.floor(rand() * palette.length);
      colorHexes.push(palette[ci]);
      nodeRadii.push(spec.r);
    }
  }

  const nodeCount = positions.length;

  // --- Edges: connect densely ---
  const edgeDefs: { from: number; to: number }[] = [];
  const edgeSet = new Set<string>();
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

  const layerNodes: number[][] = layerSpecs.map(() => []);
  for (let i = 0; i < nodeCount; i++) layerNodes[layerIds[i]].push(i);

  // Cross-layer connections (each node → 2-4 nodes in layer above)
  for (let li = 0; li < layerSpecs.length - 1; li++) {
    const cur = layerNodes[li];
    const above = layerNodes[li + 1];
    if (!above.length) continue;

    for (const ni of cur) {
      const sorted = [...above].sort(
        (a, b) => positions[ni].distanceTo(positions[a]) - positions[ni].distanceTo(positions[b])
      );
      const count = 2 + Math.floor(rand() * 2.5);
      for (let c = 0; c < Math.min(count, sorted.length); c++) {
        const k = key(ni, sorted[c]);
        if (!edgeSet.has(k)) { edgeSet.add(k); edgeDefs.push({ from: ni, to: sorted[c] }); }
      }
    }

    // Ensure all above nodes have connections
    for (const ai of above) {
      if (!edgeDefs.some(e => e.from === ai || e.to === ai)) {
        const closest = cur.reduce((best, idx) =>
          positions[ai].distanceTo(positions[idx]) < positions[ai].distanceTo(positions[best]) ? idx : best, cur[0]);
        const k = key(ai, closest);
        if (!edgeSet.has(k)) { edgeSet.add(k); edgeDefs.push({ from: closest, to: ai }); }
      }
    }
  }

  // Intra-layer connections for density
  for (const lnodes of layerNodes) {
    if (lnodes.length < 3) continue;
    const crossCount = Math.floor(lnodes.length * 0.5);
    for (let c = 0; c < crossCount; c++) {
      const a = lnodes[Math.floor(rand() * lnodes.length)];
      let bestD = Infinity, bestI = a;
      for (const b of lnodes) {
        if (b === a) continue;
        const d = positions[a].distanceTo(positions[b]);
        if (d < bestD && !edgeSet.has(key(a, b))) { bestD = d; bestI = b; }
      }
      if (bestI !== a) {
        const k = key(a, bestI);
        edgeSet.add(k);
        edgeDefs.push({ from: a, to: bestI });
      }
    }
  }

  // Build adjacency
  const neighbors: number[][] = Array.from({ length: nodeCount }, () => []);
  for (const { from, to } of edgeDefs) {
    neighbors[from].push(to);
    neighbors[to].push(from);
  }

  // =========================================================================
  // Build meshes — BRIGHT, GLOWING, VISIBLE
  // =========================================================================

  const nodes: GraphNode[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const r = nodeRadii[i];
    const hex = colorHexes[i];
    const color = new THREE.Color(hex);

    const geo = new THREE.SphereGeometry(r, 20, 14);
    const mat = new THREE.MeshStandardMaterial({
      color: hex,
      emissive: hex,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.15,
      transparent: true,
      opacity: 0.95,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(positions[i]);
    root.add(mesh);

    // BRIGHT halo — much bigger, more visible
    const haloGeo = new THREE.SphereGeometry(r * 2.8, 12, 8);
    const haloMat = new THREE.MeshBasicMaterial({
      color: hex,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    mesh.add(halo);

    nodes.push({
      position: positions[i],
      color, colorHex: hex, radius: r,
      mesh, haloMat, layer: layerIds[i],
      currentScale: 1.0,
      emissiveBase: 0.5,
      emissiveTarget: 0.5,
      emissiveCurrent: 0.5,
      phase: rand() * Math.PI * 2,
      connections: [],
    });
  }

  // --- Build edges — THICK, BRIGHT lines ---
  const edges: GraphEdge[] = [];

  for (let ei = 0; ei < edgeDefs.length; ei++) {
    const { from, to } = edgeDefs[ei];
    const geo = new THREE.BufferGeometry().setFromPoints([positions[from], positions[to]]);

    const c1 = new THREE.Color(colorHexes[from]);
    const c2 = new THREE.Color(colorHexes[to]);
    const blended = c1.clone().lerp(c2, 0.5);

    const mat = new THREE.LineBasicMaterial({
      color: blended,
      transparent: true,
      opacity: 0.35,
      linewidth: 1,
    });
    const line = new THREE.Line(geo, mat);
    root.add(line);

    edges.push({
      from, to, line, material: mat,
      baseOpacity: 0.35,
      currentOpacity: 0.35,
      targetOpacity: 0.35,
      phase: rand() * Math.PI * 2,
    });

    nodes[from].connections.push(ei);
    nodes[to].connections.push(ei);
  }

  // --- Core glow sphere at the center of the graph ---
  const coreGeo = new THREE.SphereGeometry(0.25, 24, 18);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.set(0, 2.0, 0);
  root.add(core);

  const coreHaloGeo = new THREE.SphereGeometry(0.8, 16, 12);
  const coreHaloMat = new THREE.MeshBasicMaterial({
    color: PURPLE,
    transparent: true,
    opacity: 0.04,
    depthWrite: false,
  });
  const coreHalo = new THREE.Mesh(coreHaloGeo, coreHaloMat);
  core.add(coreHalo);

  // --- Particles — lightweight for performance ---
  const PARTICLE_COUNT = 35;
  const particles: Particle[] = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const pr = 0.015 + rand() * 0.025;
    const geo = new THREE.SphereGeometry(pr, 6, 4);
    const baseOp = 0.1 + rand() * 0.3;
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: baseOp,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);

    const x = (rand() - 0.5) * 3.5;
    const z = (rand() - 0.5) * 2.5;
    const y = rand() * 5 - 0.5;
    mesh.position.set(x, y, z);
    root.add(mesh);

    particles.push({
      mesh, mat, x, z, y,
      speed: 0.004 + rand() * 0.012,
      baseOpacity: baseOp,
      phase: rand() * Math.PI * 2,
    });
  }

  // =========================================================================
  // Mouse state
  // =========================================================================

  let mouseX = 0, mouseY = 0;
  let smoothOffX = 0, smoothOffY = 0;
  let isHovered = false;
  let hoverIntensity = 0;
  let mouseContainerX = 0, mouseContainerY = 0;

  const PARALLAX_X = 0.5;
  const PARALLAX_Y = 0.3;
  container.style.cursor = "default";

  function onMouseMove(e: MouseEvent): void {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    const rect = container.getBoundingClientRect();
    mouseContainerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseContainerY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  }
  function onMouseEnter(): void { isHovered = true; }
  function onMouseLeave(): void { isHovered = false; }

  window.addEventListener("mousemove", onMouseMove);
  container.addEventListener("mouseenter", onMouseEnter);
  container.addEventListener("mouseleave", onMouseLeave);

  // =========================================================================
  // Resize
  // =========================================================================

  function resize(): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
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

  // =========================================================================
  // Animation
  // =========================================================================

  let running = true;
  let firstFrame = true;
  const _proj = new THREE.Vector3();
  const tmpC = new THREE.Color();

  function animate(): void {
    if (!running) return;
    requestAnimationFrame(animate);
    const t = performance.now() * 0.001;

    // --- Parallax ---
    smoothOffX += (mouseX * PARALLAX_X - smoothOffX) * 0.05;
    smoothOffY += (-mouseY * PARALLAX_Y - smoothOffY) * 0.05;
    camera.position.set(baseCamX + smoothOffX, baseCamY + smoothOffY, baseCamZ);
    camera.lookAt(lookAt);

    // --- Hover ---
    hoverIntensity += ((isHovered ? 1 : 0) - hoverIntensity) * 0.05;

    // --- RGB core light ---
    const hue = (t / 16) % 1;
    tmpC.setHSL(hue, 0.8, 0.5);
    rgbLight.color.copy(tmpC);
    rgbLight.intensity = 0.35 + 0.2 * hoverIntensity;

    // Core glow pulses
    coreMat.opacity = 0.06 + 0.04 * Math.sin(t * 1.5) + 0.03 * hoverIntensity;
    coreHaloMat.opacity = 0.03 + 0.02 * Math.sin(t * 0.8);
    tmpC.setHSL((hue + 0.5) % 1, 0.6, 0.5);
    coreHaloMat.color.copy(tmpC);

    // Accent lights cycle
    tmpC.setHSL((hue + 0.33) % 1, 0.7, 0.5);
    accentLight1.color.copy(tmpC);
    tmpC.setHSL((hue + 0.66) % 1, 0.7, 0.5);
    accentLight2.color.copy(tmpC);

    // --- Reset targets ---
    for (const n of nodes) n.emissiveTarget = n.emissiveBase;
    for (const e of edges) e.targetOpacity = e.baseOpacity;

    // --- Mouse proximity ---
    if (isHovered) {
      for (let i = 0; i < nodeCount; i++) {
        _proj.copy(nodes[i].position);
        _proj.x += root.position.x;
        _proj.y += root.position.y;
        _proj.z += root.position.z;
        _proj.project(camera);

        const dx = _proj.x - mouseContainerX;
        const dy = _proj.y - mouseContainerY;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < 0.7) {
          const falloff = 1 - d / 0.7;
          const intensity = falloff * falloff;
          boostNode(i, intensity);

          // Ripple to neighbors
          if (d < 0.2) {
            for (const ni of neighbors[i]) {
              boostNode(ni, intensity * 0.5);
              for (const ni2 of neighbors[ni]) {
                if (ni2 !== i) boostNode(ni2, intensity * 0.2);
              }
            }
          }
        }
      }
    }

    function boostNode(idx: number, intensity: number): void {
      const n = nodes[idx];
      const boost = n.emissiveBase + intensity * 1.0;
      if (boost > n.emissiveTarget) n.emissiveTarget = boost;
      for (const ei of n.connections) {
        const eb = edges[ei].baseOpacity + intensity * 0.55;
        if (eb > edges[ei].targetOpacity) edges[ei].targetOpacity = eb;
      }
    }

    // --- Update nodes ---
    for (let i = 0; i < nodeCount; i++) {
      const n = nodes[i];

      n.emissiveCurrent += (n.emissiveTarget - n.emissiveCurrent) * 0.1;
      const pulse = Math.sin(t * 1.5 + n.phase) * 0.08;
      const mat = n.mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = n.emissiveCurrent + pulse;

      // Scale up when activated
      const targetS = 1.0 + (n.emissiveCurrent - n.emissiveBase) * 1.0;
      const clamped = Math.min(Math.max(targetS, 1.0), 1.5);
      n.currentScale += (clamped - n.currentScale) * 0.12;
      n.mesh.scale.setScalar(n.currentScale);

      // Halo brightens with node
      n.haloMat.opacity = 0.1 + (n.emissiveCurrent - n.emissiveBase) * 0.3 + pulse * 0.05;

      // Float
      n.mesh.position.y = n.position.y + Math.sin(t * 0.8 + n.phase * 0.5) * 0.04;
    }

    // --- Update edges ---
    for (const e of edges) {
      e.currentOpacity += (e.targetOpacity - e.currentOpacity) * 0.1;

      // Energy pulse
      const pulse = Math.sin(t * 2.0 + e.phase) * 0.08;
      e.material.opacity = Math.min(e.currentOpacity + pulse, 0.85);

      // RGB color shift
      const edgeHue = (t / 18 + e.phase * 0.04) % 1;
      tmpC.setHSL(edgeHue, 0.65, 0.55);
      const base = new THREE.Color(nodes[e.from].colorHex).lerp(
        new THREE.Color(nodes[e.to].colorHex), 0.5
      );
      const mix = 0.2 + (e.currentOpacity - e.baseOpacity) * 1.5;
      base.lerp(tmpC, Math.min(mix, 0.7));
      e.material.color.copy(base);
    }

    // --- Update particles (simple drift, no per-node proximity check) ---
    for (const p of particles) {
      p.y += p.speed;
      p.x += Math.sin(t * 0.5 + p.phase) * 0.001;

      if (p.y > 4.5) {
        p.y = -0.5;
        p.x = (rand() - 0.5) * 3.5;
        p.z = (rand() - 0.5) * 2.5;
      }
      p.mesh.position.set(p.x, p.y, p.z);

      // Gentle pulse instead of expensive per-node distance check
      p.mat.opacity = p.baseOpacity + Math.sin(t * 1.2 + p.phase) * 0.08;
    }

    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      void container.offsetHeight;
      requestAnimationFrame(() => container.classList.add("loaded"));
    }
  }

  requestAnimationFrame(animate);

  // =========================================================================
  // Cleanup
  // =========================================================================

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
