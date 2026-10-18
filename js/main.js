import { animate, scroll, inView } from "https://cdn.jsdelivr.net/npm/motion@14.3.0/+esm";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = [0.22, 1, 0.36, 1];

// Revelado al entrar en pantalla
inView(".reveal", (el) => {
  if (el.classList.contains("mask")) animate(el, { clipPath: "inset(0 0 0% 0)" }, { duration: reduce ? 0 : 1.2, ease });
  else animate(el, { opacity: 1, transform: "translateY(0)" }, { duration: reduce ? 0 : 0.9, ease });
}, { margin: "0px 0px -15% 0px" });

// Hero: vídeo de montaje + zambullida en el fuego, enganchado al scroll (secuencia de fotogramas en canvas)
const hero = document.querySelector(".hero");
const canvas = hero.querySelector(".seq"), g = canvas.getContext("2d");
const copy = hero.querySelector(".hero-copy"), barra = hero.querySelector(".progreso i");
const frases = [...hero.querySelectorAll(".frase")];
const TOTAL = 266, FIN_MONTAJE = 169;            // f001–f169 montaje.mp4 · f170–f266 zambullida.mp4
const vertical = matchMedia("(max-width: 800px) and (orientation: portrait)").matches;  // móvil: vídeos 9:16 de Pixel
const src = (i) => `img/video/${vertical ? "frames-v" : "frames"}/f${String(i).padStart(3, "0")}.webp`;
const imgs = new Array(TOTAL + 1);
let actual = 1, pintado = 0;

const pintar = (i) => {
  // si aún no ha cargado ese fotograma, usa el cargado más cercano hacia atrás
  let k = i; while (k > 1 && !(imgs[k] && imgs[k].complete && imgs[k].naturalWidth)) k--;
  const im = imgs[k]; if (!im || !im.naturalWidth || k === pintado) return;
  const cw = canvas.width, ch = canvas.height, r = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
  const w = im.naturalWidth * r, h = im.naturalHeight * r;
  const fx = !vertical && cw < ch ? 0.62 : 0.5;  // en vertical, centra el encuadre en la hamburguesa
  g.drawImage(im, (cw - w) * fx, (ch - h) / 2, w, h); pintado = k;
};
const ajustar = () => {
  const d = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * d; canvas.height = innerHeight * d; pintado = 0; pintar(actual);
};
const cargar = (i) => new Promise((ok) => { const im = new Image(); im.decoding = "async"; im.onload = im.onerror = () => { ok(); if (Math.abs(i - actual) < 3) { pintado = 0; pintar(actual); } }; im.src = src(i); imgs[i] = im; });

// del % de scroll al fotograma: pan solo 0–8 %, montaje 8–65 %, pausa en la hamburguesa montada 65–75 %, zambullida 75–100 %
const fotograma = (p) => p < 0.08 ? 1 : p < 0.65 ? 1 + Math.round((p - 0.08) / 0.57 * (FIN_MONTAJE - 1))
  : p < 0.75 ? FIN_MONTAJE
  : FIN_MONTAJE + 1 + Math.round((p - 0.75) / 0.25 * (TOTAL - FIN_MONTAJE - 1));
const tramo = (p, a, b, f = 0.02) => Math.max(0, Math.min(1, (p - a) / f, (b - p) / f));

