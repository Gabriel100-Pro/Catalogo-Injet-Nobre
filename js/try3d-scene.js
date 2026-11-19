/* ==========================================================================
   INJET NOBRE – CENA 3D ("Experimente em 3D")
   Módulo ES carregado sob demanda por js/try3d.js (import dinâmico).
   Three.js r160 vem do mapa de imports do index.html ("three").

   Baseado no protótipo prototipos/estojo-3d-prototipo.html (fora do git), com melhorias:
   - Reflexos de estúdio (RoomEnvironment) e acrílico com reflexo de Fresnel
     (camada aditiva) + tom leve, sem passe extra de transmissão.
   - Almofada como "travesseiro" (superelipsoide) com veludo (sheen) e
     textura de fibras; espuma com poros.
   - Sombra de contato suave sempre; sombra projetada só no computador.
   - Qualidade adaptativa: reduz a resolução se os quadros ficarem lentos e
     só desenha enquanto a seção está visível.
   ========================================================================== */

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

/* ---------- Texturas geradas em canvas (sem downloads) ---------- */
function canvasTex(size, draw, repeat) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}

// Papel fosco: ruído fino e suave
const paperTex = () => canvasTex(256, (x, s) => {
  const d = x.createImageData(s, s);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 40;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
}, 5);

// Veludo: fibras curtas em várias direções sobre ruído
const fabricTex = () => canvasTex(256, (x, s) => {
  x.fillStyle = "#808080";
  x.fillRect(0, 0, s, s);
  for (let i = 0; i < 5200; i++) {
    const px = Math.random() * s, py = Math.random() * s;
    const a = Math.random() * Math.PI, l = 1 + Math.random() * 3;
    const v = Math.round(90 + Math.random() * 90);
    x.strokeStyle = `rgba(${v},${v},${v},.7)`;
    x.lineWidth = 0.8;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l);
    x.stroke();
  }
}, 3);

// Espuma: poros pequenos e escuros
const foamTex = () => canvasTex(256, (x, s) => {
  x.fillStyle = "#9a9a9a";
  x.fillRect(0, 0, s, s);
  for (let i = 0; i < 1400; i++) {
    const px = Math.random() * s, py = Math.random() * s, r = 0.6 + Math.random() * 2.2;
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, "rgba(20,20,20,.9)");
    g.addColorStop(1, "rgba(20,20,20,0)");
    x.fillStyle = g;
    x.beginPath();
    x.arc(px, py, r, 0, Math.PI * 2);
    x.fill();
  }
}, 4);

// Sombra de contato (mancha radial)
function blobTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,.6)");
  g.addColorStop(0.45, "rgba(0,0,0,.32)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* ---------- Geometrias ---------- */

// "Travesseiro": cubo subdividido projetado num superelipsoide (laterais retas,
// topo fofo). Partir do cubo evita o "vinco em estrela" dos polos da esfera.
function pillowGeometry(w, h, d, eSide = 0.3, eTop = 0.6, seg = 28) {
  let g = new THREE.BoxGeometry(2, 2, 2, seg, Math.round(seg * 0.6), seg);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  const f = (x, e) => Math.sign(x) * Math.pow(Math.abs(x), e);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    p.setXYZ(i, f(v.x, eSide) * w / 2, f(v.y, eTop) * h / 2, f(v.z, eSide) * d / 2);
  }
  // UV planar de cima (textura das fibras)
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) / w + 0.5;
    uv[i * 2 + 1] = p.getZ(i) / d + 0.5;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

function roundedRect(w, d, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function circle(r) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, 0, Math.PI * 2, false);
  return s;
}
const upright = (g) => { g.rotateX(-Math.PI / 2); return g; };

/* ==========================================================================
   createViewer(host, opts) -> controle da cena
   opts: { reduce, lowPower, colors: { box, pill }, onLidChange(open), onFirstFrame() }
   ========================================================================== */
