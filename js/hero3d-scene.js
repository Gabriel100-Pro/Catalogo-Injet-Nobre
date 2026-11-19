/* ==========================================================================
   INJET NOBRE – HERO 3D (cena)
   Módulo ES carregado por js/hero3d.js. Three.js r160 vem do mapa de imports
   do index.html ("three"). Baseado em hero-3d-injet-nobre.html (protótipo):
   estojo em 6 cores e caixa de acrílico (4 variações), mini caixas flutuantes,
   tampa que abre/fecha e relógio real (assets/relogio.glb, GLTFLoader) com
   shader que muda mostrador e metal conforme a cor da caixa.
   Melhorias mantidas da seção 3D anterior: reflexos de estúdio, almofada de
   veludo, acrílico com reflexo de Fresnel, sombra de contato, qualidade
   adaptativa e desenho só enquanto a hero está visível.
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
   createHero(host, opts) -> controle da cena da hero
   opts: {
     reduce, lowPower,
     onLidChange(open), onWatchChange(out), onFirstFrame(), onWatchReady(ok)
   }
   ========================================================================== */
export function createHero(host, opts = {}) {
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
  renderer.domElement.className = "hero3d-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const LOOK = new THREE.Vector3(0, 0.75, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3a3a, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(3, 6, 4);
  if (!lowPower) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -2.5, right: 2.5, top: 3, bottom: -2.5, near: 1, far: 16 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.camera.updateProjectionMatrix();
  }
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe2cf, 1.4);
  rim.position.set(-4, 3, -4);
  scene.add(rim);

  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.4),
    new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, opacity: 0.5 })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.001;
  scene.add(blob);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.18 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.visible = !lowPower;
  scene.add(ground);

  const shadowAll = (g) => g.traverse((o) => { if (o.isMesh) { o.castShadow = !lowPower; o.receiveShadow = !lowPower; } });

  /* ---------- Materiais ---------- */
  const paper = paperTex();
  const fabric = fabricTex();
  const boxMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#262626"), roughness: 0.86, metalness: 0,
    bumpMap: paper, bumpScale: 0.6, envMapIntensity: 0.55
  });
  const WHITE = new THREE.Color(0xffffff);
  const pillMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#121212"), roughness: 0.95, metalness: 0,
    sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color("#121212").lerp(WHITE, 0.12),
    bumpMap: fabric, bumpScale: 1.2, envMapIntensity: 0.35
  });

  /* ---------- Estojo clássico ---------- */
  const W = 1.6, D = 1.6, H = 0.95, T = 0.035;
  const PILL_H = 0.5;
  const PILL_TOP = 0.8; // o relógio fica apoiado aqui, abaixo da tampa
  const pillGeo = (() => {
    const g = pillowGeometry(W - 2 * T - 0.05, PILL_H, D - 2 * T - 0.05);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      if (y > 0) p.setY(i, y - 0.06 * Math.exp(-(x * x) / 0.006) * (y / (PILL_H / 2)));
    }
    g.computeVertexNormals();
    return g;
  })();

  // detail=false: versão leve para as mini caixas (sem cantos arredondados)
  function buildEstojo(bm, pm, detail = true) {
    const g = new THREE.Group();
    const panel = (w, h, d, x, y, z, parent) => {
      const geo = detail ? new RoundedBoxGeometry(w, h, d, 2, 0.012) : new THREE.BoxGeometry(w, h, d);
      const m = new THREE.Mesh(geo, bm);
      m.position.set(x, y, z);
      parent.add(m);
    };
    panel(W, T, D, 0, T / 2, 0, g);
    panel(W, H, T, 0, H / 2, D / 2 - T / 2, g);
    panel(W, H, T, 0, H / 2, -D / 2 + T / 2, g);
    panel(T, H, D, -W / 2 + T / 2, H / 2, 0, g);
    panel(T, H, D, W / 2 - T / 2, H / 2, 0, g);
    const pillow = new THREE.Mesh(pillGeo, pm);
    pillow.position.y = PILL_TOP - PILL_H / 2;
    g.add(pillow);
    const LW = W + 0.07, LD = D + 0.07, LH = 0.34;
    const pivot = new THREE.Group();
    pivot.position.set(0, H, -LD / 2);
    g.add(pivot);
    panel(LW, T, LD, 0, T / 2, LD / 2, pivot);
    panel(LW, LH, T, 0, T - LH / 2, LD - T / 2, pivot);
    panel(LW, LH, T, 0, T - LH / 2, T / 2, pivot);
    panel(T, LH, LD, -LW / 2 + T / 2, T - LH / 2, LD / 2, pivot);
    panel(T, LH, LD, LW / 2 - T / 2, T - LH / 2, LD / 2, pivot);
    g.userData.pivot = pivot;
    return g;
  }
  const estojo = buildEstojo(boxMat, pillMat);
  shadowAll(estojo);

  /* ---------- Caixa de acrílico ---------- */
  const baseMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#0c0c0c"), roughness: 0.3, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.2, envMapIntensity: 1
  });
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
  const Hb = 0.7;
  const CUSH_TOP = Hb - 0.34 + 0.16 + 0.16;

  function buildAcrylic(kind, detail = true) {
    const g = new THREE.Group();
    const S = 1.62, R = kind === "quad" ? 0.44 : 0.81, t = 0.06, LHh = 0.42;
    const outer = () => (kind === "quad" ? roundedRect(S, S, R) : circle(R));
    const inner = (pad) => (kind === "quad" ? roundedRect(S - 2 * pad, S - 2 * pad, Math.max(0.05, R - pad)) : circle(R - pad));
    const curveSegments = detail ? (lowPower ? 28 : 44) : 16;
    const ring = outer();
    ring.holes.push(inner(t));
    g.add(new THREE.Mesh(upright(new THREE.ExtrudeGeometry(ring, { depth: Hb, bevelEnabled: false, curveSegments })), baseMat));
    g.add(new THREE.Mesh(upright(new THREE.ExtrudeGeometry(outer(), { depth: t, bevelEnabled: false, curveSegments })), baseMat));
    const cushGeo = upright(new THREE.ExtrudeGeometry(inner(t + 0.09), {
      depth: 0.16, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.075, bevelSegments: detail ? 8 : 3, curveSegments
    }));
    const foam = new THREE.Mesh(cushGeo, foamMat);
    const fur = new THREE.Mesh(cushGeo, furMat);
    foam.position.y = fur.position.y = Hb - 0.34;
    g.add(foam, fur);
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
    if (detail) {
      const e1 = new THREE.LineSegments(new THREE.EdgesGeometry(wallGeo, 35), edgeMat);
      const e2 = new THREE.LineSegments(new THREE.EdgesGeometry(topGeo, 35), edgeMat);
      e2.position.y = LHh - 0.05;
      body.add(e1, e2);
    }
    g.userData = { pivot, foam, fur };
    return g;
  }
  const acr = { quad: buildAcrylic("quad"), red: buildAcrylic("red") };
  [acr.quad, acr.red].forEach((g) => {
    shadowAll(g);
    g.userData.pivot.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  });

  /* ---------- Relógio (.glb) com shader de cor ----------
     Escuros do modelo (mostrador) viram a cor uDial; o resto (metal) é
     tingido por uMetal. uMix = 0 mantém o mostrador original. */
  const WU = {
    uDial: { value: new THREE.Color(0, 0, 0) },
    uMetal: { value: new THREE.Color(1, 1, 1) },
    uMix: { value: 0 }
  };
  const watch = new THREE.Group();
  watch.rotation.order = "YXZ";
  watch.visible = false;
  const WS = 0.62;
  let dialTop = 0.74 * WS;
  let watchReady = false;
  const IN_Y = () => (state.prod === "estojo" ? PILL_TOP + 0.06 : CUSH_TOP + 0.1) - dialTop;

  function prepareWatchMaterial(m) {
    m.envMapIntensity = 1.35;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, WU);
      sh.fragmentShader = "uniform vec3 uDial;\nuniform vec3 uMetal;\nuniform float uMix;\n" + sh.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        float lumW = dot(diffuseColor.rgb, vec3(.2126, .7152, .0722));
        float dkW = 1. - smoothstep(.012, .05, lumW);
        vec3 metalW = diffuseColor.rgb * uMetal;
        vec3 dialW = uDial * (.55 + lumW * 14.);
        diffuseColor.rgb = mix(metalW, dialW, dkW * uMix);`
      );
    };
    m.needsUpdate = true;
  }

  async function loadWatch(url) {
    try {
      const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
      const gltf = await new GLTFLoader().loadAsync(url);
      const model = gltf.scene;
      model.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = !lowPower;
        o.receiveShadow = !lowPower;
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(prepareWatchMaterial);
      });
      const inner = new THREE.Group();
      inner.rotation.x = -Math.PI / 2; // mostrador para cima
      inner.scale.setScalar(WS);
      inner.add(model);
      // centraliza pelo tamanho real do modelo e mede a altura do mostrador
      const probe = new THREE.Group();
      probe.add(inner);
      probe.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(probe);
      const c = box.getCenter(new THREE.Vector3());
      inner.position.set(-c.x, 0, -c.z);
      dialTop = box.max.y;
      watch.add(inner);
      // compila os shaders antes de aparecer (evita travadinha no 1º quadro)
      watch.visible = true;
      renderer.compile(scene, camera);
      watchReady = true;
      if (opts.onWatchReady) opts.onWatchReady(true);
      if (!running) render();
    } catch (err) {
      if (opts.onWatchReady) opts.onWatchReady(false);
    }
  }

  /* ---------- Cena ---------- */
  const turntable = new THREE.Group();
  const holder = new THREE.Group();
  scene.add(turntable);
  turntable.add(holder);
  holder.add(estojo, acr.quad, acr.red, watch);

  /* ---------- Mini caixas flutuantes ---------- */
  const MINI_POS = [[-2.9, 2.2, -1.6], [2.7, 2.5, -1.8], [-3.3, 0.9, -0.6], [3.3, 1.1, -0.8], [-2.1, 3.0, -2.6], [2.0, 3.1, -2.4],
    [-1.9, 0.35, 1.2], [2.1, 0.45, 1.0], [-3.9, 1.9, -2.8], [3.8, 2.0, -2.9], [0.0, 3.5, -3.4], [-1.0, 2.7, -2.0]];
  const minis = [];
  const miniLayer = new THREE.Group();
  scene.add(miniLayer);
  const miniAcrSrc = { quad: buildAcrylic("quad", false) };
  MINI_POS.slice(0, lowPower ? 6 : 12).forEach((p, k) => {
    const mb = boxMat.clone();
    const mp = new THREE.MeshStandardMaterial({ color: pillMat.color.clone(), roughness: 1 });
    const e = buildEstojo(mb, mp, false);
    const a = miniAcrSrc.quad.clone(true);
    a.userData = {};
    // metade com espuma, metade com almofada
    const fill = a.children.filter((ch) => ch.isMesh && (ch.material === foamMat || ch.material === furMat));
    fill.forEach((ch) => { ch.visible = (ch.material === foamMat) === (k % 2 === 0); });
    a.visible = false;
    const g = new THREE.Group();
    g.add(e, a);
    const s = 0.2 + ((k * 37) % 10) / 100;
    g.scale.setScalar(s);
    g.position.set(...p);
    g.rotation.set((k % 3 - 1) * 0.25, k, k % 2 ? 0.2 : -0.15);
    const lidA = 0.4 + ((k * 13) % 5) / 10;
    e.userData.pivot.rotation.x = -lidA * 1.2;
    const ap = a.children.find((ch) => ch.type === "Group");
    if (ap) ap.rotation.x = -lidA * 1.1;
    g.userData = {
      base: new THREE.Vector3(...p), ph: k * 1.3, sp: 0.6 + (k % 4) * 0.15, rs: (k % 2 ? 1 : -1) * (0.25 + (k % 3) * 0.1),
      mb, mp, e, a, s, spin: 0, tBox: mb.color.clone(), tPill: mp.color.clone()
    };
    miniLayer.add(g);
    minis.push(g);
  });

  /* ---------- Estado ---------- */
  const state = { prod: "estojo", forma: "quad", int: "almofada" };
  const target = {
    box: new THREE.Color("#262626"), pill: new THREE.Color("#121212"),
    metal: new THREE.Color("#ffffff"), dial: new THREE.Color("#101010"), mix: 0
  };
  let lid = reduce ? 1 : 0, lidTarget = 1;
  let watchOut = 0, watchTarget = 0;
  let spinFrom = 0, spinTo = 0, spinT = 1;
  let dropT = reduce ? 1 : 0;

  function applyModels() {
    estojo.visible = state.prod === "estojo";
    acr.quad.visible = state.prod === "acrilico" && state.forma === "quad";
    acr.red.visible = state.prod === "acrilico" && state.forma === "red";
    [acr.quad, acr.red].forEach((g) => {
      g.userData.foam.visible = state.int === "espuma";
      g.userData.fur.visible = state.int === "almofada";
    });
    minis.forEach((m) => { m.userData.e.visible = state.prod === "estojo"; m.userData.a.visible = state.prod === "acrilico"; });
  }

  function setLook(v) {
    if (v.colors) {
      target.box.set(v.colors.box);
      target.pill.set(v.colors.pill);
    }
    if (v.watch) {
      target.metal.set(v.watch.metal);
      if (v.watch.dial) { target.dial.set(v.watch.dial); target.mix = 1; } else target.mix = 0;
    }
    minis.forEach((m, k) => {
      const go = () => {
        if (state.prod === "estojo" && v.colors) { m.userData.tBox.set(v.colors.box); m.userData.tPill.set(v.colors.pill); }
        if (!reduce) m.userData.spin = 1;
      };
      if (reduce) go(); else setTimeout(go, 60 + k * 55);
    });
  }

  const setLid = (open) => {
    lidTarget = open ? 1 : 0;
    if (opts.onLidChange) opts.onLidChange(!!lidTarget);
  };
  const setWatch = (out) => {
    watchTarget = out ? 1 : 0;
    if (opts.onWatchChange) opts.onWatchChange(!!watchTarget);
  };
  function toggleLid() {
    // com o relógio fora, primeiro ele volta para a caixa, depois a tampa fecha
    if (lidTarget && watchTarget) {
      setWatch(false);
      setTimeout(() => setLid(false), reduce ? 0 : 650);
      return;
    }
    setLid(!lidTarget);
  }
  function toggleWatch() {
    if (!watchReady) return;
    setWatch(!watchTarget);
    if (watchTarget && !lidTarget) setLid(true);
  }

  /* ---------- Arrastar / tocar / parallax ---------- */
  let rotY = -0.5, rotX = 0, tRotY = -0.5, tRotX = 0;
  let dragging = false, sx = 0, sy = 0, moved = 0, lastInput = 0, pointerType = "";
  const ptr = { x: 0, y: 0 }, ptrS = { x: 0, y: 0 };

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
    const r = host.getBoundingClientRect();
    ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ptr.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    sx = e.clientX;
    sy = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 6 && !host.hasPointerCapture(e.pointerId)) host.setPointerCapture(e.pointerId);
    tRotY += dx * 0.011;
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

  /* ---------- Tamanho ---------- */
  let xSpread = 1;
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Telas altas (celular em pé): câmera mais longe e caixa um pouco acima,
    // para caber inteira entre os controles de cima e os de baixo
    const base = w < 760 ? 9.2 : 7.4;
    const tall = camera.aspect < 0.75;
    const dist = tall ? base * Math.pow(0.75 / camera.aspect, 0.7) : base;
    LOOK.y = tall ? 0.45 : 0.75;
    camera.position.set(0, dist * 0.42 + 0.4, dist);
    camera.lookAt(LOOK);
    camera.updateProjectionMatrix();
    xSpread = Math.max(0.42, Math.min(1.15, camera.aspect / 1.7));
    render();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  /* ---------- Animação ---------- */
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const back = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const wrapPI = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };
  let running = false, raf = 0, prev = 0, firstFrame = false, introDone = false;
  let slowFrames = 0, sampled = 0;

  function render() { renderer.render(scene, camera); }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dtRaw = (now - prev) / 1000;
    const dt = Math.min(0.05, dtRaw);
    prev = now;
    const t = now / 1000;

    if (!reduce && !dragging && !watchTarget && now - lastInput > 2600) tRotY += dt * 0.3;
    // relógio fora: a caixa vira de frente para ele
    if (watchTarget && !dragging && now - lastInput > 1500) {
      tRotY += (Math.round(tRotY / (Math.PI * 2)) * Math.PI * 2 - 0.35 - tRotY) * Math.min(1, dt * 2);
    }
    const k8 = Math.min(1, dt * 8);
    rotY += (tRotY - rotY) * k8;
    rotX += (tRotX - rotX) * k8;
    let spin = 0;
    if (spinT < 1) {
      spinT = Math.min(1, spinT + dt * 1.4);
      spin = spinFrom + (spinTo - spinFrom) * easeIO(spinT);
    }
    turntable.rotation.y = rotY + spin;
    turntable.rotation.x = rotX * 0.5;

    lid += (lidTarget - lid) * (reduce ? 1 : Math.min(1, dt * 4.5));
    const ang = -1.92 * ease(Math.max(0, Math.min(1, lid)));
    estojo.userData.pivot.rotation.x = ang;
    acr.quad.userData.pivot.rotation.x = ang * 0.95;
    acr.red.userData.pivot.rotation.x = ang * 0.95;

    const ck = reduce ? 1 : Math.min(1, dt * 6);
    boxMat.color.lerp(target.box, ck);
    pillMat.color.lerp(target.pill, ck);
    pillMat.sheenColor.copy(pillMat.color).lerp(WHITE, 0.12);
    WU.uMetal.value.lerp(target.metal, ck);
    WU.uDial.value.lerp(target.dial, ck);
    WU.uMix.value += (target.mix - WU.uMix.value) * ck;

    // Relógio: dentro da caixa -> flutuando na frente dela
    if (watchReady) {
      watchOut += (watchTarget - watchOut) * (reduce ? 1 : Math.min(1, dt * 3.2));
      const wo = easeIO(Math.max(0, Math.min(1, watchOut)));
      const ay = wrapPI(turntable.rotation.y);
      const wz = 0.7, wy = 1.5 + (reduce ? 0 : Math.sin(t * 1.6) * 0.06);
      const lx = -wz * Math.sin(ay), lz = wz * Math.cos(ay);
      const inY = IN_Y();
      const hs = holder.scale.x || 1;
      watch.position.set((lx * wo) / hs, inY + (wy / hs - inY) * wo, (lz * wo) / hs);
      watch.rotation.x = 1.05 * wo;
      watch.rotation.y = ((reduce ? 0 : Math.sin(t * 0.8) * 0.35) - ay) * wo;
      watch.scale.setScalar(1 + 0.35 * wo);
    }

    if (dropT < 1) dropT = Math.min(1, dropT + dt * 1.4);
    const lift = (1 - back(dropT)) * 2.4;
    holder.position.y = lift;
    blob.scale.setScalar(Math.max(0.35, 1 - Math.abs(lift) * 0.3));

    // Mini caixas: flutuam, giram e seguem o mouse de leve
    ptrS.x += (ptr.x - ptrS.x) * Math.min(1, dt * 3);
    ptrS.y += (ptr.y - ptrS.y) * Math.min(1, dt * 3);
    miniLayer.rotation.y = ptrS.x * 0.12;
    miniLayer.rotation.x = ptrS.y * 0.05;
    const mk = Math.min(1, dt * 5);
    minis.forEach((m) => {
      const u = m.userData;
      m.position.set(u.base.x * xSpread, u.base.y + (reduce ? 0 : Math.sin(t * u.sp + u.ph) * 0.16), u.base.z);
      if (!reduce) {
        m.rotation.y += dt * u.rs;
        m.rotation.x = Math.sin(t * 0.7 + u.ph) * 0.2;
      }
      if (u.spin > 0) {
        u.spin = Math.max(0, u.spin - dt * 1.8);
        m.rotation.y += dt * 9 * u.spin;
        m.scale.setScalar(u.s * (1 + 0.25 * Math.sin(u.spin * Math.PI)));
      }
      u.mb.color.lerp(u.tBox, mk);
      u.mp.color.lerp(u.tPill, mk);
    });

    render();

    if (!firstFrame) {
      firstFrame = true;
      if (opts.onFirstFrame) opts.onFirstFrame();
    }
    if (!introDone && dropT >= 1 && lid > 0.95) {
      introDone = true;
      if (opts.onIntroDone) opts.onIntroDone();
    }

    // Qualidade adaptativa
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

  applyModels();
  resize();

  let introStarted = false;
  function intro() {
    if (introStarted) return;
    introStarted = true;
    if (reduce) { if (opts.onIntroDone) opts.onIntroDone(); return; }
    dropT = 0;
    lidTarget = 0;
    setTimeout(() => setLid(true), 1100);
  }

  return {
    start() { intro(); start(); },
    stop,
    toggleLid,
    toggleWatch,
    loadWatch,
    isOpen: () => !!lidTarget,
    /**
     * Troca de variação: gira a caixa e aplica cor/modelo no meio do giro.
     * v: { prod, forma, int, colors: { box, pill }, watch: { metal, dial } }
     */
    setVariant(v, { dir = 0, prodChange = false } = {}) {
      const apply = () => {
        Object.assign(state, { prod: v.prod, forma: v.forma || state.forma, int: v.int || state.int });
        applyModels();
        setLook(v);
        if (!running) render();
      };
      if (reduce || (!dir && !prodChange)) { apply(); return; }
      spinFrom = 0;
      spinTo = (dir || 1) * Math.PI * 2;
      spinT = 0;
      if (prodChange) {
        const out = watchTarget;
        if (out) setWatch(false);
        setLid(false);
        setTimeout(() => { apply(); setLid(true); }, 380);
      } else {
        setTimeout(apply, 260);
      }
    },
    setDarkBackground(dark) {
      blob.material.opacity = dark ? 0.85 : 0.5;
      ground.material.opacity = dark ? 0.35 : 0.18;
    }
  };
}