// "Ahora, el fuego.": se quema como papel y suelta chispas
const qM = document.getElementById("qM"), qE = document.getElementById("qE"), qC = document.getElementById("qC");
const cq = hero.querySelector(".chispas-quema"), cqx = cq && cq.getContext("2d");
let chispasQ = [], qPrev = 0, qLoop = false;
const tamCQ = () => { if (!cq) return; const d = Math.min(2, devicePixelRatio || 1); cq.width = innerWidth * d; cq.height = innerHeight * d; cqx.setTransform(d, 0, 0, d, 0, 0); };
tamCQ(); addEventListener("resize", tamCQ);
const animarCQ = () => {
  cqx.clearRect(0, 0, innerWidth, innerHeight); cqx.globalCompositeOperation = "lighter";
  chispasQ = chispasQ.filter((c) => (c.v -= 0.016) > 0);
  for (const c of chispasQ) {
    c.vy -= 0.06; c.vx += (Math.random() - 0.5) * 0.25; c.x += c.vx; c.y += c.vy;
    const g = cqx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 3);
    if (c.ceniza) { cqx.globalCompositeOperation = "source-over"; cqx.fillStyle = `rgba(140,130,120,${c.v * 0.8})`; cqx.fillRect(c.x, c.y, c.r * 1.6, c.r); cqx.globalCompositeOperation = "lighter"; continue; }
    g.addColorStop(0, `rgba(255,220,150,${c.v})`); g.addColorStop(0.4, `rgba(255,120,30,${c.v * 0.7})`); g.addColorStop(1, "rgba(255,80,0,0)");
    cqx.fillStyle = g; cqx.beginPath(); cqx.arc(c.x, c.y, c.r * 3, 0, 7); cqx.fill();
  }
  if (chispasQ.length) requestAnimationFrame(animarCQ); else qLoop = false;
};
const quemar = (el, q) => {
  if (!qM) return;
  el.style.filter = q > 0 && q < 1 ? "url(#quemar)" : "none";
  const t = -0.1 + q * 1.2;                       // umbral que avanza: lo de debajo se quema
  qM.setAttribute("intercept", (-14 * t).toFixed(2));
  qE.setAttribute("intercept", (-14 * (t - 0.09)).toFixed(2));
  qC.setAttribute("intercept", (-6 * (t + 0.22)).toFixed(2));   // franja chamuscada antes del filo
  if (cqx && q > qPrev && q > 0 && q < 1.05) {
    const r = el.getBoundingClientRect(), n = Math.min(90, Math.ceil((q - qPrev) * 900));
    for (let i = 0; i < n; i++) chispasQ.push({ x: r.left + r.width * (0.18 + Math.random() * 0.64), y: r.top + r.height * (0.2 + Math.random() * 0.6),
      vx: (Math.random() - 0.5) * 2.2, vy: -Math.random() * 2.5 - 0.5, r: 1 + Math.random() * 2.4, v: 0.7 + Math.random() * 0.5, ceniza: Math.random() < 0.25 });
    if (!qLoop) { qLoop = true; requestAnimationFrame(animarCQ); }
  }
  qPrev = q;
};

const pintarScroll = (p) => {
  actual = Math.min(TOTAL, Math.max(1, fotograma(p))); pintar(actual);
  frases.forEach((el) => {
    const a = +el.dataset.in, b = +el.dataset.out;
    let o = a === 0 ? tramo(p, -1, b) : tramo(p, a, b, el.classList.contains("lenta") ? 0.035 : 0.02);
    if (el.dataset.burn) { const q = Math.max(0, Math.min(1, (p - +el.dataset.burn) / (b - +el.dataset.burn - 0.005))); o = tramo(p, a, 9); if (q >= 1) o = 0; quemar(el, q); }
    el.style.opacity = o;
    if (el.classList.contains("sube")) el.style.transform = `translateY(calc(-50% + ${(1 - Math.min(1, (p - a) / 0.06)) * 18}vh)) scale(${0.9 + Math.min(1, (p - a) / 0.06) * 0.1})`;
    else if (el.classList.contains("grande")) el.style.transform = `translateY(-50%) scale(${1 + (p - a) * (el.classList.contains("lenta") ? 0.35 : 0.8)})`;
    else el.style.transform = `translateY(${(1 - o) * 20}px)`;
  });
  const h = tramo(p, 0.705, 0.775, 0.03);         // H1 + botones: plano final quieto
  copy.style.opacity = h; copy.classList.toggle("on", h > 0.05);
  copy.style.transform = innerWidth <= 800 ? `translateY(${(1 - h) * 24}px)` : `translateY(calc(-50% + ${(1 - h) * 24}px))`;
  barra.style.transform = `scaleY(${p})`;
};

if (!reduce) {
  ajustar(); addEventListener("resize", ajustar);
  // primero los fotogramas clave para que se vea algo enseguida, luego el resto en orden
  const orden = [1, ...Array.from({ length: TOTAL }, (_, i) => i + 1).filter((i) => i !== 1)];
  const claves = orden.filter((i) => i % 8 === 1), resto = orden.filter((i) => i % 8 !== 1);
  const resto2 = async () => { await Promise.all(claves.map(cargar)); for (let i = 0; i < resto.length; i += 12) await Promise.all(resto.slice(i, i + 12).map(cargar)); };
  cargar(1).then(() => pintarScroll(0));
  // el resto de fotogramas, en segundo plano cuando la página ya se ve
  if (document.readyState === "complete") resto2(); else addEventListener("load", resto2, { once: true });
  scroll(pintarScroll, { target: hero, offset: ["start start", "end end"] });
  // al salir, las llamas se funden en la sección "El fuego hace el trabajo"
  const frasesBox = hero.querySelector(".frases");
  scroll((q) => { frasesBox.style.opacity = 1 - Math.min(1, q * 1.8); canvas.style.filter = `brightness(${1 - q * 0.6})`; },
    { target: document.querySelector(".brasa"), offset: ["start 40%", "start start"] });
}

