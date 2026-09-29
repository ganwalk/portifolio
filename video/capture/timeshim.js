// Relógio virtual injetado em todo frame da página (inclusive iframes) antes
// de qualquer script do site. Com ele, o tempo só anda quando o capturador
// manda (`__vt.step(ms)`), então cada quadro gravado é o estado exato do site
// naquele instante, não importa quanto o screenshot demorou.
//
// Cobre as quatro fontes de movimento do site:
// · requestAnimationFrame e performance.now (Framer Motion, Lenis, canvas,
//   WebGL: HeroTitleGL, ParticleTextCanvas, InteractiveGridImage...);
// · setTimeout/setInterval (relógio do retrato, SiteLoader, roleta);
// · animações CSS e Web Animations API (StripeCurtain, grades da Intranet e
//   das Landing Pages, grão da hero, letreiro de marcas), pausadas e
//   posicionadas à mão a cada passo;
// · <video>, que nunca toca de verdade: cada passo busca o quadro certo.
(() => {
  if (window.__vt) return;
  const realDateNow = Date.now.bind(Date);
  const realST = window.setTimeout.bind(window);
  const RealDate = Date;
  const epoch = realDateNow();
  let vt = 0;

  performance.now = () => vt;
  Date.now = () => epoch + vt;
  // new Date() sem argumentos também segue o relógio virtual.
  window.Date = new Proxy(RealDate, {
    construct(target, args) {
      return args.length ? new target(...args) : new target(epoch + vt);
    },
    apply() {
      return new RealDate(epoch + vt).toString();
    },
  });

  let rafQueue = new Map();
  let rafId = 1;
  window.requestAnimationFrame = (cb) => {
    const id = rafId++;
    rafQueue.set(id, cb);
    return id;
  };
  window.cancelAnimationFrame = (id) => rafQueue.delete(id);

  const timers = new Map();
  let timerId = 1;
  window.setTimeout = (fn, ms, ...args) => {
    const id = timerId++;
    timers.set(id, { fn, at: vt + Math.max(0, Number(ms) || 0), args });
    return id;
  };
  window.setInterval = (fn, ms, ...args) => {
    const id = timerId++;
    const every = Math.max(1, Number(ms) || 0);
    timers.set(id, { fn, at: vt + every, args, every });
    return id;
  };
  window.clearTimeout = window.clearInterval = (id) => timers.delete(id);

  // Vídeo: `play()` só marca a intenção; o quadro é buscado a cada passo.
  const proto = HTMLMediaElement.prototype;
  const realPlay = proto.play;
  const realPause = proto.pause;
  const pausedDesc = Object.getOwnPropertyDescriptor(proto, "paused");
  const playing = new Set();
  proto.play = function () {
    if (!this.__vbase && this.__vbase !== 0) this.__vbase = vt - (this.currentTime || 0) * 1000;
    this.__vplay = true;
    playing.add(this);
    realPause.call(this);
    this.dispatchEvent(new Event("play"));
    this.dispatchEvent(new Event("playing"));
    return Promise.resolve();
  };
  proto.pause = function () {
    if (this.__vplay) {
      this.__vplay = false;
      this.__vbase = undefined;
      playing.delete(this);
    }
    realPause.call(this);
  };
  Object.defineProperty(proto, "paused", {
    configurable: true,
    get() {
      return this.__vplay ? false : pausedDesc.get.call(this);
    },
  });
  void realPlay;

  function run(fn, args) {
    try {
      if (typeof fn === "function") fn(...args);
      else if (typeof fn === "string") (0, eval)(fn);
    } catch (err) {
      console.error(err);
    }
  }

  const animBase = new WeakMap();
  const finished = new WeakSet();
  function syncAnimations() {
    let list = [];
    try {
      list = document.getAnimations();
    } catch {
      return;
    }
    for (const anim of list) {
      if (!animBase.has(anim)) {
        animBase.set(anim, vt - (Number(anim.currentTime) || 0));
        try {
          anim.pause();
        } catch {}
      }
      if (finished.has(anim)) continue;
      const local = vt - animBase.get(anim);
      try {
        // Pausada, uma animação nunca "termina" sozinha, e quem espera o
        // `finished` dela (a cortina de réguas, por exemplo) ficaria preso.
        const end = anim.effect && anim.effect.getComputedTiming().endTime;
        if (isFinite(end) && local >= end) {
          finished.add(anim);
          anim.finish();
        } else {
          anim.currentTime = local;
        }
      } catch {}
    }
  }

  async function syncVideos() {
    // Autoplay nativo também entra no relógio.
    for (const el of document.querySelectorAll("video")) {
      if (!el.__vplay && pausedDesc.get.call(el) === false) el.play();
      if (!el.__vplay && el.autoplay && !el.__vseen && el.readyState >= 1) {
        el.__vseen = true;
        el.play();
      }
    }
    const waits = [];
    for (const el of playing) {
      if (!el.isConnected || el.readyState < 1 || !isFinite(el.duration) || !el.duration) continue;
      let t = (vt - el.__vbase) / 1000;
      t = el.loop ? t % el.duration : Math.min(t, el.duration - 0.001);
      if (Math.abs(el.currentTime - t) < 0.0005 && el.readyState >= 2) continue;
      waits.push(
        new Promise((resolve) => {
          const done = () => {
            el.removeEventListener("seeked", done);
            resolve();
          };
          el.addEventListener("seeked", done);
          el.currentTime = t;
          setRealTimeout(done, 1500);
        }),
      );
      if (el.loop === false && t >= el.duration - 0.002) el.dispatchEvent(new Event("ended"));
    }
    await Promise.all(waits);
  }

  // Timeout de segurança pra busca de vídeo: esse precisa ser o relógio real.
  const setRealTimeout = (fn, ms) => realST(fn, ms);

  window.__vt = {
    get now() {
      return vt;
    },
    async step(dt) {
      const target = vt + dt;
      for (;;) {
        let next = null;
        let nextId = null;
        for (const [id, timer] of timers) {
          if (timer.at <= target && (!next || timer.at < next.at)) {
            next = timer;
            nextId = id;
          }
        }
        if (!next) break;
        vt = Math.max(vt, next.at);
        if (next.every) next.at += next.every;
        else timers.delete(nextId);
        run(next.fn, next.args);
        await null;
      }
      vt = target;
      const queue = rafQueue;
      rafQueue = new Map();
      for (const cb of queue.values()) run(cb, [vt]);
      await null;
      syncAnimations();
      await syncVideos();
    },
  };
})();
