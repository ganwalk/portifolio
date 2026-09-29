// Filma o site de verdade, com relógio virtual, em tomadas que o reel monta
// depois (ver composition.js). Cada tomada vira uma sequência de JPEG a 30 fps
// em video/.cache/live/<formato>/<tomada>/, mais um cursor.json com a posição
// e o estado do mouse em cada quadro (o cursor do site é CSS e não aparece em
// screenshot, então o reel desenha o mesmo sprite por cima).
//
//   node video/capture/shoot.mjs landscape            (todas as tomadas)
//   node video/capture/shoot.mjs portrait hero extras (só essas)
//
// O vertical usa o layout mobile do site (540×960 CSS a 2x = 1080×1920).

import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { openSite, step, advance, SITE, root } from "./browser.mjs";

const format = process.argv[2] === "portrait" ? "portrait" : "landscape";
const only = process.argv.slice(3);
const V = format === "portrait";
const viewport = V ? { width: 540, height: 960, scale: 2 } : { width: 1920, height: 1080, scale: 1 };
const FPS = 30;
const base = join(root, "video", ".cache", "live", format);

const log = (...a) => console.log(`[${format}]`, ...a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── gravação ──────────────────────────────────────────────────────────────

/**
 * Grava `seconds` de tomada. `drive(t)` devolve onde o mouse deve estar
 * naquele instante ({x, y} em px CSS, ou null pra estacionar fora da cena).
 */
async function record(page, name, seconds, drive = () => null, opts = {}) {
  const dir = join(base, name);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const cursor = [];
  const frames = Math.round(seconds * FPS);
  const started = Date.now();
  for (let i = 0; i < frames; i++) {
    const t = i / FPS;
    const target = await drive(t, i);
    if (target) await page.mouse.move(target.x, target.y);
    else if (opts.park) await page.mouse.move(opts.park.x, opts.park.y);
    const state = target
      ? await page.evaluate(([x, y]) => {
          const el = document.elementFromPoint(x, y);
          return el && el.closest("a,button,[role=button],label") ? "hover" : "repouso";
        }, [target.x, target.y])
      : null;
    const jpg = await page.screenshot({ type: "jpeg", quality: 92 });
    await writeFile(join(dir, `${String(i + 1).padStart(4, "0")}.jpg`), jpg);
    cursor.push(target ? { x: target.x * viewport.scale, y: target.y * viewport.scale, state: target.state || state } : null);
    // 60Hz por dentro, 30 fps gravados: molas e easings por quadro (a grade
    // do contato, a corrente de habilidades) andam no ritmo nativo.
    await step(page, 1000 / 60);
    await step(page, 1000 / 60);
    if (opts.realPause) await wait(opts.realPause);
    if (i % 30 === 0) log(`${name} ${i}/${frames} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
  }
  await writeFile(join(dir, "cursor.json"), JSON.stringify({ frames, scale: viewport.scale, cursor, ...(opts.meta || {}) }));
  log(`${name} pronto`);
}

// Caminho suave por pontos {t, x, y}: mesma interpolação da composição.
function path(points) {
  const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  return (t) => {
    if (t < points[0].t) return null;
    const last = points[points.length - 1];
    if (t >= last.t) return last.hide ? null : { x: last.x, y: last.y, state: last.state };
    let i = 0;
    while (t > points[i + 1].t) i++;
    const a = points[i];
    const b = points[i + 1];
    if (a.hide) return null;
    const p0 = points[Math.max(0, i - 1)];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const u = ease((t - a.t) / (b.t - a.t));
    const cr = (q0, q1, q2, q3) => 0.5 * (2 * q1 + (-q0 + q2) * u + (2 * q0 - 5 * q1 + 4 * q2 - q3) * u * u + (-q0 + 3 * q1 - 3 * q2 + q3) * u * u * u);
    return { x: cr(p0.x, a.x, b.x, p3.x), y: cr(p0.y, a.y, b.y, p3.y), state: a.state };
  };
}

async function freshPage() {
  const site = await openSite(viewport);
  // Primeira visita só aquece cache (inclusive o Dezert Horse, que vem da rede).
  await site.page.goto(`${SITE}/pt/`, { waitUntil: "domcontentloaded" });
  await advance(site.page, 4, 25);
  return site;
}

async function settle(page) {
  // Espera o carregamento do site terminar (a cortina sai do DOM).
  for (let i = 0; i < 600; i++) {
    const done = await page.evaluate(() => !document.querySelector(".z-\\[301\\]") && !document.querySelector(".z-\\[300\\]"));
    if (done) return;
    await advance(page, 0.1, 10);
  }
}

const rect = (page, selector, index = 0) =>
  page.evaluate(
    ([sel, idx]) => {
      const list = [...document.querySelectorAll(sel)].filter((el) => el.getClientRects().length && !el.closest(".lens-invert"));
      const el = list[idx];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    },
    [selector, index],
  );

async function scrollToEl(page, selector, offset = 0) {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - off);
    },
    [selector, offset],
  );
  await advance(page, 1.2, 8);
}

// ─── tomadas ───────────────────────────────────────────────────────────────

const SHOTS = {
  // Entrada real do site (SiteLoader + cortina) e a hero com a lente de vidro.
  async hero() {
    const { browser, page } = await freshPage();
    await page.mouse.move(viewport.width / 2, 10);
    await page.goto(`${SITE}/pt/`, { waitUntil: "domcontentloaded" });
    let entry = null;
    let keys = null;
    const W = viewport.width;
    const H = viewport.height;
    await record(
      page,
      "hero",
      13,
      async (t) => {
        if (entry === null) {
          const gone = await page.evaluate(() => !document.querySelector(".z-\\[301\\]"));
          if (gone) {
            entry = t;
            const h1 = await rect(page, "#home h1 [data-title-line]", 0);
            const h2 = await rect(page, "#home h1 [data-title-line]", 1);
            const sub = await rect(page, "#home h1 + p");
            const face = await rect(page, "#home .portrait-frames");
            const e = entry;
            keys = V
              ? [
                  { t: e + 1.2, x: W - 4, y: h1.y + h1.h * 0.8 },
                  { t: e + 2.0, x: h1.x + h1.w * 0.72, y: h1.y + h1.h * 0.6 },
                  { t: e + 2.8, x: h2.x + h2.w * 0.3, y: h2.y + h2.h * 0.6 },
                  { t: e + 3.5, x: sub.x + sub.w * 0.55, y: sub.y + sub.h * 0.7 },
                  { t: e + 4.3, x: face.x + face.w * 0.42, y: face.y + face.h * 0.34 },
                  { t: e + 5.3, x: face.x + face.w * 0.58, y: face.y + face.h * 0.4 },
                  { t: e + 6.0, x: W - 6, y: 24 },
                  { t: e + 6.3, x: W - 6, y: 24, hide: true },
                ]
              : [
                  { t: e + 1.2, x: 4, y: h1.y + h1.h * 0.9 },
                  { t: e + 2.0, x: h1.x + h1.w * 0.24, y: h1.y + h1.h * 0.6 },
                  { t: e + 2.8, x: h1.x + h1.w * 0.72, y: h1.y + h1.h * 0.62 },
                  { t: e + 3.5, x: h2.x + h2.w * 0.45, y: h2.y + h2.h * 0.62 },
                  { t: e + 4.2, x: sub.x + sub.w * 0.6, y: sub.y + sub.h * 0.55 },
                  { t: e + 5.0, x: face.x + face.w * 0.42, y: face.y + face.h * 0.34 },
                  { t: e + 5.8, x: face.x + face.w * 0.56, y: face.y + face.h * 0.4 },
                  { t: e + 6.5, x: face.x + face.w * 0.9, y: 22 },
                  { t: e + 6.8, x: face.x + face.w * 0.9, y: 22, hide: true },
                ];
            keys.face = { x: (face.x + face.w * 0.5) * viewport.scale, y: (face.y + face.h * 0.38) * viewport.scale };
          }
          return null;
        }
        return path(keys)(t);
      },
      { park: { x: viewport.width / 2, y: 10 }, realPause: 12 },
    );
    // Guarda onde a hero entrou e onde está o rosto, pra composição cortar e
    // abrir a lente final no lugar certo.
    const meta = join(base, "hero", "meta.json");
    await writeFile(meta, JSON.stringify({ entry, face: keys?.face }));
    await browser.close();
  },

  // As cinco prévias ao vivo do carrossel, uma de cada vez, em tela cheia.
  async projects() {
    const { browser, page } = await freshPage();
    await page.goto(`${SITE}/pt/`, { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.addStyleTag({
      content: `
        [data-reel-solo]{position:fixed!important;inset:0!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;margin:0!important;z-index:2147483647!important;transform:none!important;opacity:1!important;visibility:visible!important;background:#000!important;border:0!important}
        [data-reel-anc]{transform:none!important;filter:none!important;perspective:none!important;contain:none!important;will-change:auto!important;clip-path:none!important;-webkit-mask:none!important;mask:none!important;opacity:1!important;isolation:auto!important;visibility:visible!important}
        body[data-reel-on] :where(*:not([data-reel-anc]):not([data-reel-solo])){visibility:hidden!important}
        body[data-reel-on] [data-reel-solo] *{visibility:visible!important}
      `,
    });
    const list = [
      ["ganwalk", "GANWALK"],
      ["dezert", "DEZERT HORSE"],
      ["pink", "PINK OPALA"],
      ["intranet", "DESIGN SYSTEM"],
      ["landing", "LANDING PAGES"],
    ];
    const work = await page.evaluate(() => {
      const el = document.getElementById("work");
      const r = el.getBoundingClientRect();
      return { top: r.top + scrollY, h: r.height, vh: innerHeight };
    });
    for (const [name, title] of list) {
      if (only.length > 1 && !only.includes(name) && !only.includes("projects")) continue;
      // Rola o carrossel até o card aparecer inteiro e montar a prévia.
      let found = false;
      for (let k = 0; k <= 40 && !found; k++) {
        const y = work.top + (k * (work.h - work.vh)) / 40;
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await advance(page, 0.25, 6);
        found = await page.evaluate((ttl) => {
          const heads = [...document.querySelectorAll("#work h2, #work h3")].filter((h) => h.innerText.trim().toUpperCase() === ttl);
          for (const h of heads) {
            const hr = h.getBoundingClientRect();
            if (hr.width === 0 || hr.bottom < 0 || hr.top > innerHeight) continue;
            let a = h.parentElement;
            while (a && a.id !== "work") {
              const roots = [...a.querySelectorAll("div")].filter(
                (d) => d.className.startsWith?.("relative overflow-hidden") && d.querySelector("canvas,iframe,img,video") && d.getBoundingClientRect().width > 150,
              );
              if (roots.length) {
                const solo = roots[0];
                document.querySelectorAll("[data-reel-solo],[data-reel-anc]").forEach((n) => n.removeAttribute("data-reel-solo") || n.removeAttribute("data-reel-anc"));
                solo.setAttribute("data-reel-solo", "");
                for (let p = solo.parentElement; p; p = p.parentElement) p.setAttribute("data-reel-anc", "");
                document.body.setAttribute("data-reel-on", "");
                return true;
              }
              a = a.parentElement;
            }
          }
          return false;
        }, title);
      }
      if (!found) {
        log(`não achei ${title}`);
        continue;
      }
      await page.evaluate(() => window.dispatchEvent(new Event("resize")));
      // O Dezert Horse precisa ter terminado de carregar e limpar a UI dele.
      await advance(page, name === "dezert" ? 3.0 : 1.2, name === "dezert" ? 30 : 8);
      const W = viewport.width;
      const H = viewport.height;
      const drive =
        name === "pink"
          ? path(
              V
                ? [
                    { t: 0.2, x: W + 2, y: H * 0.36 },
                    { t: 0.9, x: W * 0.7, y: H * 0.34 },
                    { t: 1.6, x: W * 0.25, y: H * 0.42 },
                    { t: 2.3, x: W * 0.4, y: H * 0.6 },
                    { t: 3.0, x: W * 0.78, y: H * 0.64 },
                    { t: 3.6, x: W * 0.6, y: H * 0.5 },
                  ]
                : [
                    { t: 0.2, x: W * 0.02, y: H * 0.3 },
                    { t: 0.9, x: W * 0.3, y: H * 0.36 },
                    { t: 1.6, x: W * 0.6, y: H * 0.32 },
                    { t: 2.3, x: W * 0.5, y: H * 0.66 },
                    { t: 3.0, x: W * 0.78, y: H * 0.62 },
                    { t: 3.6, x: W * 0.9, y: H * 0.5 },
                  ],
            )
          : () => null;
      await record(page, `project-${name}`, 3.6, drive, { park: { x: 1, y: 1 }, realPause: name === "dezert" ? 6 : 0 });
      await page.evaluate(() => {
        document.querySelectorAll("[data-reel-solo],[data-reel-anc]").forEach((n) => {
          n.removeAttribute("data-reel-solo");
          n.removeAttribute("data-reel-anc");
        });
        document.body.removeAttribute("data-reel-on");
        window.dispatchEvent(new Event("resize"));
      });
      await advance(page, 0.5, 4);
    }
    await browser.close();
  },

  // A corrente de habilidades presa ao cursor (SkillsOrbit).
  async skills() {
    const { browser, page } = await freshPage();
    await page.goto(`${SITE}/pt/`, { waitUntil: "domcontentloaded" });
    await settle(page);
    const tagSel = "#about span.type-mono.border";
    await page.evaluate((sel) => {
      const tags = [...document.querySelectorAll(sel)].filter((el) => el.getClientRects().length);
      const first = tags[0];
      const last = tags[tags.length - 1];
      const top = first.getBoundingClientRect().top + scrollY;
      const bottom = last.getBoundingClientRect().bottom + scrollY;
      window.scrollTo(0, (top + bottom) / 2 - innerHeight * (innerWidth < 640 ? 0.42 : 0.5));
    }, tagSel);
    await advance(page, 1.5, 8);
    const tags = await page.evaluate((sel) =>
      [...document.querySelectorAll(sel)]
        .filter((el) => el.getClientRects().length)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }),
    tagSel);
    const W = viewport.width;
    const H = viewport.height;
    const start = { x: V ? W * 0.5 : tags[0].x - 60, y: (V ? tags[0].y : tags[0].y) - (V ? 150 : 170) };
    const points = [{ t: 0, ...start }, { t: 1.15, x: start.x + 20, y: start.y + 10 }];
    // Passa por cima de cada tag, na ordem de leitura.
    let t = 1.3;
    for (const tag of tags) {
      points.push({ t, x: tag.x, y: tag.y });
      t += Math.min(0.16, 2.2 / tags.length);
    }
    // Depois dá uma volta larga, pra corrente chicotear atrás do cursor.
    const cx = V ? W * 0.5 : W * 0.5;
    const cy = V ? H * 0.42 : H * 0.45;
    const rx = V ? W * 0.3 : W * 0.22;
    const ry = V ? H * 0.16 : H * 0.2;
    for (let k = 1; k <= 6; k++) {
      const a = (k / 6) * Math.PI * 2 - Math.PI / 2;
      points.push({ t: t + k * 0.42, x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
    }
    await record(page, "skills", t + 2.9, path(points), { park: start });
    await browser.close();
  },

  // Letreiro de marcas e os cartões do Playground, com hover de verdade.
  async extras() {
    const { browser, page } = await freshPage();
    await page.goto(`${SITE}/pt/`, { waitUntil: "domcontentloaded" });
    await settle(page);
    await scrollToEl(page, "#playground", V ? 60 : viewport.height * 0.52);
    const W = viewport.width;
    const H = viewport.height;
    let cards = null;
    const scrollFrames = V ? [36, 150] : [24, 60];
    const drive = async (t, i) => {
      // rola com a roda do mouse (Lenis suaviza), como alguém lendo a página
      if (i >= scrollFrames[0] && i < scrollFrames[1]) await page.mouse.wheel(0, V ? 9 : 16);
      if (!V && i === scrollFrames[1] + 6) {
        cards = await page.evaluate(() =>
          [...document.querySelectorAll("#playground article, #playground li, #playground a, #playground button")]
            .map((el) => el.getBoundingClientRect())
            .filter((r) => r.width > 250 && r.height > 250)
            .slice(0, 3)
            .map((r) => ({ x: r.left + r.width / 2, y: r.top + r.height * 0.4 })),
        );
      }
      if (V) {
        return path([
          { t: 0.5, x: W + 2, y: H * 0.55 },
          { t: 1.2, x: W * 0.55, y: H * 0.5 },
          { t: 5.4, x: W * 0.5, y: H * 0.46 },
        ])(t);
      }
      if (!cards || cards.length < 3) return path([{ t: 0.9, x: W - 2, y: H * 0.8 }, { t: 2.2, x: W * 0.8, y: H * 0.7 }])(t);
      return path([
        { t: 1.9, x: W * 0.8, y: H * 0.7 },
        { t: 2.5, ...cards[0] },
        { t: 3.2, x: cards[0].x - 40, y: cards[0].y + 30 },
        { t: 3.6, ...cards[1] },
        { t: 4.3, x: cards[1].x + 40, y: cards[1].y - 20 },
        { t: 4.7, ...cards[2] },
        { t: 5.6, x: cards[2].x - 30, y: cards[2].y + 40 },
      ])(t);
    };
    await record(page, "extras", 5.6, drive, { park: { x: W - 2, y: H - 2 } });
    await browser.close();
  },

  // A grade "Fale comigo!" reagindo ao mouse, que termina no email.
  async contact() {
    const { browser, page } = await freshPage();
    await page.goto(`${SITE}/pt/`, { waitUntil: "domcontentloaded" });
    await settle(page);
    await scrollToEl(page, "#contact", V ? 70 : 0);
    const grid = await rect(page, "#contact canvas");
    const email = await rect(page, '#contact a[href^="mailto:"]');
    const g = grid;
    const W = viewport.width;
    const points = [
      { t: 0.3, x: W - 2, y: g.y + g.h * 0.9 },
      { t: 0.9, x: g.x + g.w * 0.7, y: g.y + g.h * 0.62 },
      { t: 1.6, x: g.x + g.w * 0.3, y: g.y + g.h * 0.3 },
      { t: 2.3, x: g.x + g.w * 0.55, y: g.y + g.h * 0.72 },
      { t: 3.0, x: g.x + g.w * 0.2, y: g.y + g.h * 0.55 },
      { t: 3.8, x: email.x + email.w * 0.55, y: email.y + email.h * 0.55 },
      { t: 5.2, x: email.x + email.w * 0.55, y: email.y + email.h * 0.55 },
    ];
    await record(page, "contact", 5.2, path(points), {
      park: { x: W - 2, y: 2 },
      meta: { email: { x: (email.x + email.w * 0.55) * viewport.scale, y: (email.y + email.h * 0.55) * viewport.scale } },
    });
    await browser.close();
  },
};

const names = only.length ? only.filter((n) => SHOTS[n]) : Object.keys(SHOTS);
for (const name of names) {
  log(`tomada ${name}`);
  await SHOTS[name]();
}
