/**
 * "From attention to growth": the brand owner's journey, drawn on one canvas.
 * State is a pure function of `progress` (0..1) plus a clock for ambient motion,
 * so scrubbing back rewinds exactly.
 *
 *   intro  0.00–0.10  a crowded market; one grey dot is you
 *   01     0.10       Positioning:  camera flies in, the crowd parts, you light up
 *   02     0.22       Strategy:     routes draw out to five channels
 *   03     0.34       Content:      content packets travel out, ripples at each channel
 *   04     0.46       Audience:     relevant people leave the crowd and orbit you
 *   05     0.58       Performance:  attention streams back along the routes into you
 *   06     0.70       Reputation:   your audience links up, stars form a halo
 *   07     0.82       Optimisation: a sweep keeps tuning the system
 *   finale 0.92–1.00  your audience becomes a growth curve; you ride its tip
 */

export const CHAPTER_STARTS = [0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 0.82] as const;
export const FINALE_AT = 0.92;

const CHANNELS = [
  { label: "Search", a: -90 },
  { label: "Social", a: -18 },
  { label: "Content", a: 54 },
  { label: "Email", a: 126 },
  { label: "Ads", a: 198 },
];
const RX = 380; // channel ellipse, world units
const RY = 270;

type Pt = { x: number; y: number };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const win = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease3 = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bez(a: Pt, c: Pt, b: Pt, u: number): Pt {
  const v = 1 - u;
  return { x: v * v * a.x + 2 * v * u * c.x + u * u * b.x, y: v * v * a.y + 2 * v * u * c.y + u * u * b.y };
}

export class JourneyScene {
  progress = 0;
  font = "monospace";

  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private raf = 0;
  private running = false;
  private io: IntersectionObserver;

  // camera / layout
  private cx = 0;
  private cy = 0;
  private U = 1;
  private spreadX = 1;
  private spreadY = 1;
  private mobile = false;
  private curve: Pt[] = [];

  // world
  private chan: Pt[] = [];
  private ctrl: Pt[] = [];

  // particles
  private n: number;
  private sx: Float32Array;
  private sy: Float32Array;
  private dep: Float32Array;
  private ph: Float32Array;
  private del: Float32Array;
  private rel: Uint8Array;
  private conv: Uint8Array;
  private oa: Float32Array;
  private or: Float32Array;
  private ch: Uint8Array;
  private nb: Int32Array;
  private rank: Float32Array;
  private jit: Float32Array;
  private posX: Float32Array;
  private posY: Float32Array;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    const small = window.innerWidth < 768;
    this.n = small ? 900 : 1700;
    const n = this.n;
    const r = mulberry(31);
    this.sx = new Float32Array(n);
    this.sy = new Float32Array(n);
    this.dep = new Float32Array(n);
    this.ph = new Float32Array(n);
    this.del = new Float32Array(n);
    this.rel = new Uint8Array(n);
    this.conv = new Uint8Array(n);
    this.oa = new Float32Array(n);
    this.or = new Float32Array(n);
    this.ch = new Uint8Array(n);
    this.nb = new Int32Array(n).fill(-1);
    this.rank = new Float32Array(n);
    this.jit = new Float32Array(n);
    this.posX = new Float32Array(n);
    this.posY = new Float32Array(n);

