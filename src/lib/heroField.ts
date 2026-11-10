/**
 * Hero particle field. Its state is a pure function of
 * `progress` (0..1) so scrubbing back rewinds it exactly.
 *
 *   0.00–0.24  dust drifts, then converges onto the logo (sampled from its pixels)
 *   0.24–0.32  particles dim as the vector logo takes over
 *   0.40–0.58  warp: streaks fly out of the A mark's dot while the camera dives in
 *   0.62–1.00  faint ambient dust returns behind the tagline
 */
import { loadLogoSamples } from "./logoSamples";

type Rect = { x: number; y: number; w: number; h: number };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const win = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class HeroField {
  progress = 0;

  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private n: number;
  private raf = 0;
  private running = false;
  private io: IntersectionObserver;

  private logo: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private eye = { x: 0, y: 0 };
  private samples: { x: number; y: number; red: boolean }[] = [];

  private sx: Float32Array;
  private sy: Float32Array;
  private ph: Float32Array;
  private dl: Float32Array;
  private sz: Float32Array;
  private ang: Float32Array;
  private r0: Float32Array;
  private idx: Uint32Array;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.n = window.innerWidth < 768 ? 800 : 1700;
    const r = mulberry(23);
    const n = this.n;
    this.sx = new Float32Array(n);
    this.sy = new Float32Array(n);
    this.ph = new Float32Array(n);
    this.dl = new Float32Array(n);
    this.sz = new Float32Array(n);
    this.ang = new Float32Array(n);
    this.r0 = new Float32Array(n);
    this.idx = new Uint32Array(n);
    for (let i = 0; i < n; i++) {
      this.sx[i] = r();
      this.sy[i] = r();
      this.ph[i] = r() * Math.PI * 2;
      this.dl[i] = r();
      this.sz[i] = 0.8 + r() * 1.5;
      this.ang[i] = r() * Math.PI * 2;
      this.r0[i] = 0.02 + Math.pow(r(), 1.6);
    }
    this.io = new IntersectionObserver(([e]) => (e.isIntersecting ? this.start() : this.stop()));
    this.io.observe(canvas);
    loadLogoSamples().then((s) => {
      this.samples = s;
      const order = s.map((_, i) => i);
      const rr = mulberry(5);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rr() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      for (let i = 0; i < this.n; i++) this.idx[i] = order[i % Math.max(1, order.length)];
    });
  }

  setLayout(w: number, h: number, logo: Rect, eye: { x: number; y: number }) {
    this.w = w;
    this.h = h;
    this.logo = logo;
    this.eye = eye;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.draw(performance.now() / 1000);
  }

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
    this.io.disconnect();
  }

  private draw(t: number) {
    const { ctx, w, h, n } = this;
    if (!w) return;
    const p = this.progress;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";

    const gather = p < 0.36;
    const fadeLogo = 1 - win(p, 0.24, 0.32);
    const warp = win(p, 0.4, 0.58);
    const warpA = Math.sin(Math.PI * warp);
    const after = win(p, 0.62, 0.72);
    const diag = Math.hypot(w, h);
    const hasLogo = this.samples.length > 0;

    for (let i = 0; i < n; i++) {
      const ph = this.ph[i];
      const dx = this.sx[i] * w + Math.sin(t * 0.3 + ph) * 16;
      const dy = this.sy[i] * h + Math.cos(t * 0.24 + ph * 1.3) * 16;
      const tw = 0.5 + 0.5 * Math.sin(t * 1.8 + ph);

      if (gather) {
        // Converge: staggered per particle so the logo "condenses" rather than snaps.
        const lt = hasLogo ? smooth(win(p, 0.02 + this.dl[i] * 0.09, 0.13 + this.dl[i] * 0.09)) : 0;
        const s = this.samples[this.idx[i]];
        let x = dx;
        let y = dy;
        let red = true;
        if (s && lt > 0) {
          const j = Math.sin(t * 2 + ph) * 0.6;
          // Curl in on the way: a slight orbit around the eye.
          const tx = this.logo.x + s.x * this.logo.w + j;
          const ty = this.logo.y + s.y * this.logo.h + j;
          const swirl = (1 - lt) * 0.9;
          const ox = x - this.eye.x;
          const oy = y - this.eye.y;
          const c = Math.cos(swirl);
          const sn = Math.sin(swirl);
          x = lerp(this.eye.x + ox * c - oy * sn, tx, lt);
          y = lerp(this.eye.y + ox * sn + oy * c, ty, lt);
          red = s.red || lt < 0.6;
        }
        const a = (0.18 + 0.32 * tw) * (1 - lt) + (0.55 + 0.35 * tw) * lt;
        const alpha = a * (lt > 0 ? fadeLogo : 1) * (0.5 + 0.5 * fadeLogo);
        if (alpha < 0.01) continue;
        ctx.fillStyle = red ? `rgba(0,0,0,${alpha})` : `rgba(70,70,70,${alpha})`;
        const z = this.sz[i] * (lt > 0.9 ? 1.1 : 1);
        ctx.fillRect(x - z / 2, y - z / 2, z, z);
        continue;
      }

      if (warpA > 0.01) {
        // Hyperspace: radial streaks accelerating out of the eye.
        const a = this.ang[i];
        const base = this.r0[i] * diag * 0.6;
        const r = base * (1 + Math.pow(warp, 2.2) * 9);
        const len = (8 + 160 * Math.pow(warp, 1.6)) * (0.4 + this.r0[i]);
        const cx = Math.cos(a);
        const cy = Math.sin(a);
        const x1 = this.eye.x + cx * r;
        const y1 = this.eye.y + cy * r;
        const al = warpA * (0.25 + 0.6 * this.r0[i]);
        ctx.strokeStyle = i % 3 ? `rgba(0,0,0,${al})` : `rgba(150,150,150,${al})`;
        ctx.lineWidth = this.sz[i] * 0.8;
        ctx.beginPath();
        ctx.moveTo(x1 - cx * len, y1 - cy * len);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        continue;
      }

      if (after > 0.01 && i % 2 === 0) {
        const alpha = after * (0.08 + 0.22 * tw);
        ctx.fillStyle = i % 4 ? `rgba(0,0,0,${alpha})` : `rgba(150,150,150,${alpha})`;
        const z = this.sz[i] * 0.9;
        ctx.fillRect(dx - z / 2, dy - z / 2, z, z);
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }
}
