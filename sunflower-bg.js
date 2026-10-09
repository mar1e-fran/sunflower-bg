/*
 * <sunflower-bg> — animated dot-matrix sunflowers for a page or hero background.
 *
 * Usage:
 *   <script src="sunflower-bg.js" defer></script>
 *   <section class="hero" style="position:relative">
 *     <sunflower-bg></sunflower-bg>
 *     <h1>Your heading</h1>
 *   </section>
 *
 * The element fills its nearest positioned ancestor (position:absolute; inset:0),
 * sits behind content (z-index:0, pointer-events:none) and has a transparent background.
 *
 * Attributes (all optional):
 *   color       dot colour; drawn in five tones of it    default "#fff"
 *   accent      optional colour for sepals, leaves and drifting patches
 *               (by default they use the darker tones of `color`)
 *   pitch       grid spacing in px (dot size follows) default 6
 *   speed       animation speed, 0 = still        default 1
 *   layout      "auto" | "sides" | "stack"       default "auto" (sides on wide screens, stack on tall)
 *
 * Methods:
 *   el.reseed()  grow a new pair of sunflowers
 *
 * Respects prefers-reduced-motion and pauses while off screen or in a hidden tab.
 */
(() => {
  const TAU = Math.PI * 2;

  const rng = s => () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const fract = x => x - Math.floor(x);

  function createRenderer(cv) {
    const g = cv.getContext('2d');
    let seed = 1, COLS = 0, ROWS = 0, ASPECT = 1, dpr = 1, P = null;

    const hash = (a, b) => { const h = Math.sin((a + seed) * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };
    function vnoise(x, y) {
      const xi = Math.floor(x), yi = Math.floor(y), s = t => t * t * (3 - 2 * t);
      const u = s(x - xi), v = s(y - yi);
      const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    const fbm = (x, y) => 0.5 * vnoise(x, y) + 0.3 * vnoise(x * 2.1, y * 2.1) + 0.2 * vnoise(x * 4.3, y * 4.3);

    // ---- flowers (world units = grid cells) ----
    function makeFlower(r, x, y, R, stemEnd) {
      const side = r() < 0.5 ? -1 : 1;
      const H = { x, y, R, rot: (r() - 0.5) * 0.7, q: 0.66 + r() * 0.2 };
      const down = Math.atan2(Math.cos(H.rot) / H.q, Math.sin(H.rot));
      const ring = (n, len, wid, base, off = 0) =>
        Array.from({ length: n }, (_, i) => {
          const ang = (i + off) * TAU / n + (r() - 0.5) * 0.16;
          const hang = Math.max(0, Math.cos(wrap(ang - down)));
          return {
            ang, base, ph: r() * TAU,
            len: R * (len[0] + r() * len[1]) * (1 + 0.35 * hang),
            wid: R * (wid[0] + r() * wid[1]),
            bend: (r() - 0.5) * 0.5,
            grav: (0.05 + 0.6 * hang) * (0.6 + 0.4 * r()),
            fold: r() < 0.22,
          };
        });
      const back = side < 0 ? Math.PI : 0;
      const f = {
        H, down, side, spin: r() * TAU,
        petals: [ring(16, [1.0, 0.4], [0.26, 0.05], 0.6), ring(13, [0.85, 0.4], [0.28, 0.05], 0.92, 0.5)],
        bracts: Array.from({ length: 6 + Math.floor(r() * 5) }, () => ({
          phi: back + (r() - 0.5) * 2.4, out: (r() - 0.5) * 0.9,
          L: R * (0.5 + r() * 0.5), W: R * (0.17 + r() * 0.1), droop: (r() - 0.5) * 0.7,
        })),
        stemEnd, stemBow: (r() - 0.5) * R * 2,
        leafAt: 0.35 + r() * 0.35, leafSide: r() < 0.5 ? -1 : 1, leafL: R * (1.4 + r() * 0.8),
      };
      f.maxLen = Math.max(...f.petals.flat().map(p => p.len));
      return f;
    }

    function reseed(layout = 'auto', newSeed = true) {
      if (newSeed) seed = (Math.random() * 1e6) | 0;
      const r = rng(seed);
      const W = COLS, Hh = ROWS * ASPECT, S = Math.min(W, Hh);
      const wide = layout === 'sides' || (layout === 'auto' && W > Hh * 1.1);
      const flowers = wide
        ? [ // small one cropped top-left, big one bottom-right: the centre stays clear for text
            makeFlower(r, W * (0.06 + r() * 0.08), Hh * (0.06 + r() * 0.1), S * (0.15 + r() * 0.03), [-S * 0.3, Hh * 0.75]),
            makeFlower(r, W * (0.76 + r() * 0.08), Hh * (0.55 + r() * 0.12), S * (0.24 + r() * 0.04), [W * (0.8 + r() * 0.2), Hh + 10]),
          ]
        : [ // tall screens: one cropped at the top, one at the bottom
            makeFlower(r, W * (0.3 + r() * 0.3), Hh * (0.1 + r() * 0.04), W * (0.15 + r() * 0.03), [r() < 0.5 ? -10 : W + 10, -10]),
            makeFlower(r, W * (0.45 + r() * 0.15), Hh * (0.78 + r() * 0.05), W * (0.2 + r() * 0.03), [W * (0.6 + r() * 0.3), Hh + 10]),
          ];
      P = { flowers, born: newSeed || !P ? performance.now() / 1000 : P.born };   // resizing never replays the dot-in
    }

    const toLocal = (x, y, H) => {
      const dx = x - H.x, dy = y - H.y, cr = Math.cos(H.rot), sr = Math.sin(H.rot);
      return [dx * cr + dy * sr, (-dx * sr + dy * cr) / H.q];
    };
    const toWorld = (lx, ly, H) => {
      const cr = Math.cos(H.rot), sr = Math.sin(H.rot), y = ly * H.q;
      return [H.x + lx * cr - y * sr, H.y + lx * sr + y * cr];
    };

    function blade(x, y, bx, by, ang, len, W, droop, body, vein) {
      const dx = x - bx, dy = y - by, ca = Math.cos(ang), sa = Math.sin(ang);
      const a = (dx * ca + dy * sa) / len;
      if (a < 0 || a > 1) return 0;
      const lat = -dx * sa + dy * ca - droop * a * a * len;
      const hw = W * Math.pow(Math.sin(Math.PI * Math.pow(a, 0.55)), 0.9) * (1 + 0.06 * Math.sin(a * 40));
      if (Math.abs(lat) >= hw) return 0;
      const e = Math.abs(lat) / hw;
      if (e > 0.88) return 0.04;                                         // dark outline gap
      if (Math.abs(lat) < 0.7 && a < 0.95) return 0.08;                  // dark midrib
      if (fract(a * 5 - e * 0.9) < 0.1 && a < 0.9) return 0.2;           // side veins
      return body - 0.15 * e;
    }

    // per-frame geometry, plus a bounding box so most cells skip the flower entirely
    function prepare(f, t, i) {
      const H = { ...f.H, x: f.H.x + Math.sin(t * 0.4 + i * 2) * 0.8, rot: f.H.rot + Math.sin(t * 0.3 + i) * 0.015 };
      const [sx, sy] = toWorld(f.side * H.R * 0.95, 0, H);
      const cx = (sx + f.stemEnd[0]) / 2 + f.stemBow, cy = (sy + f.stemEnd[1]) / 2;
      const stem = Array.from({ length: 60 }, (_, k) => {
        const u = k / 59;
        return [(1 - u) ** 2 * sx + 2 * (1 - u) * u * cx + u * u * f.stemEnd[0],
                (1 - u) ** 2 * sy + 2 * (1 - u) * u * cy + u * u * f.stemEnd[1]];
      });
      const li = Math.round(f.leafAt * 58), lp = stem[li], lq = stem[li + 1];
      const leaf = [lp[0], lp[1], Math.atan2(lq[1] - lp[1], lq[0] - lp[0]) + f.leafSide * 1.1 + Math.sin(t * 0.6) * 0.03,
                    f.leafL, f.leafL * 0.32, f.leafSide * 0.3];
      const bracts = f.bracts.map(b => {
        const [bx, by] = toWorld(Math.cos(b.phi) * H.R * 0.9, Math.sin(b.phi) * H.R * 0.9, H);
        const [ox, oy] = toWorld(Math.cos(b.phi) * 2, Math.sin(b.phi) * 2, H);
        return [bx, by, Math.atan2(oy - H.y, ox - H.x) + b.out, b.L, b.W, b.droop];
      });
      const reach = H.R + f.maxLen * 1.6;
      let x0 = H.x - reach, x1 = H.x + reach, y0 = H.y - reach, y1 = H.y + reach;
      for (const [px, py] of stem) { x0 = Math.min(x0, px - 3); x1 = Math.max(x1, px + 3); y0 = Math.min(y0, py - 3); y1 = Math.max(y1, py + 3); }
      x0 = Math.min(x0, lp[0] - f.leafL); x1 = Math.max(x1, lp[0] + f.leafL);
      y0 = Math.min(y0, lp[1] - f.leafL); y1 = Math.max(y1, lp[1] + f.leafL);
      return { f, H, stem, leaf, bracts, box: [x0, x1, y0, y1], reach };
    }

    let tint = false;   // set by flowerVal: whether the topmost part hit is a tinted one
    function flowerVal(x, y, d, t) {
      const { f, H } = d;
      let L = 0, d2 = 1e9;
      tint = false;
      for (const [px, py] of d.stem) d2 = Math.min(d2, (x - px) ** 2 + (y - py) ** 2);
      if (d2 < 5) L = d2 > 3 ? 0.04 : 0.85;
      const lv = blade(x, y, ...d.leaf, 0.7, 0);
      if (lv) { L = lv; tint = true; }

      const [lx, ly] = toLocal(x, y, H);
      const rad = Math.hypot(lx, ly), th = Math.atan2(ly, lx);
      if (rad < H.R) {
        tint = false;
        const rr = Math.max(rad / H.R, 0.03), a = th + f.spin + t * 0.02;
        const v = (Math.cos(21 * a + 30 * Math.log(rr)) + Math.cos(34 * a - 24 * Math.log(rr))) / 2;
        if (rr > 0.9) L = Math.cos(th) * f.side > 0.2 ? 0.6 : 0.05;
        else if (rr < 0.14) L = 0.3;
        else L = v > 0.25 ? 1 : v > -0.3 ? 0.35 : 0.08;
      } else if (rad < d.reach) {
        let pl = 0;
        for (const layer of f.petals)
          for (const p of layer) {
            const len = p.len * (1 + 0.03 * Math.sin(t * 1.1 + p.ph));
            const s = rad - H.R * 0.92;
            if (s < 0 || s > len) continue;
            const u = s / len;
            const axis = p.ang + p.bend * u * u + wrap(f.down - p.ang) * p.grav * u * u;
            const lat = wrap(th - axis) * rad;
            const hw = p.wid * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.6)), 0.8);
            if (Math.abs(lat) >= hw) continue;
            const e = Math.abs(lat) / hw;
            if (e > 0.84) pl = 0.03;                                       // dark seam between petals
            else if (p.fold) pl = lat > 0 ? 0.9 : 0.4;
            else if (Math.abs(e - 0.4) < 0.05 && u < 0.8) pl = 0.45;      // groove
            else pl = p.base * (0.72 + 0.2 * (1 - u));
          }
        if (pl) { L = pl; tint = false; }
      }
      for (const b of d.bracts) { const bv = blade(x, y, ...b, 0.8, 0); if (bv) { L = bv; tint = true; } }
      return L;
    }

    const TONES = [1, 0.74, 0.52, 0.34, 0.2];
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);

    function frame(t, ink, hot) {
      g.clearRect(0, 0, cv.width, cv.height);
      if (!P) return;
      const prepared = P.flowers.map((f, i) => prepare(f, t, i));
      const reveal = Math.min(1, (t - P.born) / 1.4);       // dots sparkle in after a reseed
      const step = pitch * dpr, dot = Math.max(1, Math.round(step * 0.42));
      const off = (step - dot) / 2;
      const tones = TONES.map(() => new Path2D());   // 0 = brightest … 4 = faintest
      const grid = new Int8Array(COLS * ROWS).fill(-1);

      for (let r = 0; r < ROWS; r++) {
        const y = r + 0.5;
        const rows = prepared.filter(d => y >= d.box[2] && y <= d.box[3]);
        for (let c = 0; c < COLS; c++) {
          if (hash(c, r) > reveal) continue;
          const x = c + 0.5 + (fbm(c * 0.06, r * 0.06 + t * 0.03) - 0.5) * 0.8;
          let v = 0, tinted = false;
          for (const d of rows) {
            if (x < d.box[0] || x > d.box[1]) continue;
            const fv = flowerVal(x, y, d, t);
            if (fv > v) { v = fv; tinted = tint; }
          }
          if (v > 0) {
            v = Math.min(1, v);
            // drifting blotches of colour over the petals, like a misregistered print
            if (!tinted && fbm(c * 0.035 + 31, r * 0.035 + t * 0.01) > 0.66) tinted = true;
          }
          if (v < 0.12 || v <= BAYER[(r & 3) * 4 + (c & 3)]) continue;
          // tone: brightness sets the base, tinted parts sit two steps darker,
          // and slow noise adds a little shading
          let k = (v > 0.85 ? 0 : v > 0.55 ? 1 : 2) + (tinted ? 2 : 0);
          if (fbm(c * 0.08 + 90, r * 0.08 + t * 0.02) > 0.62) k++;
          grid[r * COLS + c] = Math.min(4, k);
        }
      }
      // drop lonely dots: anything with fewer than two lit neighbours
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          const k = grid[r * COLS + c];
          if (k < 0) continue;
          let n = 0;
          for (let j = -1; j <= 1 && n < 2; j++)
            for (let i = -1; i <= 1; i++) {
              if (!i && !j) continue;
              const rr = r + j, cc = c + i;
              if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && grid[rr * COLS + cc] >= 0) n++;
            }
          if (n >= 2) tones[k].rect(c * step + off, r * step + off, dot, dot);
        }
      tones.forEach((path, k) => {
        g.globalAlpha = TONES[k];
        g.fillStyle = hot && k >= 3 ? hot : ink;
        g.fill(path);
      });
      g.globalAlpha = 1;
    }

    let pitch = 6;
    function fit(w, h, px) {
      dpr = Math.min(2, devicePixelRatio || 1);
      pitch = px;
      ASPECT = 1;                       // square cells
      COLS = Math.ceil(w / pitch); ROWS = Math.ceil(h / pitch);
      cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(h * dpr);
    }

    return { fit, reseed, frame, get born() { return P ? P.born : 0; } };
  }

  class SunflowerBg extends HTMLElement {
    static observedAttributes = ['color', 'accent', 'pitch', 'speed', 'layout'];

    connectedCallback() {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' }).innerHTML = `
          <style>
            :host { position:absolute; inset:0; display:block; overflow:hidden; pointer-events:none; z-index:0; }
            canvas { position:absolute; inset:0; width:100%; height:100%; display:block; }
          </style>
          <canvas aria-hidden="true"></canvas>`;
      }
      this.r = createRenderer(this.shadowRoot.querySelector('canvas'));
      this.still = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.visible = true;
      this.size = [0, 0];

      this.ro = new ResizeObserver(([e]) => {
        const { width, height } = e.contentRect;
        if (!width || !height) return;
        const first = !this.size[0];
        this.size = [width, height];
        this.r.fit(width, height, this.pitch);
        this.r.reseed(this.layout, first);   // same flowers, re-laid-out for the new size
        if (!first) this.drawNow();
        this.kick();
      });
      this.ro.observe(this);
      this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this.kick(); });
      this.io.observe(this);
      this.onVis = () => this.kick();
      document.addEventListener('visibilitychange', this.onVis);
    }

    disconnectedCallback() {
      this.ro?.disconnect(); this.io?.disconnect();
      document.removeEventListener('visibilitychange', this.onVis);
      cancelAnimationFrame(this.raf); this.raf = 0;
    }

    attributeChangedCallback() {
      if (!this.r || !this.size[0]) return;
      this.r.fit(this.size[0], this.size[1], this.pitch);
      this.r.reseed(this.layout, false);
      this.drawNow(); this.kick();
    }

    get pitch() { return Math.max(3, parseFloat(this.getAttribute('pitch')) || 6); }
    get speed() { const s = parseFloat(this.getAttribute('speed')); return this.still ? 0 : (isNaN(s) ? 1 : s); }
    get layout() { return this.getAttribute('layout') || 'auto'; }
    get ink() { return this.getAttribute('color') || '#fff'; }
    get hot() { return this.getAttribute('accent'); }

    reseed() { if (!this.r) return; this.r.reseed(this.layout, true); this.kick(); }

    drawNow() { this.r.frame(this.clock(), this.ink, this.hot); }
    clock() {
      // animation time runs at `speed`, but the reveal after a reseed always plays at normal speed
      const now = performance.now() / 1000, born = this.r.born;
      return born + (now - born < 1.5 ? now - born : 1.5 + (now - born - 1.5) * this.speed);
    }

    kick() {
      if (this.raf) return;
      let last = 0;
      const loop = ms => {
        this.raf = 0;
        if (!this.visible || document.hidden) return;
        const revealing = performance.now() / 1000 - this.r.born < 1.6;
        if (ms - last > 100 || revealing) { this.drawNow(); last = ms; }
        if (this.speed > 0 || revealing) this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }
  }

  if (!customElements.get('sunflower-bg')) customElements.define('sunflower-bg', SunflowerBg);
})();
