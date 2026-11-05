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
$$('[data-max]').forEach(a => { if (C.max) { a.href = C.max; a.hidden = false; } });
$$('[data-avito]').forEach(a => { if (C.avito) { a.href = C.avito; a.hidden = false; } });
$$('[data-vk]').forEach(a => { if (C.vk) { a.href = C.vk; a.hidden = false; } });
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
  /* ТЕЛЕФОН: ролик просто проигрывается сам, один экран, без долгой прокрутки */
  build.classList.add('m');
  vid.src = VSRC; vid.muted = true; vid.setAttribute('muted', ''); vid.preload = 'auto';
  hint.style.display = 'none';
  const replay = $('#replay');
  const showFinal = () => {
    night.style.opacity = 1; fin.classList.add('on'); build.classList.add('ended'); replay.hidden = false;
  };
  replay.addEventListener('click', () => {
    build.classList.remove('ended'); fin.classList.remove('on'); night.style.opacity = 0; replay.hidden = true;
    stageIdx = -1; vid.currentTime = 0; setStage(0); const pr = vid.play(); if (pr && pr.catch) pr.catch(showFinal);
  });
  vid.addEventListener('timeupdate', () => {
    setStage(vid.currentTime);
  });
  vid.addEventListener('ended', showFinal);
  const tryPlay = () => { const pr = vid.play(); if (pr && pr.catch) pr.catch(() => setTimeout(showFinal, 600)); };
  // 1,5 секунды показываем заголовок на фоне свай, потом запускаем стройку
  setTimeout(() => { if (vid.readyState >= 2) tryPlay(); else vid.addEventListener('canplay', tryPlay, { once: true }); }, 1500);
  card.classList.add('on'); setStage(0);
  topbar.classList.add('solid');
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
function cardHTML(h) {
  const badges = [h.floors === 2 ? '2 этажа' : '1 этаж'];
  if (h.style) badges.push(h.style);
  const spec = [bedTxt(h.bedrooms), h.baths + ' ' + plural(h.baths, 'санузел', 'санузла', 'санузлов')];
  if (h.outdoorArea) spec.push((h.outdoor.split(',')[0]).replace(' и балкон', ' + балкон'));
  return '<article class="hc" data-id="' + h.id + '" tabindex="0" role="button" aria-label="' + esc(h.name) + ', подробнее">' +
    '<div class="ph"><img src="' + img(h, 'thumb') + '" alt="' + esc(h.name) + '" loading="lazy">' +
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
grid.addEventListener('click', e => { const c = e.target.closest('.hc'); if (c) openHouse(c.dataset.id, true); });
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
      '<div class="kv"><div><b>' + h.area + ' м²</b><span>площадь дома</span></div><div><b>' + h.size + '</b><span>размер, м</span></div>' +
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
  ['Внутренняя отделка', 'В предчистовой ГКЛ 12 мм, в чистовой имитация бруса из лиственницы сорта АВ.'],
  ['Пароизоляция Изоспан RS', 'Не пускает влагу из дома в утеплитель. Стыки проклеены лентой Изоспан Proff.'],
  ['Каркас и утеплитель', 'Сухая строганая доска 45×145 мм с шагом 590 мм, между стойками каменная вата ТЕХНОНИКОЛЬ РОКЛАЙТ 200 мм. Не горит и не оседает.'],
  ['Мембрана Изоспан АМ', 'Супердиффузионная мембрана защищает утеплитель от ветра и воды, но выпускает пар наружу.'],
  ['Вентзазор', 'Контробрешётка 45×45 мм создаёт зазор, по которому уходит влага. Стена всегда сухая.'],
  ['Сайдинг «Блок-Хаус»', 'Сайдинг Docke под бревно цвета дерево. Не нужно красить, можно выбрать любой цвет.']
];
(function wall() {
  const svg = $('#wallsvg'), list = $('#wall-list'), NS = 'http://www.w3.org/2000/svg';
  const W = 196, HH = 236;
  const defs = '<defs>' +
    '<pattern id="pt-board" width="196" height="22" patternUnits="userSpaceOnUse"><rect width="196" height="22" fill="#efe4d0"/><rect y="21" width="196" height="1.4" fill="#cdb894"/></pattern>' +
    '<pattern id="pt-wool" width="22" height="14" patternUnits="userSpaceOnUse"><rect width="22" height="14" fill="#cbbd73"/><path d="M0 7 q5.5 -6 11 0 t11 0" fill="none" stroke="#b3a45c" stroke-width="1.6"/></pattern>' +
    '<pattern id="pt-film" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#f6f7f8"/><path d="M0 20h40" stroke="#9fb6c9" stroke-width="1"/><text x="3" y="14" font-size="7" fill="#7f9bb3" font-family="Inter">ИЗОСПАН</text></pattern>' +
    '<pattern id="pt-vapor" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="#9fb3c4" fill-opacity=".85"/><path d="M0 30L30 0" stroke="#8aa0b3" stroke-width="1"/></pattern>' +
    '<linearGradient id="gr-log" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9b88a"/><stop offset=".55" stop-color="#c6a273"/><stop offset="1" stop-color="#9c7a50"/></linearGradient>' +
    '<pattern id="pt-log" width="196" height="26" patternUnits="userSpaceOnUse"><rect width="196" height="26" fill="url(#gr-log)"/><rect y="24.6" width="196" height="1.4" fill="#7d5f3c"/></pattern>' +
    '</defs>';
  let out = defs;
  LAYERS.forEach((L, i) => {
    const ox = 40 + i * 50, oy = 92 + i * 12;
    let body = '';
    if (i === 0) body = '<rect width="' + W + '" height="' + HH + '" fill="url(#pt-board)"/>';
    if (i === 1) body = '<rect width="' + W + '" height="' + HH + '" fill="url(#pt-vapor)"/>';
    if (i === 2) { body = '<rect width="' + W + '" height="' + HH + '" fill="url(#pt-wool)"/>'; for (let x = 0; x < W; x += 58) body += '<rect x="' + x + '" width="12" height="' + HH + '" fill="#d8b98a" stroke="#a8875c" stroke-width="1"/>'; }
    if (i === 3) body = '<rect width="' + W + '" height="' + HH + '" fill="url(#pt-film)"/>';
    if (i === 4) { body = '<rect width="' + W + '" height="' + HH + '" fill="rgba(243,236,225,.06)" stroke="rgba(243,236,225,.25)" stroke-dasharray="4 4"/>'; for (let x = 8; x < W; x += 58) body += '<rect x="' + x + '" width="10" height="' + HH + '" fill="#cfae7f" stroke="#a8875c" stroke-width="1"/>'; }
    if (i === 5) body = '<rect width="' + W + '" height="' + HH + '" fill="url(#pt-log)"/>';
    out += '<g class="ly" data-i="' + i + '"><g transform="translate(' + ox + ' ' + oy + ') skewY(-14)">' + body +
      '<rect width="' + W + '" height="' + HH + '" fill="none" stroke="rgba(0,0,0,.25)"/>' +
      '<circle cx="18" cy="20" r="11" fill="#3B2A1F" stroke="#C6A273" stroke-width="1.5"/><text x="18" y="24.5" text-anchor="middle" font-size="12" font-weight="700">' + (i + 1) + '</text></g></g>';
  });
  out += '<text x="40" y="396" fill-opacity=".6">внутри</text><text x="520" y="396" text-anchor="end" fill-opacity=".6">снаружи</text>' +
    '<path d="M92 391 H452" stroke="rgba(243,236,225,.35)" stroke-width="1.2" marker-end="url(#ar)"/>';
  out = out.replace('</defs>', '<marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="rgba(243,236,225,.5)"/></marker></defs>');
  svg.innerHTML = out;
  list.innerHTML = LAYERS.map((L, i) => '<button class="wl" data-i="' + i + '"><i>' + (i + 1) + '</i><b>' + L[0] + '</b><span>' + L[1] + '</span></button>').join('');
  const set = i => {
    svg.classList.toggle('act', i !== null);
    $$('.ly', svg).forEach(g => g.classList.toggle('on', +g.dataset.i === i));
    $$('.wl', list).forEach(b => b.classList.toggle('on', +b.dataset.i === i));
  };
  svg.addEventListener('click', e => { const g = e.target.closest('.ly'); if (g) set(+g.dataset.i); });
  list.addEventListener('click', e => { const b = e.target.closest('.wl'); if (b) set(+b.dataset.i); });
  set(2);
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
function qScore(h) {
  let s = 0; const [pu, fl, bd, bu] = QA;
  if (fl && fl !== 'any') s += String(h.floors) === fl ? 3 : -3;
  if (bd !== undefined) { const b = +bd; if (b === 3 ? h.bedrooms >= 3 : h.bedrooms === b) s += 4; else if (Math.abs(h.bedrooms - b) === 1) s += 1; }
  const p = h.price[0], R = { a: [0, 2.5e6], b: [2.5e6, 3.5e6], c: [3.5e6, 5e6], d: [5e6, 1e9] }[bu];
  if (R) s += (p >= R[0] && p <= R[1]) ? 4 : (p < R[0] ? 1 : -2);
  if (pu === 'p') s += h.area >= 55 ? 2 : 0; else if (pu) s += h.area <= 50 ? 2 : 0;
  return s;
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
    const top = H.map(h => [h, qScore(h)]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
    const answers = Q.map((q, i) => q[0] + ' ' + ((q[1].find(o => o[0] === QA[i]) || [, ''])[1])).join('; ');
    qmain.innerHTML = '<h3>Вам подойдут эти проекты</h3><div class="qres">' + top.map(h => '<a data-id="' + h.id + '"><img src="' + img(h, 'thumb') + '" alt=""><span>' + h.name + '<small>' + h.area + ' м² · от ' + mln(h.price[0]) + '</small></span></a>').join('') + '</div>' +
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