    let relCount = 0;
    for (let i = 0; i < n; i++) {
      this.sx[i] = r() * 2 - 1;
      this.sy[i] = r() * 2 - 1;
      this.dep[i] = 0.55 + r() * 0.9;
      this.ph[i] = r() * Math.PI * 2;
      this.del[i] = r();
      this.rel[i] = r() < 0.26 ? 1 : 0;
      this.conv[i] = this.rel[i] && r() < 0.42 ? 1 : 0;
      this.oa[i] = r() * Math.PI * 2;
      this.or[i] = 130 + Math.pow(r(), 0.8) * 420;
      this.ch[i] = Math.floor(r() * CHANNELS.length);
      this.jit[i] = r() * 2 - 1;
      if (this.rel[i]) relCount++;
    }
    // Rank audience along the finale curve; nearest-neighbour links for word of mouth.
    const relIdx: number[] = [];
    for (let i = 0; i < n; i++) if (this.rel[i]) relIdx.push(i);
    relIdx.sort((a, b) => this.or[a] - this.or[b]);
    relIdx.forEach((i, k) => (this.rank[i] = k / Math.max(1, relCount - 1)));
    for (const i of relIdx) {
      const xi = Math.cos(this.oa[i]) * this.or[i];
      const yi = Math.sin(this.oa[i]) * this.or[i] * 0.8;
      let best = -1;
      let bd = Infinity;
      for (const j of relIdx) {
        if (j === i) continue;
        const dx = Math.cos(this.oa[j]) * this.or[j] - xi;
        const dy = Math.sin(this.oa[j]) * this.or[j] * 0.8 - yi;
        const d = dx * dx + dy * dy;
        if (d < bd && this.or[j] < this.or[i] + 40) {
          bd = d;
          best = j;
        }
      }
      this.nb[i] = best;
    }

    this.chan = CHANNELS.map((c) => {
      const a = (c.a * Math.PI) / 180;
      return { x: Math.cos(a) * RX, y: Math.sin(a) * RY };
    });
    this.ctrl = this.chan.map((c, j) => {
      const mx = c.x / 2;
      const my = c.y / 2;
      const len = Math.hypot(c.x, c.y);
      const s = j % 2 ? 0.22 : -0.22;
      return { x: mx - (c.y / len) * len * s, y: my + (c.x / len) * len * s };
    });