// Carta "Cuatro formas de arder": los naipes se reparten desde un mazo con el scroll
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const naipes = [...document.querySelectorAll(".naipe")];
const partes = naipes.map((n) => ({
  n, inner: n.querySelector(".naipe-in"), foto: n.querySelector(".foto"), num: n.querySelector(".num"),
  letras: [...n.querySelectorAll(".letras span")], gancho: n.querySelector(".gancho"),
  desc: n.querySelector(".desc"), row: n.querySelector(".row"), tag: n.querySelector(".tag"),
}));
const fin = document.querySelector(".carta-fin"), mazo = document.querySelector(".mazo");
const giros = [-9, 6, -4, 8];

const contenido = (q, cp) => {   // cp 0–1: número, nombre letra a letra, frase y precio
  const fase = (a, b) => clamp01((cp - a) / (b - a));
  q.inner.style.setProperty("--glow", cp);
  const fn = fase(0, 0.25); q.num.style.opacity = fn; q.num.style.transform = `translateY(${(1 - fn) * 30}px)`;
  const L = q.letras.length;
  q.letras.forEach((s, k) => {
    const lp = fase(0.1 + (k / L) * 0.4, 0.1 + (k / L) * 0.4 + 0.25), o = Math.min(1, lp * 2);
    s.style.opacity = o; s.style.transform = `translateY(${(1 - o) * 0.5}em)`;
    s.style.color = lp < 0.75 ? "var(--llama)" : "var(--crema)";
    s.style.textShadow = lp < 1 ? `0 0 ${18 * (1 - lp) + 4}px rgba(255,106,26,${1 - lp})` : "none";
  });
  [[q.gancho, 0.5, 0.7], [q.desc, 0.6, 0.8], [q.row, 0.75, 1], [q.tag, 0.8, 1]].forEach(([el, a, b]) => {
    if (!el) return; const f = fase(a, b); el.style.opacity = f; el.style.transform = `translateZ(${el === q.tag ? 90 : 0}px) translateY(${(1 - f) * 14}px)`;
  });
};

const desktop = () => innerWidth > 900 && !reduce;
let origen = [];
const medir = () => {  // distancia de cada naipe hasta el centro del mazo (sin transformaciones)
  const cx = mazo.offsetWidth / 2, cy = mazo.offsetHeight / 2 + innerHeight * 0.12;
  origen = naipes.map((n, i) => ({ x: cx - (n.offsetLeft + n.offsetWidth / 2) + i * 4, y: cy - (n.offsetTop + n.offsetHeight / 2) - i * 4 }));
};
const repartir = (p) => {
  if (!desktop()) return;
  partes.forEach((q, i) => {
    const f0 = 0.08 + i * 0.19, t = easeOut(clamp01((p - f0) / 0.11)), o = origen[i] || { x: 0, y: 0 };
    q.n.style.zIndex = t > 0 && t < 1 ? 10 : 4 - i;
    q.n.style.transform = `translate(${o.x * (1 - t)}px, ${o.y * (1 - t)}px) rotate(${giros[i] * (1 - t) + Math.sin(t * Math.PI) * -6}deg) scale(${0.82 + 0.18 * t + Math.sin(t * Math.PI) * 0.08})`;
    contenido(q, clamp01((p - f0 - 0.09) / 0.12));
  });
  const ff = clamp01((p - 0.86) / 0.06); fin.style.opacity = ff; fin.style.transform = `translateY(${(1 - ff) * 20}px)`;
};

if (desktop()) {
  medir(); addEventListener("resize", () => { medir(); });
  // progreso medido en cada frame (las fotos lazy de arriba cambian la altura de la página)
  const pin = document.querySelector(".carta-pin"); let pend = false;
  const tick = () => { pend = false; const r = pin.getBoundingClientRect(); repartir(clamp01(-r.top / (r.height - innerHeight))); };
  addEventListener("scroll", () => { if (!pend) { pend = true; requestAnimationFrame(tick); } }, { passive: true }); tick();
} else {
  partes.forEach((q) => contenido(q, reduce ? 1 : 0));
  if (!reduce) inView(".naipe", (n) => { const q = partes.find((x) => x.n === n); animate(0, 1, { duration: 1.4, ease, onUpdate: (v) => contenido(q, v) }); }, { margin: "0px 0px -20% 0px" });
}

