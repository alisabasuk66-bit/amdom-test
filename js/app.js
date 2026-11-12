/* АМ ДОМ — логика сайта. Данные берутся из js/data.js */
(function () {
'use strict';
const S = window.SITE, H = S.houses;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const rub = n => Math.round(n).toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽';
const mln = n => (n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' млн ₽';
const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? a : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? b : c; };
const bedTxt = n => n === 0 ? 'Студия' : n + ' ' + plural(n, 'спальня', 'спальни', 'спален');
const img = (h, n) => 'img/houses/' + h.dir + '/' + n + '.jpg';
const byId = id => H.find(h => h.id === id);
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- контакты во всех местах ---------- */
const C = S.contacts;
$$('[data-phone]').forEach(a => { a.href = 'tel:' + C.phoneRaw; if (!a.children.length) a.textContent = C.phone; });
$$('[data-email]').forEach(a => { a.href = 'mailto:' + C.email; a.textContent = C.email; });
$$('[data-map]').forEach(a => { a.href = C.mapUrl; a.textContent = C.address; });
$$('[data-tg]').forEach(a => { if (C.telegram) a.href = C.telegram; else a.hidden = true; });
// MAX и ВКонтакте видны всегда. Пока ссылка не вписана в data.js, кнопка подсказывает написать в Telegram
const soon = (a, url, nm) => { if (url) a.href = url; else { a.removeAttribute('target'); a.href = '#contacts'; a.addEventListener('click', e => { e.preventDefault(); toast(nm + ' скоро будет здесь. Пока напишите нам в Telegram или позвоните.'); }); } };
$$('[data-max]').forEach(a => soon(a, C.max, 'Чат в MAX'));
$$('[data-vk]').forEach(a => soon(a, C.vk, 'Сообщество ВКонтакте'));
$$('[data-avito]').forEach(a => { if (C.avito) { a.href = C.avito; a.hidden = false; } });
$$('[data-legal]').forEach(e => e.textContent = S.legal.name);
$$('[data-inn]').forEach(e => e.textContent = S.legal.inn);

/* ---------- шапка и меню ---------- */
const topbar = $('#top'), burger = $('#burger'), build = $('#build');
burger.addEventListener('click', () => {
  const o = topbar.classList.toggle('open'); burger.setAttribute('aria-expanded', o);
});
$$('#menu a').forEach(a => a.addEventListener('click', () => { topbar.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));

/* ==========================================================
   ГЛАВНЫЙ ЭКРАН: дом собирается при прокрутке
   ========================================================== */
const STAGES = [
  [0.0, 'Фундамент', 'Винтовые сваи 89/108 мм, глубина 2,5 м, оголовки 200×200. Или ж/б фундамент, если так нужно по грунту.'],
  [0.9, 'Обвязка и пол', 'Обвязка из трёх сбитых досок 45×190 мм, лаги перекрытия 45×190, сетка от грызунов.'],
  [1.4, 'Каркас стен', 'Сухая строганая доска камерной сушки 45×145 мм с шагом 590 мм. Стены не ведёт, нет скрипов и щелей.'],
  [2.8, 'Утепление', 'Каменная вата ТЕХНОНИКОЛЬ 200 мм в стенах и перекрытиях. Не горит и не оседает со временем.'],
  [3.3, 'Ветро- и пароизоляция', 'Снаружи мембрана Изоспан АМ, изнутри пароизоляция Изоспан RS. Стыки проклеены лентой.'],
  [3.8, 'Стропильная система', 'Стропила 45×195 мм с шагом 590 мм, контробрешётка для вентзазора.'],
  [5.8, 'Наружная обшивка', 'Сайдинг Docke «Блок-Хаус» под дерево, любой цвет на выбор.'],
  [6.8, 'Кровля', 'Металлочерепица 0,5 мм с покрытием Satin, водосточная система.'],
  [7.8, 'Окна и двери', 'Окна BRUSBOX 60 мм с тройным стеклом. Входная дверь с терморазрывом, 100 мм.'],
  [8.3, 'Цоколь', 'Отделка цоколя HAUBERK ТЕХНОНИКОЛЬ и металлический отлив.'],
  [8.8, 'Терраса и крыльцо', 'Террасная доска, столбы из клеёного бруса 140×140, ограждения из бруса.']
];
const vid = $('#vid'), night = $('#night'), card = $('#card'), cbody = $('#cbody'), ctitle = $('#ctitle'), ctext = $('#ctext'),
  cnum = $('#cnum'), rail = $('#rail'), bar = $('#bar'), intro = $('#intro'), hint = $('#hint'), fin = $('#final'),
  tintI = $('#tintI'), tintF = $('#tintF');
const small = matchMedia('(max-width:760px)').matches;
const h264 = vid.canPlayType('video/mp4; codecs="avc1.42E01E"');
const VSRC = !h264 ? 'media/build_960.webm?v=2' : (small ? 'media/build_960.mp4?v=2' : 'media/build_1280.mp4?v=2');
if (small) night.src = 'media/evening_960.jpg';
let DUR = 10.1, target = 0, cur = 0, stageIdx = -1, heroOn = true;
STAGES.forEach(s => { const d = document.createElement('span'); d.style.left = (s[0] / DUR * 100) + '%'; rail.appendChild(d); });
vid.addEventListener('loadedmetadata', () => { DUR = vid.duration || DUR; });
function setStage(t) {
  let i = 0; for (let k = 0; k < STAGES.length; k++) if (t >= STAGES[k][0]) i = k;
  if (i === stageIdx) return; stageIdx = i;
  cbody.classList.add('fade');
  setTimeout(() => {
    ctitle.textContent = STAGES[i][1]; ctext.textContent = STAGES[i][2];
    cnum.textContent = String(i + 1).padStart(2, '0') + ' / ' + STAGES.length; cbody.classList.remove('fade');
  }, 160);
}

if (small) {
  /* ТЕЛЕФОН: картинка на всю ширину, под ней лента этапов.
     Листаешь ленту пальцем вбок, и дом на картинке достраивается до нужного этапа. */
  build.classList.add('m');
  topbar.classList.add('solid');
  vid.removeAttribute('poster'); vid.style.display = 'none';
  const NF = 81, FPS = 8, frames = [], cv = document.createElement('canvas');
  cv.className = 'frames'; cv.width = 720; cv.height = 406;
  vid.parentNode.insertBefore(cv, vid);
  const ctx = cv.getContext('2d');
  const fsrc = i => 'media/frames/f' + String(i + 1).padStart(3, '0') + '.jpg';
  let shown = -1, curF = 0, targetF = 0;
  const draw = i => {
    let k = i; while (k > 0 && !(frames[k] && frames[k].done)) k--;
    if (!(frames[k] && frames[k].done) || k === shown) return;
    ctx.drawImage(frames[k], 0, 0, cv.width, cv.height); shown = k;
  };
  for (let i = 0; i < NF; i++) { const im = new Image(); im.onload = () => { im.done = true; if (i === curF || shown < 0) { shown = -1; draw(curF); } }; im.src = fsrc(i); frames[i] = im; }
  // плавно «доигрываем» кадры до нужного этапа
  let last = 0;
  const step = t => {
    if (curF !== targetF && t - last > 28) { curF += curF < targetF ? 1 : -1; draw(curF); last = t; }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);

  // лента этапов
  const strip = document.createElement('div'); strip.className = 'strip';
  const items = STAGES.concat([[DUR, 'Дом готов', 'Вечер, в окнах загорается свет. Осталось только заехать.']]);
  strip.innerHTML = items.map((st, i) => '<button class="sc' + (i ? '' : ' on') + '" data-i="' + i + '"><span class="n">' + String(i + 1).padStart(2, '0') + ' / ' + items.length + '</span><b>' + st[1] + '</b><span class="t">' + st[2] + '</span></button>').join('');
  const dots = document.createElement('div'); dots.className = 'sdots';
  dots.innerHTML = items.map((_, i) => '<i class="' + (i ? '' : 'on') + '"></i>').join('');
  const vbox = cv.parentNode;
  vbox.after(strip); strip.after(dots);
  let active = 0;
  const setActive = i => {
    if (i === active) return; active = i;
    $$('.sc', strip).forEach((c, k) => c.classList.toggle('on', k === i));
    $$('i', dots).forEach((d, k) => d.classList.toggle('on', k === i));
    const isEnd = i === items.length - 1;
    targetF = isEnd ? NF - 1 : Math.min(NF - 1, Math.round(items[i][0] * FPS + (i ? 3 : 0)));
    night.style.opacity = isEnd ? 1 : 0;
  };
  let raf = 0;
  strip.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const mid = strip.scrollLeft + strip.clientWidth / 2; let best = 0, bd = 1e9;
      $$('.sc', strip).forEach((c, k) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = k; } });
      setActive(best);
    });
  }, { passive: true });
  strip.addEventListener('click', e => {
    const c = e.target.closest('.sc'); if (!c) return;
    strip.scrollTo({ left: c.offsetLeft - (strip.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' });
  });
  fin.classList.add('on');
} else {
  /* КОМПЬЮТЕР: дом собирается при прокрутке.
     Ролик загружаем целиком в память: так перемотка плавная на любом хостинге.
     Если сайт открыт просто файлом с компьютера, подключаем ролик напрямую. */
  fetch(VSRC).then(r => { if (!r.ok) throw 0; return r.blob(); })
    .then(b => { vid.src = URL.createObjectURL(b); })
    .catch(() => { vid.src = VSRC; });
  // Доли прокрутки: 0–0.06 заголовок, 0.06–0.80 стройка, 0.80–0.92 вечер, дальше финал
  const onScroll = () => {
    const r = build.getBoundingClientRect(), total = build.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total));
    heroOn = r.bottom > 0;
    const b = Math.min(1, Math.max(0, (p - 0.06) / 0.74));
    target = b * (DUR - 0.05);
    night.style.opacity = Math.min(1, Math.max(0, (p - 0.80) / 0.12));
    const io = Math.max(0, 1 - p / 0.05);
    intro.style.opacity = io; tintI.style.opacity = io; hint.style.opacity = Math.max(0, 1 - p / 0.03);
    const building = p > 0.05 && p < 0.84;
    card.classList.toggle('on', building); rail.classList.toggle('on', building);
    fin.classList.toggle('on', p > 0.9); tintF.classList.toggle('on', p > 0.88);
    bar.style.width = (b * 100) + '%';
    topbar.classList.toggle('solid', r.bottom <= innerHeight * 0.2);
  };
  const tick = () => {
    if (heroOn) {
      cur += (target - cur) * 0.18;
      if (Math.abs(target - cur) < 0.004) cur = target;
      if (vid.readyState >= 1 && Math.abs(vid.currentTime - cur) > 0.02) { try { vid.currentTime = cur; } catch (e) {} }
      setStage(cur);
    }
    requestAnimationFrame(tick);
  };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);
  onScroll(); setStage(0); requestAnimationFrame(tick);
}

