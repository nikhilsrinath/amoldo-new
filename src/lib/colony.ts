/**
 * "The Colony" — a canvas particle swarm whose state is a pure function of
 * `progress` (0..1), so scrubbing forward plays and scrubbing back rewinds.
 * Particles assemble into the real Red Ant Media logo by sampling its pixels.
 */

export type ColonyMode = "hero" | "finale";

type Rect = { x: number; y: number; w: number; h: number };
type Pt = { x: number; y: number };

const LOGO_SRC = "/brand/redant-logo.png";
const RED = [255, 45, 45];
const WHITE = [242, 242, 245];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Deterministic PRNG so layouts are stable across resizes.
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let logoSamplesPromise: Promise<{ x: number; y: number; red: boolean }[]> | null = null;

export function loadLogoSamples() {
  if (logoSamplesPromise) return logoSamplesPromise;
  logoSamplesPromise = new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const W = 640;
      const H = Math.round((W * img.naturalHeight) / img.naturalWidth);
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const cx = c.getContext("2d", { willReadFrequently: true })!;
      cx.drawImage(img, 0, 0, W, H);
      const data = cx.getImageData(0, 0, W, H).data;
      const out: { x: number; y: number; red: boolean }[] = [];
      const step = 3;
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          const i = (y * W + x) * 4;
          if (data[i + 3] > 140) {
            out.push({ x: x / W, y: y / H, red: data[i + 1] < 120 });
          }
        }
      }
      resolve(out);
    };
    img.onerror = () => resolve([]);
    img.src = LOGO_SRC;
  });
  return logoSamplesPromise;
}

export const LOGO_ASPECT = 333 / 909;

/** Where the logo sits inside the canvas for each mode. Shared with the DOM <img>. */
export function logoLayout(mode: ColonyMode, w: number, h: number): Rect {
  const mobile = w < 768;
  let lw: number, cx: number, cy: number;
  if (mode === "hero") {
    if (mobile) {
      lw = w * 0.62;
      cx = w * 0.5;
      cy = h * 0.2;
    } else {
      lw = Math.min(w * 0.34, 560);
      cx = w * 0.7;
      cy = h * 0.42;
    }
  } else {
    lw = mobile ? w * 0.78 : Math.min(w * 0.46, 640);
    cx = w * 0.5;
    cy = h * (mobile ? 0.36 : 0.4);
  }
  const lh = lw * LOGO_ASPECT;
  return { x: cx - lw / 2, y: cy - lh / 2, w: lw, h: lh };
}

export class Colony {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private n: number;
  private raf = 0;
  private running = false;
  private ro: ResizeObserver;
  private io: IntersectionObserver;
  private visible = false;
  private samples: { x: number; y: number; red: boolean }[] = [];

  // per-particle data
  private seedX!: Float32Array;
  private seedY!: Float32Array;
  private phase!: Float32Array;
  private delay!: Float32Array;
  private size!: Float32Array;
  private lane!: Uint8Array;
  private laneU!: Float32Array;
  private edge!: Uint8Array;
  private sampleIdx!: Uint32Array;

  private logo: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private hub: Pt = { x: 0, y: 0 };
  private nodes: Pt[] = [];
  private edges: [Pt, Pt][] = [];
  private lanes: Pt[][] = [];
  private curve: Pt[] = [];

  progress = 0;
  onLayout?: (logo: Rect) => void;