    this.io = new IntersectionObserver(([e]) => (e.isIntersecting ? this.start() : this.stop()));
    this.io.observe(canvas);
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.w = w;
    this.h = h;
    this.mobile = w < 768;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);

    if (this.mobile) {
      this.cx = w * 0.5;
      this.cy = h * 0.36;
      this.U = Math.max(0.3, Math.min((w * 0.5 - 34) / 400, (h * 0.34 - 30) / 290));
      this.curve = this.makeCurve(w * 0.06, h * 0.58, w * 0.9, h * 0.2);
    } else {
      this.cx = w * 0.64;
      this.cy = h * 0.5;
      this.U = Math.max(0.3, Math.min((w * 0.36 - 50) / 410, (h * 0.5 - 90) / 290));
      this.curve = this.makeCurve(w * 0.42, h * 0.8, w * 0.95, h * 0.17);
    }
    const zMin = 0.3 * 0.55;
    this.spreadX = (Math.max(this.cx, w - this.cx) * 1.1) / (this.U * zMin);
    this.spreadY = (Math.max(this.cy, h - this.cy) * 1.1) / (this.U * zMin);
    this.draw(performance.now() / 1000);
  }

  private makeCurve(x0: number, y0: number, x1: number, y1: number) {
    const pts: Pt[] = [];
    for (let s = 0; s <= 80; s++) {
      const t = s / 80;
      pts.push({ x: lerp(x0, x1, t), y: y0 - (y0 - y1) * Math.pow(t, 2.2) + Math.sin(t * 22) * 6 * (1 - t) });
    }
    return pts;
  }
  private along(path: Pt[], u: number): Pt {
    const f = clamp(u) * (path.length - 1);
    const i = Math.min(path.length - 2, Math.floor(f));
    const t = f - i;
    return { x: lerp(path[i].x, path[i + 1].x, t), y: lerp(path[i].y, path[i + 1].y, t) };
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
  /** Render one frame now (reduced motion). */
  still() {
    this.draw(1.5);
  }

  // ---------------------------------------------------------------- draw
  private draw(t: number) {
    const { ctx, w, h } = this;
    if (!w) return;
    const p = this.progress;
    const S = CHAPTER_STARTS;
    const k = (i: number) => win(p, S[i], S[i] + 0.085);

    const c1 = smooth(k(0));
    const c2 = k(1);
    const c3 = k(2);
    const c4 = k(3);
    const c5 = k(4);
    const c6 = k(5);
    const c7 = k(6);
    const fin = smooth(win(p, FINALE_AT, 0.99));
    const live = 1 - fin;

    // Camera: drift in the crowd, fly in at positioning, slow orbit through the journey.
    const zoom = lerp(lerp(0.3, 0.4, win(p, 0, 0.1)), 1, ease3(k(0))) * lerp(1, 0.86, fin);
    const rot = (p - 0.5) * 0.35 + Math.sin(t * 0.07) * 0.02;
    const cr = Math.cos(rot);
    const sr = Math.sin(rot);
    const Z = this.U * zoom;
    const { cx, cy } = this;
    const proj = (x: number, y: number, d = 1): Pt => ({
      x: cx + (x * cr - y * sr) * Z * d,
      y: cy + (x * sr + y * cr) * Z * d,
    });

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // ---- routes (brand → channels) ----
    const routeA: number[] = [];
    for (let j = 0; j < CHANNELS.length; j++) routeA.push(clamp(c2 * 1.5 - j * 0.12));
    const sweepAng = t * 1.1;
    const routePts = (j: number, u: number) => {
      const q = bez({ x: 0, y: 0 }, this.ctrl[j], this.chan[j], u);
      return proj(q.x, q.y);
    };

    if (c2 > 0 && live > 0.01) {
      ctx.lineCap = "round";
      for (let j = 0; j < CHANNELS.length; j++) {
        const fr = routeA[j];
        if (fr <= 0) continue;
        const ca = Math.atan2(this.chan[j].y, this.chan[j].x) + rot;
        const near = c7 > 0 ? Math.max(0, Math.cos(ca - sweepAng)) ** 6 : 0;
        const a = (0.4 + 0.35 * c5 + 0.25 * near * c7) * live;
        ctx.strokeStyle = `rgba(255,45,45,${a})`;
        ctx.lineWidth = 1.1 + 1.3 * c5 + near * c7 * 1.5;
        ctx.shadowColor = "rgba(255,45,45,0.7)";
        ctx.shadowBlur = 6 + 10 * c5;
        ctx.beginPath();
        const steps = 36;
        for (let s = 0; s <= steps * fr; s++) {
          const pt = routePts(j, s / steps);
          if (s) ctx.lineTo(pt.x, pt.y);
          else ctx.moveTo(pt.x, pt.y);
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    // ---- ripples at channels (content landing in the market) ----
    if (c3 > 0 && live > 0.01) {
      for (let j = 0; j < CHANNELS.length; j++) {
        const c = proj(this.chan[j].x, this.chan[j].y);
        for (let r = 0; r < 3; r++) {
          const f = (t * 0.45 + r / 3 + j * 0.13) % 1;
          ctx.strokeStyle = `rgba(255,77,77,${(1 - f) * 0.35 * c3 * live})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 10 + f * 150 * Z, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // ---- optimisation sweep ----
    if (c7 > 0 && live > 0.01) {
      const R = 540 * Z;
      const a = c7 * live;
      if ("createConicGradient" in ctx) {
        const g = ctx.createConicGradient(sweepAng - 1.1, cx, cy);
        g.addColorStop(0, "rgba(255,45,45,0)");
        g.addColorStop(0.17, `rgba(255,45,45,${0.13 * a})`);
        g.addColorStop(0.175, "rgba(255,45,45,0)");
        g.addColorStop(1, "rgba(255,45,45,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();
      }
      // the loop itself, with a travelling arrowhead
      ctx.strokeStyle = `rgba(255,255,255,${0.14 * a})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 7]);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2 * c7);
      ctx.stroke();
      ctx.setLineDash([]);
      const hx = cx + Math.cos(sweepAng) * R;
      const hy = cy + Math.sin(sweepAng) * R;
      ctx.fillStyle = `rgba(255,77,77,${a})`;
      ctx.beginPath();
      ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255,45,45,${0.6 * a})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, sweepAng - 0.5, sweepAng);
      ctx.stroke();
    }

    // ---- particles ----
    const brandIntro = { x: cx, y: cy };
    const tip = this.curve.length ? this.along(this.curve, 1) : brandIntro;
    const brand = { x: lerp(cx, tip.x, fin), y: lerp(cy, tip.y, fin) };

    // finale trail
    if (fin > 0.001) {
      const upto = Math.max(1, Math.floor(fin * (this.curve.length - 1)));
      const g = ctx.createLinearGradient(this.curve[0].x, 0, tip.x, 0);
      g.addColorStop(0, "rgba(255,45,45,0.05)");
      g.addColorStop(1, "rgba(255,77,77,0.9)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(255,45,45,0.8)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      for (let s = 0; s <= upto; s++) {
        const pt = this.curve[s];
        if (s) ctx.lineTo(pt.x, pt.y);
        else ctx.moveTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    const { posX, posY } = this;

    ctx.globalCompositeOperation = "lighter";
    const R1 = 270 * c1; // cleared space around you
    for (let i = 0; i < this.n; i++) {
      const ph = this.ph[i];
      const d = this.dep[i];
      let bx = this.sx[i] * this.spreadX + Math.sin(t * 0.22 + ph) * 10;
      let by = this.sy[i] * this.spreadY + Math.cos(t * 0.18 + ph * 1.3) * 10;
      if (R1 > 0) {
        const dd = Math.hypot(bx, by) || 1;
        const f = Math.sqrt(dd * dd + R1 * R1) / dd;
        bx *= f;
        by *= f;
      }
      let P = proj(bx, by, d);
      const tw = 0.5 + 0.5 * Math.sin(t * 1.6 + ph);
      let r = 255,
        g = 255,
        b = 255;
      let alpha: number;
      let size = 0.7 + (d - 0.55) * 1.5;

      if (!this.rel[i]) {
        // the rest of the market: grey, recedes as your audience forms
        alpha = (0.1 + 0.3 * ((d - 0.55) / 0.9)) * (0.6 + 0.4 * tw) * (1 - 0.45 * c4) * (1 - 0.6 * fin);
        r = 160;
        g = 160;
        b = 178;
      } else {
        const a4 = smooth(clamp((c4 - this.del[i] * 0.45) / 0.55));
        const ang = this.oa[i] + t * 0.05 * (0.5 + 130 / this.or[i]);
        const T = proj(Math.cos(ang) * this.or[i], Math.sin(ang) * this.or[i] * 0.8);
        P = { x: lerp(P.x, T.x, a4), y: lerp(P.y, T.y, a4) };

        // performance: converters stream to a channel, then down its route into you
        if (this.conv[i] && c5 > 0) {
          const a5 = smooth(clamp((c5 - this.del[i] * 0.35) / 0.65));
          const u = (ph / (Math.PI * 2) + t * 0.16) % 1;
          const j = this.ch[i];
          let Q: Pt;
          if (u < 0.4) {
            const c = proj(this.chan[j].x, this.chan[j].y);
            const v = smooth(u / 0.4);
            Q = { x: lerp(T.x, c.x, v), y: lerp(T.y, c.y, v) };
          } else {
            Q = routePts(j, 1 - (u - 0.4) / 0.6);
          }
          P = { x: lerp(P.x, Q.x, a5), y: lerp(P.y, Q.y, a5) };
        }

        const col = a4 * (0.55 + 0.45 * c5);
        r = lerp(170, 255, a4);
        g = lerp(170, this.conv[i] && c5 > 0.3 ? 120 : 55, col);
        b = lerp(185, this.conv[i] && c5 > 0.3 ? 120 : 55, col);
        alpha = lerp((0.1 + 0.3 * ((d - 0.55) / 0.9)) * (0.6 + 0.4 * tw), 0.55 + 0.4 * tw, a4);
        size = lerp(size, 1.6 + (i % 3) * 0.5, a4);

        // finale: line up along the growth curve
        if (fin > 0) {
          const af = smooth(clamp((fin - this.del[i] * 0.3) / 0.7));
          const u = this.rank[i] * 0.97;
          const c = this.along(this.curve, u);
          const spread = (1 - u) * 26 + 3;
          const C = { x: c.x + this.jit[i] * spread * 0.4, y: c.y + Math.sin(ph) * spread };
          P = { x: lerp(P.x, C.x, af), y: lerp(P.y, C.y, af) };
          g = lerp(g, 60, af);
          b = lerp(b, 60, af);
          r = 255;
        }
      }
      posX[i] = P.x;
      posY[i] = P.y;
      if (alpha < 0.01 || P.x < -10 || P.y < -10 || P.x > w + 10 || P.y > h + 10) continue;
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
      ctx.fillRect(P.x - size / 2, P.y - size / 2, size, size);
    }

    // links appear from the inside out as reputation spreads
    if (c6 > 0 && live > 0.01) {
      ctx.lineWidth = 0.7;
      for (let i = 0; i < this.n; i++) {
        const j = this.nb[i];
        if (j < 0 || !this.rel[i]) continue;
        const thr = (this.or[i] - 130) / 440;
        const a = clamp((c6 * 1.25 - thr) * 4) * 0.28 * live;
        if (a < 0.01) continue;
        ctx.strokeStyle = `rgba(255,90,90,${a})`;
        ctx.beginPath();
        ctx.moveTo(posX[i], posY[i]);
        ctx.lineTo(posX[j], posY[j]);
        ctx.stroke();
      }
    }

    // content packets
    if (c3 > 0 && live > 0.01) {
      const K = 5;
      for (let j = 0; j < CHANNELS.length; j++) {
        for (let q = 0; q < K; q++) {
          const vis = clamp(c3 * K * 1.2 - q) * live;
          if (vis <= 0) continue;
          const u = (q / K + t * (0.22 + 0.2 * c5) + j * 0.07) % 1;
          const pt = routePts(j, u);
          const fade = Math.sin(Math.PI * u);
          ctx.fillStyle = `rgba(255,240,240,${0.9 * vis * fade})`;
          ctx.shadowColor = "rgba(255,45,45,0.9)";
          ctx.shadowBlur = 10;
          const pw = 7;
          const phh = 5;
          ctx.fillRect(pt.x - pw / 2, pt.y - phh / 2, pw, phh);
        }
      }
      ctx.shadowBlur = 0;
    }
    ctx.globalCompositeOperation = "source-over";

    // channel nodes
    if (c2 > 0 && live > 0.01) {
      ctx.font = `500 ${this.mobile ? 9 : 11}px ${this.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let j = 0; j < CHANNELS.length; j++) {
        const pop = clamp((routeA[j] - 0.85) / 0.15);
        if (pop <= 0) continue;
        const c = proj(this.chan[j].x, this.chan[j].y);
        const s = smooth(pop) * live;
        const rr = (this.mobile ? 7 : 10) * (0.6 + 0.4 * s) * (1 + 0.15 * c5);
        ctx.fillStyle = `rgba(14,14,20,${s})`;
        ctx.strokeStyle = `rgba(255,45,45,${0.85 * s})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = `rgba(255,45,45,${s})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, rr * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(242,242,245,${0.85 * s})`;
        ctx.fillText(CHANNELS[j].label.toUpperCase(), c.x, c.y + rr + 7);
      }
    }

    // ---- you ----
    this.drawBrand(t, brand, { c1, c3, c5, c6, c7, fin, p });
  }

  private drawBrand(
    t: number,
    B: Pt,
    s: { c1: number; c3: number; c5: number; c6: number; c7: number; fin: number; p: number },
  ) {
    const { ctx } = this;
    const { c1, c5, c6, c7, fin, p } = s;
    const live = 1 - fin;
    const base = this.mobile ? 11 : 15;
    const rB = lerp(2.4, base, c1) * (1 + 0.12 * c5 + 0.12 * c6 + 0.12 * c7) * lerp(1, 0.6, fin);

    // glow
    if (c1 > 0) {
      const gr = rB * (5 + 2 * c7 + Math.sin(t * 2) * 0.4);
      const g = ctx.createRadialGradient(B.x, B.y, 0, B.x, B.y, gr);
      g.addColorStop(0, `rgba(255,45,45,${0.35 * c1})`);
      g.addColorStop(1, "rgba(255,45,45,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(B.x, B.y, gr, 0, Math.PI * 2);
      ctx.fill();
    }

    // arrivals: a soft pulse each time attention lands
    if (c5 > 0 && live > 0.01) {
      for (let k = 0; k < 3; k++) {
        const f = (t * 0.9 + k / 3) % 1;
        ctx.strokeStyle = `rgba(255,77,77,${(1 - f) * 0.5 * c5 * live})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(B.x, B.y, rB + f * rB * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // core: grey → red
    const r = lerp(150, 255, c1);
    const g = lerp(150, 45, c1);
    ctx.fillStyle = `rgb(${r | 0},${g | 0},${g | 0})`;
    ctx.beginPath();
    ctx.arc(B.x, B.y, rB, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${0.9 * c1})`;
    ctx.beginPath();
    ctx.arc(B.x, B.y, rB * 0.32, 0, Math.PI * 2);
    ctx.fill();

    // positioning ring draws around you
    if (c1 > 0 && live > 0.01) {
      ctx.strokeStyle = `rgba(255,255,255,${0.55 * live})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(B.x, B.y, rB * 1.8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * c1);
      ctx.stroke();
    }

    // reputation halo: five stars
    if (c6 > 0 && live > 0.01) {
      const R = rB * 3.4;
      for (let k = 0; k < 5; k++) {
        const a = clamp(c6 * 6 - k) * live;
        if (a <= 0) continue;
        const ang = -Math.PI / 2 + (k / 5) * Math.PI * 2 + t * 0.25;
        this.star(B.x + Math.cos(ang) * R, B.y + Math.sin(ang) * R, (this.mobile ? 4 : 5) * (0.5 + 0.5 * a), a);
      }
    }

    // labels
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `500 ${this.mobile ? 9 : 10.5}px ${this.font}`;
    const intro = (1 - win(p, 0.085, 0.12)) * win(p, 0.0, 0.02);
    if (intro > 0.01) {
      // "you are here" — the only bright thing in the noise
      const pr = (t * 0.7) % 1;
      ctx.strokeStyle = `rgba(255,45,45,${(1 - pr) * 0.8 * intro})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(B.x, B.y, 4 + pr * 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(242,242,245,${0.6 * intro})`;
      ctx.beginPath();
      ctx.moveTo(B.x + 6, B.y - 6);
      ctx.lineTo(B.x + 34, B.y - 34);
      ctx.lineTo(B.x + 54, B.y - 34);
      ctx.stroke();
      ctx.fillStyle = `rgba(242,242,245,${0.95 * intro})`;
      ctx.fillText("YOU ARE HERE", B.x + 60, B.y - 34);
    }
    const lab = c1 * live;
    if (lab > 0.01) {
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = `rgba(242,242,245,${0.9 * lab})`;
      ctx.fillText("YOUR BRAND", B.x, B.y + rB * 2.1 + 6);
    }
    if (fin > 0.5) {
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = `rgba(242,242,245,${(fin - 0.5) * 2})`;
      ctx.fillText("YOU", B.x - rB - 8, B.y - rB - 4);
    }
  }

  private star(x: number, y: number, r: number, a: number) {
    const { ctx } = this;
    ctx.fillStyle = `rgba(255,77,77,${a})`;
    ctx.shadowColor = "rgba(255,45,45,0.9)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const rr = k % 2 ? r * 0.45 : r;
      const ang = -Math.PI / 2 + (k * Math.PI) / 5;
      const px = x + Math.cos(ang) * rr;
      const py = y + Math.sin(ang) * rr;
      if (k) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