// Inclinación 3D al pasar el ratón: la hamburguesa "sale" de la tarjeta
partes.forEach((q) => {
  q.inner.addEventListener("pointermove", (e) => {
    const r = q.inner.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    q.inner.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 12}deg)`;
    q.foto.style.transform = `translateX(-50%) translateZ(90px) translate(${x * 18}px, ${y * 10 - 8}px) scale(1.06)`;
  });
  q.inner.addEventListener("pointerleave", () => { q.inner.style.transform = ""; q.foto.style.transform = ""; });
});
document.querySelectorAll(".add").forEach((b) => b.addEventListener("click", () => {
  const on = b.classList.toggle("done"); b.textContent = on ? "¡Añadida! ✓" : "La quiero";
}));

// Los números del fuego: termómetro que sube con el scroll y enciende cada cifra
const numeros = document.querySelector(".numeros"), nSticky = numeros.querySelector(".numeros-sticky");
const grados = numeros.querySelector(".termo-grados"), marcas = [...numeros.querySelectorAll(".marcas li")];
const contar = (li) => {
  const el = li.querySelector("b"), n = parseFloat(el.dataset.n), pre = el.dataset.pre || "", suf = el.dataset.suf || "";
  const fmt = (v) => el.textContent = pre + Math.round(v).toLocaleString("es-ES") + suf;
  if (n === 0) { fmt(0); return; }
  animate(0, n, { duration: reduce ? 0 : 1.4, ease, onUpdate: fmt });
};
if (!reduce) marcas.forEach((li) => { const b = li.querySelector("b"); b.textContent = (b.dataset.pre || "") + "0" + (b.dataset.suf || ""); });
const numerosScroll = () => {
  const r = numeros.getBoundingClientRect(), total = r.height - innerHeight;
  const p = reduce ? 1 : clamp01(-r.top / total);
  nSticky.style.setProperty("--calor", p.toFixed(3));
  grados.textContent = Math.round(p * 400) + " °C";
  for (const li of marcas) if (!li.classList.contains("on") && p >= parseFloat(li.dataset.at)) { li.classList.add("on"); contar(li); }
};

// Fondo de brasas en bucle: solo se reproduce cuando se ve
const brasasV = numeros.querySelector(".brasas-bg");
if (!reduce) inView(numeros, () => { brasasV.play().catch(() => {}); return () => brasasV.pause(); });

// Reseñas: las comandas se imprimen al entrar
inView(".tickets", (box) => {
  box.querySelectorAll(".ticket").forEach((t, i) => setTimeout(() => t.classList.add("impreso"), reduce ? 0 : i * 450));
}, { margin: "0px 0px -20% 0px" });

// Reserva: mesa o para llevar + botón que se enciende
const form = document.getElementById("form-reserva"), msg = form.querySelector(".msg"), btnE = form.querySelector(".encender");
document.querySelectorAll(".modo button").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll(".modo button").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); });
  const llevar = b.dataset.modo === "llevar";
  form.classList.toggle("llevar", llevar); form.personas.required = !llevar;
  btnE.querySelector("span").textContent = llevar ? "Encender mi pedido" : "Encender mi reserva";
}));
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!form.checkValidity()) { msg.classList.add("error"); msg.textContent = "Algo se ha enfriado. Revisa los datos y vuelve a intentarlo."; btnE.classList.remove("ardiendo"); return; }
  const d = new Date(form.fecha.value + "T12:00"), dia = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  msg.classList.remove("error"); btnE.classList.add("ardiendo");
  msg.textContent = `¡Brasa encendida! Te esperamos el ${dia} a las ${form.hora.value}.`;
});

// Sigue el humo: el hilo de humo baja con el scroll hasta el local

const donde = document.querySelector(".donde"), estelaF = donde.querySelector(".estela-fuego"), punta = donde.querySelector(".estela-punta");
const estelaLen = estelaF.getTotalLength();
donde.querySelectorAll(".estela path").forEach((p) => p.style.setProperty("--len", estelaLen));
const humoScroll = () => {
  const r = donde.getBoundingClientRect();
  const p = reduce ? 1 : clamp01(-r.top / Math.max(1, r.height - innerHeight));
  const camino = clamp01(p / 0.75), llegada = clamp01((p - 0.7) / 0.2);
  donde.style.setProperty("--p", p.toFixed(3));
  donde.style.setProperty("--humo", camino.toFixed(3));
  donde.style.setProperty("--llegada", llegada.toFixed(3));
  const pt = estelaF.getPointAtLength(estelaLen * camino);
  punta.setAttribute("cx", pt.x.toFixed(1)); punta.setAttribute("cy", pt.y.toFixed(1));
  punta.style.opacity = camino > 0.01 && camino < 0.995 ? 1 : 0;
  const tramo = p < 0.5 ? 1 : p < 0.8 ? 2 : 3;
  donde.querySelectorAll(".tramo span").forEach((el, i) => el.classList.toggle("on", i + 1 === tramo));
  // En pantallas estrechas la cámara sigue la punta de la estela
  if (innerWidth < 800) {
    const fin = estelaF.getPointAtLength(estelaLen);
    const k = 0.35 + llegada * 0.65, x = pt.x + (fin.x - pt.x) * k * (p > 0.7 ? 1 : 0.4), y = pt.y + (fin.y - pt.y) * k * (p > 0.7 ? 1 : 0.4);
    donde.style.setProperty("--cx", (x / 12.8).toFixed(2) + "%"); donde.style.setProperty("--cy", (y / 7.2).toFixed(2) + "%");
  } else { donde.style.removeProperty("--cx"); donde.style.removeProperty("--cy"); }
};
// ¿Brasa encendida? (horario en hora de Madrid)
(() => {
  const ahora = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const dia = ahora.getDay(), m = ahora.getHours() * 60 + ahora.getMinutes();
  const finde = (x) => x === 5 || x === 6 || x === 0;
  const tramos = finde(dia) ? [[780, 1470]] : [[780, 990], [1200, 1410]];
  let abierto = tramos.some(([a, b]) => m >= a && m < b);
  if (!abierto && m < 30 && finde((dia + 6) % 7)) abierto = true; // pasada la medianoche del finde
  const el = document.querySelector(".estado");
  el.classList.toggle("abierto", abierto);
  el.querySelector(".estado-txt").textContent = abierto ? "🔥 Brasa encendida" : "Brasa en reposo";
})();

let abajoTick = false;
const abajo = () => { if (abajoTick) return; abajoTick = true; requestAnimationFrame(() => { abajoTick = false; numerosScroll(); humoScroll(); }); };
addEventListener("scroll", abajo, { passive: true }); addEventListener("resize", abajo); abajo();

// Partículas de brasa: ascuas que flotan + chispas rápidas que suben desde abajo
const c = document.getElementById("embers"), ctx = c.getContext("2d");
const dpr = Math.min(devicePixelRatio || 1, 2);
const resize = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
resize(); addEventListener("resize", resize);
const sprite = (() => { const s = document.createElement("canvas"); s.width = s.height = 64; const g = s.getContext("2d");
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,240,200,1)"); r.addColorStop(.18, "rgba(255,178,63,.95)"); r.addColorStop(.45, "rgba(255,106,26,.35)"); r.addColorStop(1, "rgba(255,61,0,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return s; })();
const movil = innerWidth < 800, N = reduce ? 0 : (movil ? 70 : 150);
const nueva = (todo) => {
  const chispa = Math.random() < 0.22;
  return { x: Math.random() * innerWidth, y: todo ? Math.random() * innerHeight : innerHeight + 20,
    r: chispa ? Math.random() * 1.6 + .8 : Math.random() * 3 + 1, v: chispa ? Math.random() * 2.4 + 1.6 : Math.random() * .7 + .25,
    dx: (Math.random() - .5) * (chispa ? 1.2 : .4), a: Math.random() * 6, f: Math.random() * .03 + .01, chispa };
};
const ps = Array.from({ length: N }, () => nueva(true));
let ultimoY = scrollY, empuje = 0;
addEventListener("scroll", () => { empuje += (scrollY - ultimoY) * 0.04; ultimoY = scrollY; }, { passive: true });
(function tick() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  ctx.globalCompositeOperation = "lighter";
  empuje *= 0.9;
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    p.y -= p.v + empuje; p.x += p.dx + Math.sin((p.y + p.a * 40) / 50) * .35; p.a += p.f;
    if (p.y < -30 || p.x < -30 || p.x > innerWidth + 30) { ps[i] = nueva(false); continue; }
    if (p.y > innerHeight + 40) p.y = -20;
    const vida = .55 + Math.sin(p.a * 3) * .35, alto = Math.min(1, (innerHeight - p.y) / (innerHeight * .25) + .25);
    const t = p.r * (p.chispa ? 5 : 7);
    ctx.globalAlpha = Math.max(0, vida * alto);
    if (p.chispa) { ctx.globalAlpha *= .5; ctx.drawImage(sprite, p.x - t / 2, p.y - t / 2 + t * .6, t, t * 1.8); ctx.globalAlpha /= .5; }
    ctx.drawImage(sprite, p.x - t / 2, p.y - t / 2, t, t);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  requestAnimationFrame(tick);
})();

// Vídeos de brasa decorativos: solo se reproducen cuando están a la vista
document.querySelectorAll(".brasa-video,.b-video").forEach((v) => {
  if (reduce) return;
  inView(v, () => { v.play().catch(() => {}); return () => v.pause(); }, { margin: "100px 0px" });
});

// Banda de patatas: el vídeo solo corre a la vista
const bandaV = document.querySelector(".banda-video");
if (bandaV) {
  const movilV = matchMedia("(max-width: 800px) and (orientation: portrait)").matches;
  bandaV.poster = movilV ? "img/secciones/patatas-cola-movil-poster.jpg" : "img/secciones/patatas-cola-poster.jpg";
  bandaV.src = movilV ? "img/secciones/patatas-cola-movil.mp4" : "img/secciones/patatas-cola.mp4";
}
if (bandaV && !reduce) inView(bandaV, () => { bandaV.play().catch(() => {}); return () => bandaV.pause(); });

// v7.4: recorrido de la entrada hasta la parrilla (fotogramas con carga diferida)
(() => {
  const sec = document.querySelector(".historia"); if (!sec) return;
  const cv = sec.querySelector(".historia-seq"), cx = cv.getContext("2d"), tramos = [...sec.querySelectorAll(".h-tramo")];
  const reduceH = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceH) { sec.style.setProperty("--fin", 1); return; }
  const N = 112, movil = matchMedia("(max-width: 800px) and (orientation: portrait)").matches;
  const ruta = (i) => `img/secciones/entrada-frames/${movil ? "movil" : "pc"}/f${String(i).padStart(3, "0")}.webp`;
  const fr = new Array(N + 1); let pedido = false, ultimo = 0;
  const tam = () => { const d = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * d; cv.height = innerHeight * d; ultimo = 0; pinta(); };
  const dibuja = (img) => { const W = cv.width, H = cv.height, s = Math.max(W / img.naturalWidth, H / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s; cx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); };
  const cerca = (i) => { for (let d = 0; d < N; d++) { if (fr[i - d]?.ok) return fr[i - d]; if (fr[i + d]?.ok) return fr[i + d]; } };
  const cargar = (i) => new Promise((r) => { const im = new Image(); im.decoding = "async"; im.onload = () => { im.ok = true; r(); if (Math.abs(i - objetivo) < 3) pinta(); }; im.onerror = r; im.src = ruta(i); fr[i] = im; });
  let objetivo = 1;
  const progreso = () => { const r = sec.getBoundingClientRect(); return Math.max(0, Math.min(1, -r.top / (r.height - innerHeight))); };
  function pinta() {
    const p = progreso(); objetivo = 1 + Math.round(Math.min(1, p / 0.8) * (N - 1));
    const im = cerca(objetivo); if (im && im !== ultimo) { dibuja(im); ultimo = im; cv.classList.add("lista"); }
    tramos.forEach((el) => { const a = +el.dataset.in, b = +el.dataset.out, o = Math.max(0, Math.min(1, (p - a) / 0.04, (b - p) / 0.04)); el.style.opacity = o; el.style.transform = `translateY(${(1 - o) * 24}px)`; });
    sec.style.setProperty("--fin", Math.max(0, Math.min(1, (p - 0.78) / 0.1)).toFixed(3));
  }
  const empezar = async () => {
    if (pedido) return; pedido = true; tam(); addEventListener("resize", tam);
    const claves = [], resto = []; for (let i = 1; i <= N; i++) (i % 10 === 1 ? claves : resto).push(i);
    await Promise.all(claves.map(cargar)); pinta();
    for (let i = 0; i < resto.length; i += 12) await Promise.all(resto.slice(i, i + 12).map(cargar));
  };
  new IntersectionObserver((e) => { if (e[0].isIntersecting) empezar(); }, { rootMargin: "150% 0px" }).observe(sec);
  addEventListener("scroll", () => requestAnimationFrame(pinta), { passive: true });
})();