export function createViewer(host, opts = {}) {
  const reduce = !!opts.reduce;
  const lowPower = !!opts.lowPower;
  const maxDpr = lowPower ? 1.5 : 2;
  let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = !lowPower;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "try3d-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  // Estúdio para reflexos
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3a3a, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(3, 6, 4);
  if (!lowPower) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5, near: 1, far: 16 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 5;
    key.shadow.camera.updateProjectionMatrix();
  }
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe2cf, 1.4);
  rim.position.set(-4, 3, -4);
  scene.add(rim);

  // Chão: sombra de contato (sempre) + sombra projetada (computador)
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.4),
    new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, opacity: 0.5 })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.001;
  scene.add(blob);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.18 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.visible = !lowPower;
  scene.add(ground);

  const shadowAll = (g) => g.traverse((o) => { if (o.isMesh) { o.castShadow = !lowPower; o.receiveShadow = !lowPower; } });

  /* ---------- Estojo clássico ---------- */
  const colors = opts.colors || { box: "#262626", pill: "#121212" };
  const paper = paperTex();
  const fabric = fabricTex();
  const boxMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.box), roughness: 0.86, metalness: 0,
    bumpMap: paper, bumpScale: 0.6, envMapIntensity: 0.55
  });
  const pillMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colors.pill), roughness: 0.95, metalness: 0,
    sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color(colors.pill).lerp(new THREE.Color(0xffffff), 0.12),
    bumpMap: fabric, bumpScale: 1.2, envMapIntensity: 0.35
  });

  const estojo = new THREE.Group();
  const W = 1.6, D = 1.6, H = 0.95, T = 0.035;
  const panel = (w, h, d, x, y, z, parent) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, 0.012), boxMat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  panel(W, T, D, 0, T / 2, 0, estojo);
  panel(W, H, T, 0, H / 2, D / 2 - T / 2, estojo);
  panel(W, H, T, 0, H / 2, -D / 2 + T / 2, estojo);
  panel(T, H, D, -W / 2 + T / 2, H / 2, 0, estojo);
  panel(T, H, D, W / 2 - T / 2, H / 2, 0, estojo);

  // Almofada única que preenche a caixa, com um vinco central para a pulseira
  // (topo fica 3 mm abaixo da borda para a tampa fechar sem atravessar)
  const PILL_H = 0.56;
  const pillGeo = pillowGeometry(W - 2 * T - 0.05, PILL_H, D - 2 * T - 0.05);
  const pPos = pillGeo.attributes.position;
  for (let i = 0; i < pPos.count; i++) {
    const x = pPos.getX(i), y = pPos.getY(i);
    if (y > 0) pPos.setY(i, y - 0.07 * Math.exp(-(x * x) / 0.006) * (y / (PILL_H / 2)));
  }
  pillGeo.computeVertexNormals();
  const pillow = new THREE.Mesh(pillGeo, pillMat);
  pillow.position.y = H - 0.03 - PILL_H / 2;
  estojo.add(pillow);

  const LW = W + 0.07, LD = D + 0.07, LH = 0.34;
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, H, -LD / 2);
  estojo.add(lidPivot);
  panel(LW, T, LD, 0, T / 2, LD / 2, lidPivot);
  panel(LW, LH, T, 0, T - LH / 2, LD - T / 2, lidPivot);
  panel(LW, LH, T, 0, T - LH / 2, T / 2, lidPivot);
  panel(T, LH, LD, -LW / 2 + T / 2, T - LH / 2, LD / 2, lidPivot);
  panel(T, LH, LD, LW / 2 - T / 2, T - LH / 2, LD / 2, lidPivot);
  shadowAll(estojo);

  /* ---------- Caixa de acrílico ---------- */
  const baseMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#0c0c0c"), roughness: 0.3, metalness: 0,
    clearcoat: 0.7, clearcoatRoughness: 0.2, envMapIntensity: 1
  });
  // Acrílico: tom leve + camada só de reflexo (Fresnel) somada por cima
  const glassTint = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#eef4ff"), roughness: 0.05, metalness: 0,
    transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 0.6
  });
  const glassSpec = new THREE.MeshPhysicalMaterial({
    color: 0x000000, roughness: 0.03, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 0.9
  });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
  const foamMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#F2F2F2"), roughness: 1, bumpMap: foamTex(), bumpScale: 1.6, envMapIntensity: 0.35
  });
  const furMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#141414"), roughness: 0.95, sheen: 1, sheenRoughness: 0.4,
    sheenColor: new THREE.Color("#5a5a5a"), bumpMap: fabric, bumpScale: 1.2, envMapIntensity: 0.3
  });

  function buildAcrylic(kind) {
    const g = new THREE.Group();
    const S = 1.62, R = kind === "quad" ? 0.44 : 0.81, t = 0.06, Hb = 0.7, LHh = 0.42;
    const outer = () => (kind === "quad" ? roundedRect(S, S, R) : circle(R));
    const inner = (pad) => (kind === "quad" ? roundedRect(S - 2 * pad, S - 2 * pad, Math.max(0.05, R - pad)) : circle(R - pad));
    const curveSegments = lowPower ? 28 : 44;

    const ring = outer();
    ring.holes.push(inner(t));
    g.add(new THREE.Mesh(upright(new THREE.ExtrudeGeometry(ring, { depth: Hb, bevelEnabled: false, curveSegments })), baseMat));
    g.add(new THREE.Mesh(upright(new THREE.ExtrudeGeometry(outer(), { depth: t, bevelEnabled: false, curveSegments })), baseMat));

    // Interior: espuma lisa com poros, ou almofada de veludo
    const cushGeo = upright(new THREE.ExtrudeGeometry(inner(t + 0.09), {
      depth: 0.16, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.075, bevelSegments: lowPower ? 6 : 10, curveSegments
    }));
    const foam = new THREE.Mesh(cushGeo, foamMat);
    const fur = new THREE.Mesh(cushGeo, furMat);
    foam.position.y = fur.position.y = Hb - 0.34;
    g.add(foam, fur);

    // Tampa (gira pela borda de trás)
    const back = kind === "quad" ? S / 2 : R;
    const pivot = new THREE.Group();
    pivot.position.set(0, Hb, -back);
    g.add(pivot);
    const body = new THREE.Group();
    body.position.set(0, 0, back);
    pivot.add(body);
    const lring = outer();
    lring.holes.push(inner(0.045));
    const wallGeo = upright(new THREE.ExtrudeGeometry(lring, { depth: LHh, bevelEnabled: false, curveSegments: curveSegments + 4 }));
    const topGeo = upright(new THREE.ExtrudeGeometry(outer(), { depth: 0.05, bevelEnabled: false, curveSegments: curveSegments + 4 }));
    [glassTint, glassSpec].forEach((mat, i) => {
      const w = new THREE.Mesh(wallGeo, mat);
      const tp = new THREE.Mesh(topGeo, mat);
      tp.position.y = LHh - 0.05;
      w.renderOrder = tp.renderOrder = 5 + i;
      body.add(w, tp);
    });
    const e1 = new THREE.LineSegments(new THREE.EdgesGeometry(wallGeo, 35), edgeMat);
    const e2 = new THREE.LineSegments(new THREE.EdgesGeometry(topGeo, 35), edgeMat);
    e2.position.y = LHh - 0.05;
    body.add(e1, e2);

    shadowAll(g);
    body.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    g.userData = { pivot, foam, fur };
    return g;
  }
  const acr = { quad: buildAcrylic("quad"), red: buildAcrylic("red") };

  const turntable = new THREE.Group();
  const holder = new THREE.Group();
  scene.add(turntable);
  turntable.add(holder);
  holder.add(estojo, acr.quad, acr.red);

  /* ---------- Estado ---------- */
  const state = { prod: "estojo", forma: "quad", int: "almofada" };
  const target = { box: new THREE.Color(colors.box), pill: new THREE.Color(colors.pill) };
  let lid = reduce ? 1 : 0;
  let lidTarget = 1;
  let popT = 1;
  let dropT = reduce ? 1 : 0;

  function applyVisibility() {
    estojo.visible = state.prod === "estojo";
    acr.quad.visible = state.prod === "acrilico" && state.forma === "quad";
    acr.red.visible = state.prod === "acrilico" && state.forma === "red";
    [acr.quad, acr.red].forEach((g) => {
      g.userData.foam.visible = state.int === "espuma";
      g.userData.fur.visible = state.int === "almofada";
    });
  }

  /* ---------- Arrastar / tocar / teclado ---------- */
  let rotY = -0.55, rotX = 0, tRotY = -0.55, tRotX = 0;
  let dragging = false, sx = 0, sy = 0, moved = 0, lastInput = 0, pointerType = "";

  const setLid = (open) => {
    lidTarget = open ? 1 : 0;
    if (opts.onLidChange) opts.onLidChange(!!lidTarget);
  };
  const toggleLid = () => setLid(!lidTarget);

  host.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dragging = true;
    moved = 0;
    sx = e.clientX;
    sy = e.clientY;
    pointerType = e.pointerType;
    host.classList.add("is-dragging");
    lastInput = performance.now();
  });
  host.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    sx = e.clientX;
    sy = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 6 && !host.hasPointerCapture(e.pointerId)) host.setPointerCapture(e.pointerId);
    tRotY += dx * 0.011;
    // No toque, o arraste vertical rola a página; a inclinação é só no mouse
    if (pointerType === "mouse") tRotX = Math.max(-0.25, Math.min(0.45, tRotX + dy * 0.006));
    lastInput = performance.now();
  });
  const endDrag = (tap) => {
    if (!dragging) return;
    dragging = false;
    host.classList.remove("is-dragging");
    if (tap && moved < 6) toggleLid();
    lastInput = performance.now();
  };
  host.addEventListener("pointerup", () => endDrag(true));
  host.addEventListener("pointercancel", () => endDrag(false));
  host.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      tRotY += (e.key === "ArrowLeft" ? -1 : 1) * 0.35;
      lastInput = performance.now();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleLid();
    }
  });

  /* ---------- Tamanho ---------- */
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // enquadra a caixa com a tampa aberta (mais alta que larga)
    const dist = camera.aspect < 0.8 ? 8.4 : camera.aspect < 1.2 ? 7.4 : 6.6;
    camera.position.set(0, dist * 0.5, dist);
    camera.lookAt(0, camera.aspect < 1.2 ? 0.95 : 0.75, 0);
    camera.updateProjectionMatrix();
    render(); // evita quadro vazio ao redimensionar com a animação parada
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  /* ---------- Animação ---------- */
  const WHITE = new THREE.Color(0xffffff);
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const back = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  let running = false, raf = 0, prev = 0, firstFrame = false;
  let slowFrames = 0, sampled = 0;

  function render() { renderer.render(scene, camera); }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dtRaw = (now - prev) / 1000;
    const dt = Math.min(0.05, dtRaw);
    prev = now;

    if (!reduce && !dragging && now - lastInput > 2600) tRotY += dt * 0.35;
    const k = Math.min(1, dt * 8);
    rotY += (tRotY - rotY) * k;
    rotX += (tRotX - rotX) * k;
    turntable.rotation.y = rotY;
    turntable.rotation.x = rotX * 0.5;

    lid += (lidTarget - lid) * (reduce ? 1 : Math.min(1, dt * 4.7));
    const ang = -1.92 * ease(Math.max(0, Math.min(1, lid)));
    lidPivot.rotation.x = ang;
    acr.quad.userData.pivot.rotation.x = ang * 0.95;
    acr.red.userData.pivot.rotation.x = ang * 0.95;

    const ck = reduce ? 1 : Math.min(1, dt * 6);
    boxMat.color.lerp(target.box, ck);
    pillMat.color.lerp(target.pill, ck);
    pillMat.sheenColor.copy(pillMat.color).lerp(WHITE, 0.12);

    if (dropT < 1) dropT = Math.min(1, dropT + dt * 1.5);
    if (popT < 1) popT = Math.min(1, popT + dt * 2.4);
    holder.scale.setScalar(0.82 + 0.18 * back(popT));
    const lift = (1 - back(dropT)) * 2.2;
    holder.position.y = lift;
    holder.rotation.z = (1 - popT) * 0.12;
    // sombra encolhe e clareia quando o produto está no alto
    const sh = Math.max(0.35, 1 - Math.abs(lift) * 0.3);
    blob.scale.setScalar(sh);

    render();

    if (!firstFrame) {
      firstFrame = true;
      if (opts.onFirstFrame) opts.onFirstFrame();
    }

    // Qualidade adaptativa: muitos quadros lentos -> menos pixels
    if (dtRaw < 0.25) {
      sampled++;
      if (dtRaw > 0.026) slowFrames++;
      if (sampled >= 90) {
        if (slowFrames > 45 && dpr > 1) {
          dpr = Math.max(1, dpr - 0.5);
          renderer.setPixelRatio(dpr);
          resize();
        }
        sampled = slowFrames = 0;
      }
    }
  }

  function start() {
    if (running) return;
    running = true;
    prev = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  applyVisibility();
  resize();

  // Entrada: cai de cima e a tampa abre logo depois
  let introStarted = false;
  function intro() {
    if (introStarted) return;
    introStarted = true;
    if (reduce) return;
    dropT = 0;
    lidTarget = 0;
    setTimeout(() => setLid(true), 1100);
  }

  return {
    start() { intro(); start(); },
    stop,
    setLid,
    toggleLid,
    isOpen: () => !!lidTarget,
    /** prod: "estojo" | "acrilico"; forma: "quad" | "red"; int: "espuma" | "almofada" */
    update(next, { pop = true, reopen = false } = {}) {
      Object.assign(state, next);
      if (next.colors) {
        target.box.set(next.colors.box);
        target.pill.set(next.colors.pill);
      }
      applyVisibility();
      if (pop && !reduce) popT = 0;
      if (reopen) {
        setLid(false);
        setTimeout(() => setLid(true), reduce ? 0 : 450);
      }
      if (!running) render();
    },
    /** Tom do fundo: sombras mais fortes em fundo escuro */
    setDarkBackground(dark) {
      blob.material.opacity = dark ? 0.85 : 0.5;
      ground.material.opacity = dark ? 0.35 : 0.18;
    },
    dispose() {
      stop();
      ro.disconnect();
      renderer.dispose();
    }
  };
}