/* ==========================================================
   КАТАЛОГ
   ========================================================== */
const grid = $('#grid'), F = { floors: 'all', area: 'all', bed: 'all' };
function match(h) {
  if (F.floors !== 'all' && String(h.floors) !== F.floors) return false;
  if (F.area === 's' && h.area > 50) return false;
  if (F.area === 'm' && (h.area <= 50 || h.area > 80)) return false;
  if (F.area === 'l' && h.area <= 80) return false;
  if (F.bed !== 'all') { const b = +F.bed; if (b === 3 ? h.bedrooms < 3 : h.bedrooms !== b) return false; }
  return true;
}
const cardPics = h => h.photos.map((p, i) => i ? img(h, 'c' + p) : img(h, 'thumb'));
function cardHTML(h) {
  const badges = [h.floors === 2 ? '2 этажа' : '1 этаж'];
  if (h.style) badges.push(h.style);
  const spec = [bedTxt(h.bedrooms), h.baths + ' ' + plural(h.baths, 'санузел', 'санузла', 'санузлов')];
  if (h.outdoorArea) spec.push((h.outdoor.split(',')[0]).replace(' и балкон', ' + балкон'));
  return '<article class="hc" data-id="' + h.id + '" tabindex="0" role="button" aria-label="' + esc(h.name) + ', подробнее">' +
    '<div class="ph"><div class="trk">' + cardPics(h).map((src, i) => '<img src="' + src + '" alt="' + esc(h.name) + (i ? ', фото ' + (i + 1) : '') + '" loading="lazy" draggable="false">').join('') + '</div>' +
    (h.photos.length > 1 ? '<button class="cnav p" aria-label="Предыдущее фото">‹</button><button class="cnav n" aria-label="Следующее фото">›</button><div class="cdots">' + h.photos.map((p, i) => '<i' + (i ? '' : ' class="on"') + '></i>').join('') + '</div>' : '') +
    '<div class="badges">' + badges.map(b => '<span>' + b + '</span>').join('') + '</div></div>' +
    '<div class="bd"><h3>' + esc(h.name) + '</h3><div class="sz">' + h.size + ' м · ' + h.area + ' м²</div>' +
    '<div class="spec">' + spec.map(s => '<span>' + esc(s) + '</span>').join('') + '</div>' +
    '<div class="ft"><div class="pr"><small>Черновая, от</small><b>' + rub(h.price[0]) + '</b></div><span class="more" aria-hidden="true">→</span></div></div></article>';
}
function renderGrid(first) {
  const list = H.filter(match);
  grid.innerHTML = list.map(cardHTML).join('');
  $('#empty').hidden = list.length > 0;
  $('#fcount').textContent = 'Найдено: ' + list.length + ' ' + plural(list.length, 'проект', 'проекта', 'проектов');
  $$('.hc', grid).forEach(el => { if (first) reveal(el); });
}
$$('#filters .fgroup').forEach(g => g.addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return;
  $$('.chip', g).forEach(c => c.classList.toggle('on', c === b));
  F[g.dataset.key] = b.dataset.v; renderGrid(false);
}));
$('#freset').addEventListener('click', () => {
  Object.keys(F).forEach(k => F[k] = 'all');
  $$('#filters .fgroup').forEach(g => $$('.chip', g).forEach((c, i) => c.classList.toggle('on', i === 0)));
  renderGrid(false);
});
/* листание фото прямо в карточке */
const trkIdx = t => Math.round(t.scrollLeft / t.clientWidth);
const trkDots = t => { const i = trkIdx(t); $$('.cdots i', t.parentElement).forEach((d, k) => d.classList.toggle('on', k === i)); };
grid.addEventListener('scroll', e => { if (e.target.classList && e.target.classList.contains('trk')) trkDots(e.target); }, true);
grid.addEventListener('click', e => {
  const nv = e.target.closest('.cnav');
  if (nv) {
    e.stopPropagation();
    const t = $('.trk', nv.parentElement), n = t.children.length;
    let i = trkIdx(t) + (nv.classList.contains('n') ? 1 : -1);
    i = (i + n) % n;
    t.scrollTo({ left: i * t.clientWidth, behavior: 'smooth' });
    return;
  }
  const c = e.target.closest('.hc'); if (c) openHouse(c.dataset.id, true);
});
grid.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('hc')) { e.preventDefault(); openHouse(e.target.dataset.id, true); } });