  constructor(
    private canvas: HTMLCanvasElement,
    private mode: ColonyMode,
  ) {
    this.ctx = canvas.getContext("2d")!;
    const small = window.innerWidth < 768;
    this.n = mode === "hero" ? (small ? 900 : 2000) : small ? 800 : 1800;
    this.alloc();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (this.visible) this.start();
      else this.stop();
    });
    this.io.observe(canvas);
    loadLogoSamples().then((s) => {
      this.samples = s;
      this.assignSamples();
    });
  }

  private alloc() {
    const r = mulberry(this.mode === "hero" ? 7 : 11);
    const n = this.n;
    this.seedX = new Float32Array(n);
    this.seedY = new Float32Array(n);
    this.phase = new Float32Array(n);
    this.delay = new Float32Array(n);
    this.size = new Float32Array(n);
    this.lane = new Uint8Array(n);
    this.laneU = new Float32Array(n);
    this.edge = new Uint8Array(n);
    this.sampleIdx = new Uint32Array(n);
    for (let i = 0; i < n; i++) {
      this.seedX[i] = r();
      this.seedY[i] = r();
      this.phase[i] = r() * Math.PI * 2;
      this.delay[i] = r();
      this.size[i] = 0.9 + r() * 1.4;
      this.lane[i] = Math.floor(r() * 6);
      this.laneU[i] = r();
      this.edge[i] = Math.floor(r() * 14);
    }
  }

  private assignSamples() {
    const s = this.samples;
    if (!s.length) return;
    // Spread particles evenly over the sampled logo pixels.
    const r = mulberry(3);
    const order = s.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (let i = 0; i < this.n; i++) this.sampleIdx[i] = order[i % order.length];
  }

  resize() {
    // clientWidth ignores CSS transforms (the stage scales during scenes).
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.layout();
    this.draw(performance.now() / 1000);
  }

  private layout() {
    const { w, h } = this;
    const mobile = w < 768;
    this.logo = logoLayout(this.mode, w, h);
    this.hub = { x: this.logo.x + this.logo.w / 2, y: this.logo.y + this.logo.h / 2 };
    this.onLayout?.(this.logo);

    // Channel network around the hub
    const rx = mobile ? w * 0.42 : Math.min(w * 0.24, 380);
    const ry = mobile ? h * 0.2 : Math.min(h * 0.34, 300);
    this.nodes = Array.from({ length: 7 }, (_, k) => {
      const a = -Math.PI / 2 + (k / 7) * Math.PI * 2;
      return { x: this.hub.x + Math.cos(a) * rx, y: this.hub.y + Math.sin(a) * ry };
    });
    this.edges = [];
    for (let k = 0; k < 7; k++) this.edges.push([this.hub, this.nodes[k]]);
    for (let k = 0; k < 7; k++) this.edges.push([this.nodes[k], this.nodes[(k + 1) % 7]]);

    // Marching lanes converging on the logo
    this.lanes = Array.from({ length: 6 }, (_, k) => {
      const sy = h * (0.08 + k * 0.17);
      const pts: Pt[] = [];
      for (let s = 0; s <= 24; s++) {
        const t = s / 24;
        const x = lerp(-0.05 * w, this.hub.x, t);
        const y = lerp(sy, this.hub.y, smooth(t)) + Math.sin(t * Math.PI * 2 + k) * h * 0.03 * (1 - t);
        pts.push({ x, y });
      }
      return pts;
    });

    // Rising growth curve
    const x0 = mobile ? w * 0.04 : w * 0.52;
    const x1 = mobile ? w * 0.96 : w * 0.97;
    const y0 = mobile ? h * 0.5 : h * 0.8;
    const y1 = mobile ? h * 0.06 : h * 0.1;
    this.curve = [];
    for (let s = 0; s <= 60; s++) {
      const t = s / 60;
      this.curve.push({
        x: lerp(x0, x1, t),
        y: y0 - (y0 - y1) * Math.pow(t, 2.1) + Math.sin(t * 18) * h * 0.012 * (1 - t),
      });
    }
  }

  private along(path: Pt[], u: number): Pt {
    const f = clamp(u) * (path.length - 1);
    const i = Math.min(path.length - 2, Math.floor(f));
    const t = f - i;
    return { x: lerp(path[i].x, path[i + 1].x, t), y: lerp(path[i].y, path[i + 1].y, t) };
  }

  // ---- States ----
  private posScatter(i: number, t: number): Pt {
    const p = this.phase[i];
    return {
      x: this.seedX[i] * this.w + Math.sin(t * 0.35 + p) * 14,
      y: this.seedY[i] * this.h + Math.cos(t * 0.28 + p * 1.3) * 14,
    };
  }
  private posEdges(i: number, t: number): Pt {
    // Just outside the viewport, around the rim (finale entry).
    const a = this.seedX[i] * Math.PI * 2;
    const R = Math.hypot(this.w, this.h) * (0.55 + this.seedY[i] * 0.25);
    return {
      x: this.w / 2 + Math.cos(a + t * 0.02) * R,
      y: this.h / 2 + Math.sin(a + t * 0.02) * R,
    };
  }
  private posLane(i: number, t: number): Pt {
    const u = (this.laneU[i] + t * 0.06) % 1;
    const p = this.along(this.lanes[this.lane[i]], u * 0.92);
    return { x: p.x, y: p.y + Math.sin(this.phase[i]) * 3 };
  }
  private posLogo(i: number, t: number): Pt {
    const s = this.samples[this.sampleIdx[i]];
    if (!s) return { x: this.hub.x, y: this.hub.y };
    const j = Math.sin(t * 2 + this.phase[i]) * 0.5;
    return { x: this.logo.x + s.x * this.logo.w + j, y: this.logo.y + s.y * this.logo.h + j };
  }
  private posNet(i: number, t: number): Pt {
    const [a, b] = this.edges[this.edge[i]];
    const u = (this.laneU[i] + t * 0.12) % 1;
    return {
      x: lerp(a.x, b.x, u) + Math.sin(this.phase[i]) * 2,
      y: lerp(a.y, b.y, u) + Math.cos(this.phase[i]) * 2,
    };
  }
  private posGrowth(i: number, t: number, drawn: number): Pt {
    const u = ((this.laneU[i] + t * 0.04) % 1) * drawn;
    const p = this.along(this.curve, u);
    const spread = 7 * (1 - u);
    return { x: p.x + Math.sin(this.phase[i]) * spread, y: p.y + Math.cos(this.phase[i] * 1.7) * spread };
  }

  private statePos(state: number, i: number, t: number, drawn: number): Pt {
    switch (state) {
      case 0:
        return this.posScatter(i, t);
      case 1:
        return this.posLane(i, t);
      case 2:
        return this.posLogo(i, t);
      case 3:
        return this.posNet(i, t);
      case 4:
        return this.posGrowth(i, t, drawn);
      default:
        return this.posEdges(i, t);
    }
  }

  /** Segment table: [start, end, fromState, toState]. */
  private segments(): [number, number, number, number][] {
    if (this.mode === "finale") return [
      [0, 0.08, 5, 5],
      [0.08, 0.72, 5, 2],
      [0.72, 1, 2, 2],
    ];
    return [
      [0, 0.06, 0, 0],
      [0.06, 0.2, 0, 1],
      [0.2, 0.36, 1, 2],
      [0.36, 0.5, 2, 2],
      [0.5, 0.64, 2, 3],
      [0.64, 0.7, 3, 3],
      [0.7, 0.84, 3, 4],
      [0.84, 1.01, 4, 4],
    ];
  }

  // ---- Loop ----
  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.draw(performance.now() / 1000);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
  destroy() {
    this.stop();
    this.ro.disconnect();
    this.io.disconnect();
  }

  private draw(t: number) {
    const { ctx, w, h, dpr, n } = this;
    if (!w) return;
    const p = this.progress;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const seg = this.segments().find(([a, b]) => p >= a && p < b) ?? this.segments().at(-1)!;
    const [a, b, from, to] = seg;
    const segP = (p - a) / (b - a);

    // Phase weights for decorative layers
    const hero = this.mode === "hero";
    const laneA = hero ? clamp((p - 0.06) / 0.08) * (1 - clamp((p - 0.26) / 0.1)) : 0;
    const netA = hero ? clamp((p - 0.5) / 0.1) * (1 - clamp((p - 0.74) / 0.08)) : 0;
    const drawn = hero ? clamp((p - 0.7) / 0.14) : 0;
    // Logo particles dim while the real logo is crossfaded in.
    const logoDim = hero
      ? clamp((p - 0.38) / 0.06) * (1 - clamp((p - 0.5) / 0.06))
      : clamp((p - 0.72) / 0.1);

    ctx.lineCap = "round";

    // Lanes
    if (laneA > 0.01) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(255,45,45,${0.25 * laneA})`;
      for (const lane of this.lanes) {
        ctx.beginPath();
        lane.forEach((pt, k) => (k ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
        ctx.stroke();
      }
    }

    // Network
    if (netA > 0.01) {
      ctx.lineWidth = 1;
      for (let k = 0; k < this.edges.length; k++) {
        const [e0, e1] = this.edges[k];
        ctx.strokeStyle = k < 7 ? `rgba(255,45,45,${0.35 * netA})` : `rgba(77,225,255,${0.16 * netA})`;
        ctx.beginPath();
        ctx.moveTo(e0.x, e0.y);
        ctx.lineTo(e1.x, e1.y);
        ctx.stroke();
      }
      // pulses expanding from the hub
      for (let k = 0; k < 3; k++) {
        const r = ((t * 0.5 + k / 3) % 1) * Math.max(this.nodes[0] ? Math.abs(this.nodes[0].y - this.hub.y) : 100, 80) * 1.4;
        ctx.strokeStyle = `rgba(255,45,45,${netA * 0.35 * (1 - r / 400)})`;
        ctx.beginPath();
        ctx.arc(this.hub.x, this.hub.y, Math.max(r, 1), 0, Math.PI * 2);
        ctx.stroke();
      }
      for (const nd of this.nodes) {
        ctx.fillStyle = `rgba(255,45,45,${netA})`;
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255,77,77,${0.4 * netA})`;
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, 10 + Math.sin(t * 3) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Growth curve
    if (drawn > 0.001) {
      const upto = Math.max(1, Math.floor(drawn * (this.curve.length - 1)));
      const g = ctx.createLinearGradient(this.curve[0].x, 0, this.curve.at(-1)!.x, 0);
      g.addColorStop(0, "rgba(255,45,45,0.15)");
      g.addColorStop(1, "rgba(255,77,77,0.95)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(255,45,45,0.8)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      for (let k = 0; k <= upto; k++) {
        const pt = this.curve[k];
        if (k) ctx.lineTo(pt.x, pt.y);
        else ctx.moveTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      const tip = this.along(this.curve, drawn);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,45,45,0.35)";
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particles
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < n; i++) {
      // Staggered per-particle progress makes assembly feel organic.
      const lt = from === to ? 1 : smooth(clamp((segP - this.delay[i] * 0.4) / 0.6));
      const pa = this.statePos(from, i, t, drawn);
      const pb = from === to ? pa : this.statePos(to, i, t, drawn);
      const x = lerp(pa.x, pb.x, lt);
      const y = lerp(pa.y, pb.y, lt);

      const inLogo = (from === 2 || to === 2) && this.samples.length > 0;
      const s = this.samples[this.sampleIdx[i]];
      const wLogo = from === 2 && to === 2 ? 1 : to === 2 ? lt : from === 2 ? 1 - lt : 0;
      const white = inLogo && s && !s.red ? wLogo : 0;
      const col = [
        lerp(RED[0], WHITE[0], white),
        lerp(RED[1], WHITE[1], white),
        lerp(RED[2], WHITE[2], white),
      ];
      let alpha = 0.35 + 0.5 * ((Math.sin(t * 2 + this.phase[i]) + 1) / 2);
      if (from === 0 && to === 0) alpha *= 0.55;
      alpha *= 1 - logoDim * 0.85 * wLogo;
      const sz = this.size[i] * (wLogo > 0.5 ? 1.15 : 1);
      ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${alpha})`;
      ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }
    ctx.globalCompositeOperation = "source-over";
  }
}