/* ---------- окна ---------- */
let lastFocus = null;
function showModal(m) { lastFocus = document.activeElement; m.hidden = false; document.body.classList.add('lock'); setTimeout(() => { const x = $('.x', m); x && x.focus(); }, 50); }
function hideModal(m) { m.hidden = true; if ($$('.modal').every(x => x.hidden)) document.body.classList.remove('lock'); lastFocus && lastFocus.focus && lastFocus.focus(); }
$$('.modal').forEach(m => m.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) { if (m.id === 'hmodal') closeHouse(); else hideModal(m); }
}));
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const z = $('.zoom'); if (z) { z.remove(); return; }
  if (!$('#lmodal').hidden) hideModal($('#lmodal'));
  else if (!$('#hmodal').hidden) closeHouse();
});

/* ---------- окно дома ---------- */
const hmodal = $('#hmodal'), hm = $('#hm');
let pushed = false;
function openHouse(id, push) {
  const h = byId(id); if (!h) return;
  const pk = S.packages;
  hm.innerHTML =
    '<div class="gal"><div class="gal-main"><img id="g-img" src="' + img(h, h.photos[0]) + '" alt="' + esc(h.name) + '">' +
      (h.photos.length > 1 ? '<button class="gal-nav p" aria-label="Предыдущее фото">‹</button><button class="gal-nav n" aria-label="Следующее фото">›</button>' : '') + '</div>' +
      '<div class="thumbs">' + h.photos.map((p, i) => '<button class="' + (i ? '' : 'on') + '" data-i="' + i + '" aria-label="Фото ' + (i + 1) + '"><img src="' + img(h, p) + '" alt="" loading="lazy"></button>').join('') + '</div></div>' +
    '<div class="plan"><div class="plan-top"><h4>Планировка</h4><div class="row">' +
      (h.plans.length > 1 ? '<div class="tog" id="p-fl">' + h.plans.map((p, i) => '<button class="' + (i ? '' : 'on') + '" data-i="' + i + '">' + p[0] + '</button>').join('') + '</div>' : '') +
      '<div class="tog" id="p-dim"><button class="on" data-d="1">С размерами</button><button data-d="0">Без</button></div></div></div>' +
      '<img id="p-img" src="' + img(h, h.plans[0][2]) + '" alt="Планировка ' + esc(h.name) + '" loading="lazy"></div>' +
    '<div class="info"><h2 id="h-name">' + esc(h.name) + '</h2><div class="sz">' + h.size + ' м · ' + h.area + ' м² · ' + (h.floors === 2 ? 'двухэтажный' : 'одноэтажный') + (h.style ? ' · ' + h.style : '') + '</div>' +
      '<div class="kv"><div class="kv-area"><b>' + h.area + ' м²</b><span>площадь дома <button class="inf" type="button" aria-label="Пояснение к площади" aria-expanded="false">i</button></span><div class="tip" role="tooltip">' + esc(S.areaNote) + '</div></div><div><b>' + h.size + '</b><span>размер, м</span></div>' +
      '<div><b>' + (h.bedrooms || '—') + '</b><span>' + (h.bedrooms ? plural(h.bedrooms, 'спальня', 'спальни', 'спален') : 'студия') + '</span></div>' +
      '<div><b>' + h.baths + '</b><span>' + plural(h.baths, 'санузел', 'санузла', 'санузлов') + '</span></div>' +
      '<div><b>' + h.rooms + '</b><span>' + plural(h.rooms, 'комната', 'комнаты', 'комнат') + '</span></div>' +
      '<div><b>2,7 м</b><span>потолки 1 этажа</span></div></div>' +
      '<ul class="feat">' + h.features.map(f => '<li>' + esc(f).replace(/ м²/g, '\u00a0м²') + '</li>').join('') + '</ul>' +
      '<div class="txt">' + h.text.map(t => '<p>' + esc(t) + '</p>').join('') + '</div>' +
      '<div class="pk" id="h-pk">' + pk.map((p, i) => '<label><input type="radio" name="hpk" value="' + i + '"' + (i ? '' : ' checked') + '><span class="nm"><b>' + p.name + '</b><small>' + p.short + '</small></span><span class="pp">от ' + rub(h.price[i]) + '</span></label>').join('') + '</div>' +
      '<div class="days">Срок строительства: <b>' + S.buildTerm + '</b>. Оплата в четыре этапа: 20% / 40% / 20% / 20%</div>' +
      '<div class="row"><button class="btn" id="h-lead"><span class="dot"></span>Получить смету</button><button class="btn line" id="h-calc">Рассчитать с ипотекой</button></div>' +
    '</div>';
  // галерея
  let gi = 0; const gimg = $('#g-img', hm);
  const go = i => { gi = (i + h.photos.length) % h.photos.length; gimg.src = img(h, h.photos[gi]); $$('.thumbs button', hm).forEach((b, k) => b.classList.toggle('on', k === gi)); };
  $$('.thumbs button', hm).forEach(b => b.addEventListener('click', () => go(+b.dataset.i)));
  const pv = $('.gal-nav.p', hm), nx = $('.gal-nav.n', hm);
  pv && pv.addEventListener('click', () => go(gi - 1)); nx && nx.addEventListener('click', () => go(gi + 1));
  let tx = null; const gm = $('.gal-main', hm);
  gm.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  gm.addEventListener('touchend', e => { if (tx === null) return; const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 40) go(gi + (d < 0 ? 1 : -1)); tx = null; });
  // сноска к площади
  const inf = $('.inf', hm), ka = $('.kv-area', hm);
  inf.addEventListener('click', e => { e.stopPropagation(); const o = ka.classList.toggle('open'); inf.setAttribute('aria-expanded', o); });
  hm.addEventListener('click', e => { if (!e.target.closest('.kv-area')) { ka.classList.remove('open'); inf.setAttribute('aria-expanded', 'false'); } });
  // планировка
  let fl = 0, dim = 1; const pimg = $('#p-img', hm);
  const setPlan = () => { pimg.src = img(h, h.plans[fl][dim ? 2 : 1]); };
  const fe = $('#p-fl', hm);
  fe && fe.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; fl = +b.dataset.i; $$('button', fe).forEach(x => x.classList.toggle('on', x === b)); setPlan(); });
  $('#p-dim', hm).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; dim = +b.dataset.d; $$('#p-dim button', hm).forEach(x => x.classList.toggle('on', x === b)); setPlan(); });
  pimg.addEventListener('click', () => { const z = document.createElement('div'); z.className = 'zoom'; z.innerHTML = '<img src="' + pimg.src + '" alt="">'; z.addEventListener('click', () => z.remove()); document.body.appendChild(z); });
  // кнопки
  const pki = () => +($('#h-pk input:checked', hm) || { value: 0 }).value;
  $('#h-lead', hm).addEventListener('click', () => openLead('Смета: ' + h.name + ', ' + pk[pki()].name, 'Смета на ' + h.name, 'Комплектация «' + pk[pki()].name + '», от ' + rub(h.price[pki()]) + '. Оставьте телефон, посчитаем точно под ваш участок.'));
  $('#h-calc', hm).addEventListener('click', () => {
    calcSet(h.id, pki()); closeHouse();
    setTimeout(() => $('#calc').scrollIntoView({ behavior: 'smooth' }), 60);
  });
  hm.parentElement.scrollTop = 0;
  showModal(hmodal);
  if (push) { history.pushState({ house: id }, '', '#house-' + id); pushed = true; }
}
function closeHouse() {
  if (hmodal.hidden) return;
  hideModal(hmodal);
  if (location.hash.indexOf('#house-') === 0) {
    if (pushed) { pushed = false; history.back(); }
    else history.replaceState(null, '', location.pathname + location.search);
  }
}
addEventListener('popstate', () => {
  const m = location.hash.match(/^#house-(\w+)/);
  if (m) openHouse(m[1], false);
  else if (!hmodal.hidden) { pushed = false; hideModal(hmodal); }
});

/* ==========================================================
   НАШИ ОБЪЕКТЫ: лента фото + просмотр
   ========================================================== */
(function objects() {
  const O = (S.objects || []).map(n => { const k = (n < 10 ? '0' : '') + n; return ['img/objects/o' + k + 't.jpg', 'img/objects/o' + k + '.jpg']; });
  const trk = $('#otrk'); if (!trk || !O.length) { const s = $('#objects'); s && (s.hidden = true); return; }
  trk.innerHTML = O.map((o, i) => '<button class="oit" data-i="' + i + '" aria-label="Открыть фото ' + (i + 1) + '"><img src="' + o[0] + '" alt="Построенный дом АМ ДОМ, фото ' + (i + 1) + '" loading="lazy"></button>').join('');
  const step = () => Math.max(trk.clientWidth * 0.8, 260);
  $('.onav.p', trk.parentElement).addEventListener('click', () => trk.scrollBy({ left: -step(), behavior: 'smooth' }));
  $('.onav.n', trk.parentElement).addEventListener('click', () => trk.scrollBy({ left: step(), behavior: 'smooth' }));
  let cur = 0, box = null;
  const show = i => { cur = (i + O.length) % O.length; $('img', box).src = O[cur][1]; $('.lbc', box).textContent = (cur + 1) + ' / ' + O.length; };
  const close = () => { if (!box) return; box.remove(); box = null; document.body.classList.remove('lock'); removeEventListener('keydown', key); };
  const key = e => { if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') show(cur + 1); else if (e.key === 'ArrowLeft') show(cur - 1); };
  trk.addEventListener('click', e => {
    const b = e.target.closest('.oit'); if (!b) return;
    box = document.createElement('div'); box.className = 'lb';
    box.innerHTML = '<img alt="Фото объекта"><button class="lbx" aria-label="Закрыть">×</button><button class="lbn p" aria-label="Назад">‹</button><button class="lbn n" aria-label="Вперёд">›</button><div class="lbc"></div>';
    document.body.appendChild(box); document.body.classList.add('lock');
    box.addEventListener('click', ev => {
      if (ev.target.closest('.lbn')) { show(cur + (ev.target.closest('.lbn').classList.contains('n') ? 1 : -1)); return; }
      if (ev.target.tagName !== 'IMG') close();
    });
    let tx = null;
    box.addEventListener('touchstart', ev => { tx = ev.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', ev => { if (tx === null) return; const d = ev.changedTouches[0].clientX - tx; if (Math.abs(d) > 40) show(cur + (d < 0 ? 1 : -1)); tx = null; });
    addEventListener('keydown', key);
    show(+b.dataset.i);
  });
})();

/* ==========================================================
   КОМПЛЕКТАЦИИ
   ========================================================== */
const PI = S.packageItems, ptabs = $('#ptabs'), pbody = $('#pbody');
const minPrice = i => Math.min.apply(null, H.map(h => h.price[i]));
ptabs.innerHTML = S.packages.map((p, i) => '<button class="ptab' + (i ? '' : ' on') + '" role="tab" data-i="' + i + '"><div class="n">0' + (i + 1) + '</div><h3>' + p.name + '</h3><p>' + p.short + '</p><div class="from">от ' + mln(minPrice(i)) + '</div></button>').join('');
const listHTML = arr => '<div class="plist">' + arr.map(r => '<div><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></div>').join('') + '</div>';
function renderPack(i) {
  const id = S.packages[i].id;
  let html = '';
  if (i === 0) html = listHTML(PI.base);
  else {
    html = '<div class="plus">＋ Всё из «' + S.packages[i - 1].name + '» и дополнительно:</div>' + listHTML(PI[id]);
    html += '<details class="pall"><summary>Что входит во все комплектации</summary>' + listHTML(PI.base) + (i === 2 ? '<div class="plus" style="margin-top:18px">Из предчистовой:</div>' + listHTML(PI.pre) : '') + '</details>';
  }
  html += '<div class="pfoot"><p>Во всех комплектациях: пиломатериал камерной сушки, технадзор и промежуточные акты на каждом этапе, бесплатная перепланировка, гарантия 5 лет.</p>' +
    '<button class="btn" data-lead="Комплектация: ' + S.packages[i].name + '"><span class="dot"></span>Узнать цену на свой дом</button></div>';
  pbody.innerHTML = html;
}
ptabs.addEventListener('click', e => { const b = e.target.closest('.ptab'); if (!b) return; $$('.ptab', ptabs).forEach(x => x.classList.toggle('on', x === b)); renderPack(+b.dataset.i); });
renderPack(0);

/* ==========================================================
   ТЕХНОЛОГИЯ: разрез стены
   ========================================================== */
const LAYERS = [
  ['Внутренняя отделка', 'На выбор: ГКЛ 12 мм, имитация бруса или вагонка.', 53, 11],
  ['Контррейки', 'Обрешётка стен для крепления внутренней отделки.', 69.5, 5],
  ['Пароизоляционная плёнка', 'Не пускает влагу из дома в утеплитель. Стыки проклеены лентой.', 56, 17.5],
  ['Каркас и утеплитель', 'Сухая строганая доска с шагом 590 мм, между стойками каменная вата. Не горит и не оседает.', 25, 34],
  ['Плёнка гидро-ветрозащитная', 'Защищает утеплитель от ветра и воды, но выпускает пар наружу.', 38, 44],
  ['Вентзазор', 'Контробрешётка создаёт зазор, по которому уходит влага. Стена всегда сухая.', 85, 34.5],
  ['Наружная отделка', 'На выбор: сайдинг, имитация бруса, OSB, фасадная плитка Hauberg.', 62, 68]
];
(function wall() {
  const pic = $('#wallpic'), list = $('#wall-list');
  pic.innerHTML = '<div class="wimg"><img src="media/wall.jpg" alt="Разрез стены каркасного дома" loading="lazy">' +
    LAYERS.map((L, i) => '<button class="wdot" data-i="' + i + '" style="left:' + L[2] + '%;top:' + L[3] + '%" aria-label="' + L[0] + '">' + (i + 1) + '</button>').join('') + '</div>' +
    '<div class="wside"><span>← внутри</span><span>снаружи →</span></div>';
  list.innerHTML = LAYERS.map((L, i) => '<button class="wl" data-i="' + i + '"><i>' + (i + 1) + '</i><b>' + L[0] + '</b><span>' + L[1] + '</span></button>').join('');
  const set = i => {
    $$('.wdot', pic).forEach(b => b.classList.toggle('on', +b.dataset.i === i));
    $$('.wl', list).forEach(b => b.classList.toggle('on', +b.dataset.i === i));
  };
  pic.addEventListener('click', e => { const g = e.target.closest('.wdot'); if (g) set(+g.dataset.i); });
  list.addEventListener('click', e => { const b = e.target.closest('.wl'); if (b) set(+b.dataset.i); });
  set(3);
})();

/* ==========================================================
   КАЛЬКУЛЯТОР СТОИМОСТИ
   ========================================================== */
const cHouse = $('#c-house'), cPack = $('#c-pack'), cFound = $('#c-found');
cHouse.innerHTML = H.map(h => '<option value="' + h.id + '">' + h.name + ' · ' + h.area + ' м²</option>').join('');
cPack.innerHTML = S.packages.map((p, i) => '<label><input type="radio" name="cpk" value="' + i + '"' + (i ? '' : ' checked') + '><span><b>' + p.name + '</b><small>' + p.short + '</small></span></label>').join('');
cFound.innerHTML = S.foundations.map((f, i) => '<label><input type="radio" name="cfd" value="' + i + '"' + (i ? '' : ' checked') + '><span><b>' + f.name + '</b><small>' + f.note + '</small></span></label>').join('');
let calcPrice = 0;
function calc() {
  const h = byId(cHouse.value), pi = +$('input[name=cpk]:checked').value, fi = +$('input[name=cfd]:checked').value;
  const f = S.foundations[fi];
  calcPrice = Math.round(h.price[pi] * (1 + f.extra / 100) / 10000) * 10000;
  const im = $('#c-img'); const src = img(h, 'thumb'); if (im.getAttribute('src') !== src) im.src = src; im.alt = h.name;
  $('#c-name').textContent = h.name + ' · ' + S.packages[pi].name + ' · ' + f.name.toLowerCase();
  $('#c-price').textContent = 'от ' + rub(calcPrice);
  $('#c-m2').textContent = rub(calcPrice / h.area);
  $('#c-days').textContent = S.buildTerm;
}
function calcSet(id, pi) { cHouse.value = id; $$('input[name=cpk]')[pi || 0].checked = true; calc(); }
[cHouse, cPack, cFound].forEach(el => el.addEventListener('change', calc));
calc();
$('#c-lead').addEventListener('click', () => {
  const h = byId(cHouse.value), pi = +$('input[name=cpk]:checked').value, fi = +$('input[name=cfd]:checked').value;
  openLead('Калькулятор: ' + h.name + ', ' + S.packages[pi].name + ', ' + S.foundations[fi].name + ', ' + rub(calcPrice), 'Точная смета', h.name + ', ' + S.packages[pi].name.toLowerCase() + ' комплектация, от ' + rub(calcPrice) + '. Посчитаем точно под ваш участок.');
});
$('#c-tomort').addEventListener('click', () => { mSum.value = Math.min(+mSum.max, calcPrice); mort(); });

/* ==========================================================
   ИПОТЕКА
   ========================================================== */
const mProg = $('#m-prog'), mSum = $('#m-sum'), mDown = $('#m-down'), mYears = $('#m-years');
mProg.innerHTML = S.mortgage.map((m, i) => '<label><input type="radio" name="mpg" value="' + i + '"' + (i ? '' : ' checked') + '><span><b>' + m.name + '</b><small>от ' + String(m.rate).replace('.', ',') + '%</small></span></label>').join('');
mSum.value = calcPrice || 3000000; mDown.value = 20; mYears.value = 20;
const fill = el => el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min) * 100) + '%');
function mort() {
  const pr = S.mortgage[+$('input[name=mpg]:checked').value];
  mDown.min = pr.minDown; if (+mDown.value < pr.minDown) mDown.value = pr.minDown;
  const sum = +mSum.value, dp = +mDown.value, y = +mYears.value;
  const loan = sum * (1 - dp / 100), n = y * 12, r = pr.rate / 1200;
  const pay = r ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n;
  $('#m-sum-o').textContent = rub(sum);
  $('#m-down-o').textContent = rub(sum * dp / 100) + ' · ' + dp + '%';
  $('#m-years-o').textContent = y + ' ' + plural(y, 'год', 'года', 'лет');
  $('#m-pay').textContent = rub(pay);
  $('#m-loan').textContent = rub(loan);
  $('#m-rate').textContent = String(pr.rate).replace('.', ',') + '%';
  $('#m-over').textContent = rub(Math.max(0, pay * n - loan));
  [mSum, mDown, mYears].forEach(fill);
}
[mSum, mDown, mYears].forEach(el => el.addEventListener('input', mort));
mProg.addEventListener('change', mort);
mort();
$('#m-lead').addEventListener('click', () => {
  const pr = S.mortgage[+$('input[name=mpg]:checked').value];
  openLead('Ипотека: ' + pr.name + ', дом ' + rub(+mSum.value) + ', взнос ' + mDown.value + '%, ' + mYears.value + ' лет', 'Подобрать ипотеку', 'Расскажем о подходящих программах и посчитаем платёж точно.');
});

/* ==========================================================
   КВИЗ
   ========================================================== */
const Q = [
  ['Для чего вам дом?', [['p', 'Для постоянного проживания'], ['d', 'Дача и отдых'], ['g', 'Гостевой дом'], ['r', 'Сдавать в аренду']]],
  ['Сколько этажей?', [['1', 'Один этаж'], ['2', 'Два этажа'], ['any', 'Не важно']]],
  ['Сколько нужно спален?', [['0', 'Студия'], ['1', 'Одна'], ['2', 'Две'], ['3', 'Три и больше']]],
  ['Какой бюджет на дом?', [['a', 'До 2,5 млн ₽'], ['b', '2,5–3,5 млн ₽'], ['c', '3,5–5 млн ₽'], ['d', 'Больше 5 млн ₽']]],
  ['Участок уже есть?', [['yes', 'Да, есть'], ['buy', 'Покупаю сейчас'], ['no', 'Пока нет']]]
];
const QA = [], qmain = $('#qmain');
let qi = 0;
/* подбор: этажность строго, затем спальни, затем бюджет. Показываем все подходящие, а если точных нет, ближайшие */
const QB = { a: [0, 2.5e6], b: [2.5e6, 3.5e6], c: [3.5e6, 5e6], d: [5e6, 1e12] };
function qPick() {
  const [pu, fl, bd, bu] = QA;
  let pool = H.slice(), exact = true;
  if (fl === '1' || fl === '2') pool = pool.filter(h => String(h.floors) === fl);
  if (bd !== undefined) {
    const b = +bd, ok = h => b === 3 ? h.bedrooms >= 3 : h.bedrooms === b;
    const m = pool.filter(ok);
    if (m.length) pool = m;
    else { exact = false; const dist = h => Math.abs(Math.min(h.bedrooms, 3) - b), md = Math.min.apply(null, pool.map(dist)); pool = pool.filter(h => dist(h) === md); }
  }
  const R = QB[bu];
  if (R) {
    const gap = h => { const p = h.price[0]; return p < R[0] ? R[0] - p : p > R[1] ? p - R[1] : 0; };
    const m = pool.filter(h => gap(h) === 0);
    if (m.length) pool = m;
    else { exact = false; pool.sort((x, y) => gap(x) - gap(y)); pool = pool.slice(0, 3); }
  }
  const pref = h => pu === 'p' ? -h.area : (pu ? h.area : 0);
  pool.sort((x, y) => pref(x) - pref(y) || x.price[0] - y.price[0]);
  return { list: pool.slice(0, 6), exact: exact };
}
function qRender() {
  $('#qbar').style.width = (qi / Q.length * 100) + '%';
  if (qi < Q.length) {
    $('#qstep').textContent = 'Вопрос ' + (qi + 1) + ' из ' + Q.length;
    const q = Q[qi];
    qmain.innerHTML = '<h3>' + q[0] + '</h3><div class="qopts">' + q[1].map(o => '<button class="qopt' + (QA[qi] === o[0] ? ' on' : '') + '" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>' +
      '<div class="qnav"><button class="qback"' + (qi ? '' : ' disabled') + '>← Назад</button><span class="muted">Выберите вариант</span></div>';
    $$('.qopt', qmain).forEach(b => b.addEventListener('click', () => { QA[qi] = b.dataset.v; $$('.qopt', qmain).forEach(x => x.classList.toggle('on', x === b)); setTimeout(() => { qi++; qRender(); }, 220); }));
  } else {
    $('#qstep').textContent = 'Готово! Осталось оставить контакты';
    const pick = qPick(), top = pick.list;
    const answers = Q.map((q, i) => q[0] + ' ' + ((q[1].find(o => o[0] === QA[i]) || [, ''])[1])).join('; ');
    qmain.innerHTML = '<h3>' + (pick.exact ? (top.length === 1 ? 'Вам подойдёт этот проект' : 'Вам подойдут эти проекты') : 'Точного совпадения нет, вот самые близкие проекты') + '</h3>' + (pick.exact ? '' : '<p class="muted qnote">Любой из них можем доработать под ваши пожелания.</p>') + '<div class="qres">' + top.map(h => '<a data-id="' + h.id + '"><img src="' + img(h, 'thumb') + '" alt=""><span>' + h.name + '<small>' + h.area + ' м² · от ' + mln(h.price[0]) + '</small></span></a>').join('') + '</div>' +
      '<form class="form" data-form data-topic="Квиз. ' + esc(answers) + '. Подобрано: ' + top.map(h => h.name).join(', ') + '">' +
      '<p class="muted">Оставьте телефон: пришлём подборку со сметами и ответим на вопросы.</p>' +
      '<input name="name" placeholder="Ваше имя" autocomplete="name" required><input name="phone" type="tel" placeholder="+7 (___) ___-__-__" autocomplete="tel" required>' +
      '<div class="seg small-seg" data-contact><label><input type="radio" name="contact" value="Звонок" checked><span>Звонок</span></label><label><input type="radio" name="contact" value="Telegram"><span>Telegram</span></label><label><input type="radio" name="contact" value="MAX"><span>MAX</span></label></div>' +
      '<label class="agree"><input type="checkbox" name="agree" required><span>Согласен на обработку персональных данных и с <a href="policy.html" target="_blank">политикой конфиденциальности</a></span></label>' +
      '<div class="qnav"><button type="button" class="qback">← Назад</button><button class="btn" type="submit"><span class="dot"></span>Получить подборку</button></div></form>';
    $$('.qres a', qmain).forEach(a => a.addEventListener('click', () => openHouse(a.dataset.id, true)));
    initForm($('form', qmain));
  }
  const bk = $('.qback', qmain); bk && bk.addEventListener('click', () => { if (qi > 0) { qi--; qRender(); } });
}
qRender();

/* ---------- вопросы ---------- */
$('#faqlist').innerHTML = S.faq.map(g => '<div class="faqg"><h3>' + esc(g[0]) + '</h3>' + g[1].map(f => '<details><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>').join('') + '</div>').join('');

/* ---------- отзывы и цифры (показываются, только если заполнены) ---------- */
if (S.reviews && S.reviews.length) {
  $('#reviews').hidden = false;
  $('#revlist').innerHTML = S.reviews.map(r => '<div class="rv"><p>' + esc(r.text) + '</p><b>' + esc(r.name) + '</b><small>' + esc(r.house || '') + '</small></div>').join('');
}
if (S.stats && S.stats.length) {
  $('#stats').hidden = false;
  $('#stats').innerHTML = S.stats.map(s => '<div><b>' + esc(s[0]) + '</b>' + esc(s[1]) + '</div>').join('');
}

/* ==========================================================
   ЗАЯВКИ
   ========================================================== */
const lmodal = $('#lmodal'), lform = $('#lform');
const lformHTML = lform.innerHTML;
function openLead(topic, title, sub) {
  lform.innerHTML = lformHTML; delete lform.dataset.ready;
  lform.dataset.topic = topic || 'Заявка с сайта';
  $('#l-title', lform).textContent = title || 'Оставьте заявку';
  $('#l-sub', lform).textContent = sub || 'Оставьте телефон, менеджер перезвонит и всё посчитает.';
  initForm(lform);
  showModal(lmodal);
  setTimeout(() => { const n = $('input[name=name]', lform); n && n.focus(); }, 80);
}
document.addEventListener('click', e => { const b = e.target.closest('[data-lead]'); if (b) openLead(b.dataset.lead, 'Оставьте заявку'); });

function phoneMask(inp) {
  inp.addEventListener('input', () => {
    let d = inp.value.replace(/\D/g, '');
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    let s = '+7';
    if (d.length > 1) s += ' (' + d.slice(1, 4);
    if (d.length >= 4) s += ')';
    if (d.length > 4) s += ' ' + d.slice(4, 7);
    if (d.length > 7) s += '-' + d.slice(7, 9);
    if (d.length > 9) s += '-' + d.slice(9, 11);
    inp.value = s;
  });
  inp.addEventListener('focus', () => { if (!inp.value) inp.value = '+7 '; });
  inp.addEventListener('blur', () => { if (inp.value.replace(/\D/g, '').length <= 1) inp.value = ''; });
}
function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(el._t); el._t = setTimeout(() => el.hidden = true, 4000); }
function initForm(f) {
  if (!f || f.dataset.ready) return; f.dataset.ready = '1';
  const ph = $('input[name=phone]', f); ph && phoneMask(ph);
  f.setAttribute('novalidate', '');
  f.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    const name = $('input[name=name]', f), phone = $('input[name=phone]', f), agree = $('input[name=agree]', f);
    $$('.err', f).forEach(x => x.classList.remove('err'));
    if (!name.value.trim()) { name.classList.add('err'); ok = false; }
    if (phone.value.replace(/\D/g, '').length < 11) { phone.classList.add('err'); ok = false; }
    if (!agree.checked) { agree.closest('.agree').classList.add('err'); ok = false; }
    if (!ok) { toast('Заполните имя, телефон и отметьте согласие'); return; }
    const data = {
      topic: f.dataset.topic || 'Заявка с сайта', name: name.value.trim(), phone: phone.value,
      contact: ($('input[name=contact]:checked', f) || {}).value || '', comment: ($('textarea[name=comment]', f) || {}).value || '',
      page: location.href
    };
    const btn = $('button[type=submit]', f); btn.disabled = true;
    const done = () => {
      f.innerHTML = '<div class="done"><div class="ok"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h3>Спасибо, ' + esc(data.name) + '!</h3><p>Заявка отправлена. Мы свяжемся с вами в ближайшее время.</p></div>';
      if (window.ym && S.metrikaId) try { ym(S.metrikaId, 'reachGoal', 'lead'); } catch (e) {}
    };
    if (S.forms.demo) { setTimeout(done, 500); return; }
    fetch(S.forms.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(r => r.ok ? r.json() : Promise.reject()).then(j => { if (j && j.ok) done(); else throw 0; })
      .catch(() => { btn.disabled = false; toast('Не получилось отправить. Позвоните нам: ' + C.phone); });
  });
}
$$('form[data-form]').forEach(initForm);

/* ---------- появление блоков ---------- */
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
function reveal(el) { if (!io) return; el.classList.add('rev'); io.observe(el); }
$$('.sec .head, .wi, .steps li, .ptabs, .pbody, .wall, .calc, .mort, .quiz, .custom, .faq, .contacts > *').forEach(reveal);
renderGrid(true);

/* ---------- cookie ---------- */
if (!lsGet('amdom-cookie')) {
  // на телефоне показываем после главного экрана, чтобы не закрывать кнопки
  const showCk = () => { if (!small || build.getBoundingClientRect().bottom < innerHeight * 0.5) { $('#cookie').hidden = false; removeEventListener('scroll', showCk); } };
  addEventListener('scroll', showCk, { passive: true }); showCk();
}
$('#cookie-ok').addEventListener('click', () => { lsSet('amdom-cookie', '1'); $('#cookie').remove(); });

/* ---------- Яндекс Метрика (подключится, когда в data.js будет номер) ---------- */
if (S.metrikaId) {
  (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date(); k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a); })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
  ym(S.metrikaId, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
}

/* ---------- открыть дом по ссылке вида сайт/#house-prostor ---------- */
const m0 = location.hash.match(/^#house-(\w+)/);
if (m0) openHouse(m0[1], false);
})();
