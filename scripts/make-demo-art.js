#!/usr/bin/env node
'use strict';
/*
 * Membuat ilustrasi SVG untuk ketiga klien demo (npm run art).
 * Ilustrasi ini karya orisinal untuk template (bebas dipakai), berukuran
 * beberapa KB saja. Untuk klien sungguhan, ganti dengan foto asli lewat editor.
 */
const fs = require('fs');
const path = require('path');

const C = {
  cream: '#FBF6EE', milk: '#FFF9EF', sand: '#F1E3CC', oat: '#E6D2B3', latte: '#D2A679', caramel: '#C4853F',
  terra: '#B8451F', brick: '#8F3215', brown: '#5A3620', espresso: '#2A1D15', mustard: '#EFB949', gold: '#D9A441',
  sage: '#A9BC92', green: '#4D6B4A', matcha: '#9DB86A', blush: '#F2CDB5', choc: '#4A2E1F', dough: '#DBA25A', crust: '#B5722E', white: '#FFFFFF'
};

let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const R = (a, b) => a + rnd() * (b - a);
const n = (v) => Math.round(v * 10) / 10;
const g = (x, y, rot, s, inner) => `<g transform="translate(${n(x)} ${n(y)})${rot ? ` rotate(${n(rot)})` : ''}${s && s !== 1 ? ` scale(${n(s)})` : ''}">${inner}</g>`;
const shadow = (r, dx = 0.1, dy = 0.14, o = 0.16) => `<circle cx="${n(r * dx)}" cy="${n(r * dy)}" r="${n(r * 1.02)}" fill="#1b0f08" opacity="${o}"/>`;

/* ---------- objek ---------- */
function plate(x, y, r, col = C.milk, ring = C.oat) {
  return g(x, y, 0, 1, shadow(r) + `<circle r="${r}" fill="${col}"/><circle r="${n(r * 0.74)}" fill="none" stroke="${ring}" stroke-width="${n(r * 0.03)}"/>`);
}
function rosetta(r, col) {
  let s = '';
  for (let i = 0; i < 6; i++) {
    const y = r * (0.42 - i * 0.16), w = r * (0.5 - i * 0.065);
    s += `<path d="M${n(-w)} ${n(y - r * 0.1)}Q0 ${n(y + r * 0.2)} ${n(w)} ${n(y - r * 0.1)}" fill="none" stroke="${col}" stroke-width="${n(r * 0.085)}" stroke-linecap="round"/>`;
  }
  return s + `<path d="M0 ${n(r * 0.56)}V${n(-r * 0.5)}" stroke="${col}" stroke-width="${n(r * 0.05)}" stroke-linecap="round"/><circle cy="${n(-r * 0.56)}" r="${n(r * 0.08)}" fill="${col}"/>`;
}
function heart(r, col) {
  const s = r / 100;
  return `<path transform="scale(${n(s)})" d="M0 46C-46 12-52-22-28-34-12-42 0-30 0-20 0-30 12-42 28-34 52-22 46 12 0 46Z" fill="${col}"/><path transform="scale(${n(s)})" d="M0 46q4 14 0 26" stroke="${col}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
}
function cup(x, y, r, o = {}) {
  const liquid = o.liquid || C.caramel, body = o.body || C.white, hr = o.handle == null ? 35 : o.handle;
  let s = '';
  if (o.saucer !== false) s += shadow(r * 1.5, 0.06, 0.09, 0.14) + `<circle r="${n(r * 1.5)}" fill="${o.saucer || C.milk}"/><circle r="${n(r * 1.18)}" fill="none" stroke="#000" stroke-opacity=".07" stroke-width="${n(r * 0.04)}"/>`;
  s += shadow(r, 0.1, 0.13, 0.2);
  s += `<g transform="rotate(${hr})"><rect x="${n(r * 0.86)}" y="${n(-r * 0.15)}" width="${n(r * 0.56)}" height="${n(r * 0.3)}" rx="${n(r * 0.15)}" fill="${body}"/><rect x="${n(r * 0.86)}" y="${n(r * 0.06)}" width="${n(r * 0.56)}" height="${n(r * 0.09)}" rx="${n(r * 0.04)}" fill="#000" opacity=".08"/></g>`;
  s += `<circle r="${r}" fill="${body}"/><circle r="${n(r * 0.9)}" fill="#000" opacity=".09"/><circle r="${n(r * 0.85)}" fill="${liquid}"/>`;
  if (o.crema) s += `<circle r="${n(r * 0.85)}" fill="none" stroke="${o.crema}" stroke-width="${n(r * 0.1)}" opacity=".55"/>`;
  if (o.art === 'rosetta') s += g(0, 0, o.artRot || 0, 1, rosetta(r * 0.86, o.artCol || C.milk));
  if (o.art === 'heart') s += g(0, 0, o.artRot || 0, 1, heart(r * 0.52, o.artCol || C.milk));
  s += `<path d="M${n(-r * 0.93)} ${n(-r * 0.2)}A${n(r * 0.95)} ${n(r * 0.95)} 0 0 1 ${n(-r * 0.3)} ${n(-r * 0.9)}" fill="none" stroke="#fff" stroke-width="${n(r * 0.035)}" stroke-linecap="round" opacity=".9"/>`;
  return g(x, y, 0, 1, s);
}
function glass(x, y, r, o = {}) {
  const liquid = o.liquid || C.latte, swirl = o.swirl || C.milk;
  let s = shadow(r, 0.12, 0.15, 0.2) + `<circle r="${r}" fill="#fff" opacity=".9"/><circle r="${n(r * 0.92)}" fill="#dfe7e6" opacity=".8"/><circle r="${n(r * 0.86)}" fill="${liquid}"/>`;
  s += `<path d="M${n(-r * 0.6)} ${n(r * 0.1)}C${n(-r * 0.5)} ${n(-r * 0.7)} ${n(r * 0.5)} ${n(-r * 0.75)} ${n(r * 0.55)} ${n(-r * 0.05)}C${n(r * 0.55)} ${n(r * 0.5)} ${n(-r * 0.15)} ${n(r * 0.6)} ${n(-r * 0.2)} ${n(r * 0.15)}C${n(-r * 0.22)} ${n(-r * 0.15)} ${n(r * 0.15)} ${n(-r * 0.2)} ${n(r * 0.12)} ${n(r * 0.05)}" fill="none" stroke="${swirl}" stroke-width="${n(r * 0.14)}" stroke-linecap="round" opacity=".8"/>`;
  (o.ice || [[-0.3, -0.28, 14], [0.3, -0.05, -22], [-0.12, 0.36, 38]]).forEach(([ix, iy, ir]) => {
    const z = r * 0.42;
    s += `<rect x="${n(ix * r - z / 2)}" y="${n(iy * r - z / 2)}" width="${n(z)}" height="${n(z)}" rx="${n(z * 0.22)}" transform="rotate(${ir} ${n(ix * r)} ${n(iy * r)})" fill="#fff" fill-opacity=".5" stroke="#fff" stroke-opacity=".85" stroke-width="${n(r * 0.03)}"/>`;
  });
  if (o.straw !== false) {
    const a = (o.straw == null ? -50 : o.straw) * Math.PI / 180, x1 = Math.cos(a) * r * 0.25, y1 = Math.sin(a) * r * 0.25, x2 = Math.cos(a) * r * 1.5, y2 = Math.sin(a) * r * 1.5;
    s += `<path d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}" stroke="#1b0f08" stroke-opacity=".14" stroke-width="${n(r * 0.17)}" stroke-linecap="round" transform="translate(${n(r * 0.05)} ${n(r * 0.09)})"/>`;
    s += `<path d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}" stroke="${o.strawCol || C.terra}" stroke-width="${n(r * 0.15)}" stroke-linecap="round"/>`;
    s += `<path d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}" stroke="#fff" stroke-width="${n(r * 0.15)}" stroke-dasharray="${n(r * 0.09)} ${n(r * 0.2)}" opacity=".55"/>`;
  }
  s += `<path d="M${n(-r * 0.95)} ${n(-r * 0.15)}A${n(r * 0.96)} ${n(r * 0.96)} 0 0 1 ${n(-r * 0.35)} ${n(-r * 0.9)}" fill="none" stroke="#fff" stroke-width="${n(r * 0.04)}" stroke-linecap="round"/>`;
  return g(x, y, 0, 1, s);
}
function croissant(x, y, s, rot) {
  const body = 'M-108 30C-104-40-58-94 0-96C58-94 104-40 108 30C112 58 90 66 78 50C62 4 38-14 0-14C-38-14-62 4-78 50C-90 66-112 58-108 30Z';
  let d = `<path d="${body}" fill="#1b0f08" opacity=".17" transform="translate(8 14)"/><path d="${body}" fill="${C.dough}"/>`;
  [[-82, 32, -96, -8], [-58, -6, -78, -52], [-30, -14, -42, -82], [0, -14, 0, -96], [30, -14, 42, -82], [58, -6, 78, -52], [82, 32, 96, -8]].forEach(([a, b, c, e]) => {
    d += `<path d="M${a} ${b}Q${n((a + c) / 2 + 8)} ${n((b + e) / 2)} ${c} ${e}" stroke="${C.crust}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".75"/>`;
  });
  d += `<path d="M-64-52Q-34-80 0-82Q34-80 64-52" stroke="#F1C987" stroke-width="9" fill="none" stroke-linecap="round" opacity=".7"/>`;
  return g(x, y, rot, s, d);
}
function cookie(x, y, r, rot = 0) {
  let s = shadow(r, 0.08, 0.12, 0.2), pts = [];
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, rr = r * R(0.94, 1.03); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  let d = '';
  pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; d += (i ? '' : `M${n((pts[13][0] + p[0]) / 2)} ${n((pts[13][1] + p[1]) / 2)}`) + `Q${n(p[0])} ${n(p[1])} ${n(mx)} ${n(my)}`; });
  s += `<path d="${d}Z" fill="${C.caramel}"/><circle r="${n(r * 0.8)}" fill="#D49A55" opacity=".7"/>`;
  for (let i = 0; i < 9; i++) {
    const a = R(0, 6.28), rr = r * R(0.1, 0.72), z = r * R(0.13, 0.22);
    s += `<rect x="${n(Math.cos(a) * rr - z / 2)}" y="${n(Math.sin(a) * rr - z / 2)}" width="${n(z)}" height="${n(z * R(0.7, 1))}" rx="${n(z * 0.3)}" transform="rotate(${n(R(0, 90))} ${n(Math.cos(a) * rr)} ${n(Math.sin(a) * rr)})" fill="${C.choc}"/>`;
  }
  for (let i = 0; i < 7; i++) { const a = R(0, 6.28), rr = r * R(0.1, 0.75); s += `<rect x="${n(Math.cos(a) * rr)}" y="${n(Math.sin(a) * rr)}" width="${n(r * 0.05)}" height="${n(r * 0.05)}" fill="#fff" opacity=".85"/>`; }
  return g(x, y, rot, 1, s);
}
function donut(x, y, r, glaze, hole) {
  let s = shadow(r, 0.08, 0.12, 0.2) + `<circle r="${r}" fill="${C.dough}"/>`, d = '';
  for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 2, rr = r * (0.84 + (i % 2 ? 0.05 : -0.03)); d += (i ? 'L' : 'M') + n(Math.cos(a) * rr) + ' ' + n(Math.sin(a) * rr); }
  s += `<path d="${d}Z" fill="${glaze}" stroke="${glaze}" stroke-width="${n(r * 0.1)}" stroke-linejoin="round"/>`;
  const cols = [C.white, C.mustard, C.terra, C.green];
  if (glaze !== C.dough) for (let i = 0; i < 16; i++) {
    const a = R(0, 6.28), rr = r * R(0.42, 0.78);
    s += `<rect x="${n(Math.cos(a) * rr)}" y="${n(Math.sin(a) * rr)}" width="${n(r * 0.14)}" height="${n(r * 0.045)}" rx="${n(r * 0.02)}" transform="rotate(${n(R(0, 180))} ${n(Math.cos(a) * rr)} ${n(Math.sin(a) * rr)})" fill="${cols[i % 4] === glaze ? C.white : cols[i % 4]}"/>`;
  }
  s += `<circle r="${n(r * 0.3)}" fill="${C.crust}" opacity=".55"/><circle r="${n(r * 0.25)}" fill="${hole}"/>`;
  s += `<path d="M${n(-r * 0.7)} ${n(-r * 0.25)}A${n(r * 0.75)} ${n(r * 0.75)} 0 0 1 ${n(-r * 0.2)} ${n(-r * 0.72)}" fill="none" stroke="#fff" stroke-width="${n(r * 0.05)}" stroke-linecap="round" opacity=".5"/>`;
  return g(x, y, 0, 1, s);
}
function bean(x, y, rot, s = 1, col = C.brown) {
  return g(x, y, rot, s, `<ellipse cx="2" cy="3" rx="15" ry="21" fill="#1b0f08" opacity=".16"/><ellipse rx="15" ry="21" fill="${col}"/><path d="M-2-19Q7-7-2 0Q-9 8 2 19" fill="none" stroke="${C.espresso}" stroke-width="3" stroke-linecap="round"/><path d="M-9-10Q-12 0-8 9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".22"/>`);
}
function beans(list, s = 1) { return list.map(([x, y, r]) => bean(x, y, r, s)).join(''); }
function leaf(x, y, rot, s = 1, col = C.green) {
  return g(x, y, rot, s, `<path d="M0 0C28-42 84-44 118 0C84 44 28 42 0 0Z" fill="#1b0f08" opacity=".13" transform="translate(5 9)"/><path d="M0 0C28-42 84-44 118 0C84 44 28 42 0 0Z" fill="${col}"/><path d="M6 0H108M34 0L50-20M34 0L50 20M62 0L78-18M62 0L78 18" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>`);
}
function spoon(x, y, rot, s = 1, col = C.gold) {
  return g(x, y, rot, s, `<g fill="#1b0f08" opacity=".15" transform="translate(4 8)"><ellipse rx="20" ry="28"/><rect x="-5" y="20" width="10" height="150" rx="5"/></g><rect x="-5" y="20" width="10" height="150" rx="5" fill="${col}"/><ellipse rx="20" ry="28" fill="${col}"/><ellipse cx="-3" cy="-3" rx="12" ry="19" fill="#fff" opacity=".28"/>`);
}
function napkin(x, y, w, h, rot, col = C.terra) {
  let s = `<rect x="6" y="10" width="${w}" height="${h}" rx="8" fill="#1b0f08" opacity=".12"/><rect width="${w}" height="${h}" rx="8" fill="${col}"/>`;
  for (let i = 1; i < 4; i++) s += `<path d="M${n(w * 0.12)} ${n(h * 0.25 * i)}H${n(w * 0.88)}" stroke="#fff" stroke-opacity=".28" stroke-width="5"/>`;
  return g(x, y, rot, 1, s);
}
function wood(w, h, col = '#E3C9A4', line = '#D2B285') {
  let s = `<rect width="${w}" height="${h}" fill="${col}"/>`;
  for (let i = 1; i < 5; i++) s += `<path d="M0 ${n(h / 5 * i)}H${w}" stroke="${line}" stroke-width="3"/>`;
  for (let i = 0; i < 9; i++) { const x = R(0, w), y = Math.floor(R(0, 5)) * h / 5 + R(20, h / 5 - 20); s += `<path d="M${n(x)} ${n(y)}q${n(R(40, 90))} ${n(R(-8, 8))} ${n(R(120, 220))} 0" stroke="${line}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>`; }
  return s;
}
function lantern(x, y, s = 1) {
  return g(x, y, 0, s, `<path d="M0-64V-38" stroke="${C.espresso}" stroke-width="4"/><rect x="-20" y="-40" width="40" height="10" rx="3" fill="${C.espresso}"/><rect x="-24" y="-30" width="48" height="56" rx="8" fill="${C.mustard}"/><rect x="-24" y="-30" width="48" height="56" rx="8" fill="none" stroke="${C.espresso}" stroke-width="4"/><path d="M-8-30V26M8-30V26" stroke="${C.espresso}" stroke-width="3" opacity=".5"/><rect x="-16" y="26" width="32" height="8" rx="3" fill="${C.espresso}"/><circle r="46" fill="${C.mustard}" opacity=".18"/>`);
}
function bag(x, y, s = 1, col = '#C9A77A', label = C.cream) {
  return g(x, y, 0, s, `<ellipse cy="150" rx="98" ry="14" fill="#1b0f08" opacity=".14"/><path d="M-80-110H80L88 150H-88Z" fill="${col}"/><path d="M-80-110H80L76-142H-76Z" fill="#B08D5E"/><rect x="-34" y="-136" width="68" height="18" rx="4" fill="${C.espresso}"/><rect x="-56" y="-56" width="112" height="132" rx="10" fill="${label}"/>` +
    lanternMark(0, -14, 0.5) + `<text y="42" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="17" fill="${C.espresso}" letter-spacing="1">LENTERA</text><text y="60" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="${C.brown}" letter-spacing="2">HOUSE BLEND</text><path d="M-80-110L-88 150" stroke="#000" stroke-opacity=".08" stroke-width="12"/>`);
}
function lanternMark(x, y, s) { return g(x, y, 0, s, `<rect x="-18" y="-30" width="36" height="8" rx="3" fill="${C.terra}"/><rect x="-22" y="-22" width="44" height="46" rx="8" fill="${C.mustard}" stroke="${C.terra}" stroke-width="5"/><rect x="-14" y="24" width="28" height="7" rx="3" fill="${C.terra}"/>`); }
function pot(x, y, s = 1, col = C.terra, leafCol = C.green) {
  let l = '';
  [[-150, 1], [-120, 0.9], [-90, 1.1], [-60, 0.9], [-30, 1]].forEach(([a, k]) => { l += `<g transform="rotate(${a})"><path d="M0 0C${20 * k}-22 ${62 * k}-22 ${86 * k} 0C${62 * k} 22 ${20 * k} 22 0 0Z" fill="${leafCol}"/><path d="M4 0H${78 * k}" stroke="#fff" stroke-opacity=".3" stroke-width="2.5"/></g>`; });
  return g(x, y, 0, s, `<g transform="translate(0 -4)">${l}</g><path d="M-36 0H36L28 62H-28Z" fill="${col}"/><rect x="-40" y="-8" width="80" height="16" rx="5" fill="${col}"/><rect x="-40" y="-8" width="80" height="16" rx="5" fill="#000" opacity=".12"/>`);
}
const svg = (w, h, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inner}</svg>\n`;
const bg = (w, h, col, blob) => `<rect width="${w}" height="${h}" fill="${col}"/>` + (blob ? `<circle cx="${n(w * 0.5)}" cy="${n(h * 0.52)}" r="${n(Math.min(w, h) * 0.46)}" fill="${blob}"/>` : '');

/* ---------- komposisi ---------- */
const art = {};

art.hero = () => { seed = 11; const W = 960, H = 1200; return svg(W, H,
  wood(W, H) +
  napkin(560, 760, 330, 360, 14, C.terra) +
  leaf(60, 250, -30, 1.5) + leaf(880, 1120, -150, 1.4, C.sage) + leaf(820, 120, 140, 1.1) +
  plate(660, 900, 215) + croissant(660, 905, 1.45, -24) +
  cup(430, 500, 190, { liquid: C.caramel, crema: '#A8642B', art: 'rosetta', artRot: 12, handle: -38, saucer: C.milk }) +
  spoon(170, 640, -24, 1.25) +
  glass(190, 990, 150, { liquid: C.latte, straw: -62 }) +
  cookie(820, 420, 82, 20) +
  beans([[700, 250, 30], [760, 300, -40], [640, 330, 80], [300, 150, 20], [240, 210, -60], [900, 640, 10], [840, 700, 70], [420, 830, 40], [470, 880, -30], [90, 760, 55], [380, 1120, -15], [560, 1150, 60]], 1.25)
); };

art['galeri-1'] = () => { seed = 21; const W = 1000, H = 1000; return svg(W, H,
  wood(W, H, '#E8D2B0', '#D7BB93') +
  napkin(90, 560, 300, 330, -10, C.green) + leaf(840, 90, 120, 1.3) + leaf(120, 150, 20, 1.2, C.sage) +
  cup(330, 330, 150, { liquid: C.caramel, crema: '#A8642B', art: 'heart', handle: 200, artRot: -10 }) +
  glass(720, 380, 130, { liquid: C.latte, straw: -40, strawCol: C.mustard }) +
  plate(640, 740, 190) + croissant(640, 745, 1.25, 18) +
  cookie(250, 730, 78) + cookie(330, 810, 70, 40) + spoon(500, 110, 70, 1.1) +
  beans([[520, 520, 20], [470, 580, -50], [880, 620, 40], [900, 700, -20], [140, 440, 70], [860, 900, 10], [420, 950, -40]], 1.2)
); };

art['galeri-2'] = () => { seed = 31; const W = 900, H = 900; let b = '';
  const cols = [C.brown, '#4A2B19', '#6B4126'];
  const defs = '<defs>' + cols.map((c, i) => `<g id="b${i}"><ellipse cx="2" cy="3" rx="15" ry="21" fill="#1b0f08" opacity=".16"/><ellipse rx="15" ry="21" fill="${c}"/><path d="M-2-19Q7-7-2 0Q-9 8 2 19" fill="none" stroke="${C.espresso}" stroke-width="3" stroke-linecap="round"/><path d="M-9-10Q-12 0-8 9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".22"/></g>`).join('') + '</defs>';
  for (let i = 0; i < 150; i++) b += `<use href="#b${i % 3}" transform="translate(${Math.round(R(-20, W + 20))} ${Math.round(R(-20, H + 20))}) rotate(${Math.round(R(0, 180))}) scale(${n(R(1.5, 2.1))})"/>`;
  return svg(W, H, defs + bg(W, H, C.espresso) + b + g(450, 470, -32, 1, `<g fill="#1b0f08" opacity=".3" transform="translate(14 20)"><rect x="-90" y="-130" width="180" height="230" rx="34"/><rect x="-22" y="90" width="44" height="250" rx="20"/></g><rect x="-22" y="90" width="44" height="250" rx="20" fill="${C.gold}"/><rect x="-90" y="-130" width="180" height="230" rx="34" fill="${C.gold}"/><rect x="-72" y="-112" width="144" height="194" rx="22" fill="#B98A2E"/>` +
    [[-30, -60, 20], [25, -80, -40], [-40, 10, 70], [20, -15, 10], [35, 45, -30], [-15, 55, 50], [-45, -95, -10]].map(([x, y, r]) => `<use href="#b0" transform="translate(${x} ${y}) rotate(${r}) scale(1.8)"/>`).join(''))); };

art['galeri-3'] = () => { seed = 41; const W = 900, H = 900; const tray = '#F7EFE2';
  return svg(W, H, bg(W, H, C.blush) + `<rect x="74" y="92" width="760" height="740" rx="44" fill="#1b0f08" opacity=".14"/><rect x="60" y="70" width="780" height="760" rx="44" fill="${C.terra}"/><rect x="92" y="102" width="716" height="696" rx="26" fill="${tray}"/>` +
    donut(250, 260, 118, '#F4B6C2', tray) + donut(540, 250, 118, C.choc, tray) + donut(700, 500, 118, C.mustard, tray) +
    donut(390, 500, 118, C.milk, tray) + donut(240, 690, 118, C.matcha, tray) + donut(560, 700, 118, C.dough, tray)); };

art['galeri-4'] = () => { seed = 51; const W = 900, H = 900; let ribs = '';
  for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283; ribs += `<path d="M${n(Math.cos(a) * 60)} ${n(Math.sin(a) * 60)}L${n(Math.cos(a + 0.35) * 168)} ${n(Math.sin(a + 0.35) * 168)}" stroke="#000" stroke-opacity=".07" stroke-width="6" stroke-linecap="round"/>`; }
  return svg(W, H, bg(W, H, C.sage, '#B7C8A2') +
    `<rect x="214" y="250" width="440" height="470" rx="40" fill="#1b0f08" opacity=".16"/><rect x="200" y="230" width="440" height="470" rx="40" fill="${C.espresso}"/><rect x="236" y="622" width="150" height="46" rx="10" fill="#3D2A20"/><text x="311" y="655" text-anchor="middle" font-family="'Courier New',monospace" font-weight="700" font-size="30" fill="${C.mustard}">18.5g</text>` +
    g(420, 440, 0, 1, shadow(190, 0.07, 0.1, 0.25) + `<circle r="190" fill="${C.white}"/><rect x="170" y="-34" width="120" height="68" rx="30" fill="${C.white}" transform="rotate(20)"/><circle r="172" fill="${C.sand}"/>${ribs}<circle r="128" fill="${C.espresso}"/><circle r="128" fill="none" stroke="${C.caramel}" stroke-width="26" opacity=".85"/><circle r="70" fill="#3D2317"/><circle cx="-18" cy="-12" r="16" fill="${C.caramel}" opacity=".7"/><circle cx="24" cy="18" r="10" fill="${C.caramel}" opacity=".6"/>`) +
    g(770, 150, 0, 1, shadow(120, 0.08, 0.1, 0.2) + `<circle r="120" fill="${C.terra}"/><circle r="96" fill="${C.brick}"/><circle r="26" fill="${C.espresso}"/><path d="M-96 76C-230 120-240 250-330 280" fill="none" stroke="${C.terra}" stroke-width="22" stroke-linecap="round"/>`) +
    beans([[120, 140, 30], [170, 90, -40], [90, 780, 60], [160, 820, 10], [760, 780, -30], [820, 720, 50], [700, 830, 80]], 1.3) + leaf(760, 500, 60, 1.1, C.green)); };

art['galeri-5'] = () => { const W = 900, H = 900;
  const shelf = (y) => `<rect x="60" y="${y + 10}" width="780" height="26" rx="6" fill="#1b0f08" opacity=".12"/><rect x="60" y="${y}" width="780" height="26" rx="6" fill="${C.caramel}"/><path d="M150 ${y + 26}v40h-34zM750 ${y + 26}v40h34z" fill="${C.brown}"/>`;
  const mug = (x, y, col) => g(x, y, 0, 1, `<rect x="-34" y="-70" width="68" height="70" rx="10" fill="${col}"/><path d="M34-52h14a16 16 0 0 1 0 32H34" fill="none" stroke="${col}" stroke-width="10"/><rect x="-34" y="-70" width="68" height="12" rx="6" fill="#000" opacity=".1"/>`);
  return svg(W, H, bg(W, H, C.sand) + `<rect y="640" width="${W}" height="260" fill="${C.oat}"/>` + lantern(730, 110, 1.5) +
    `<rect x="110" y="60" width="210" height="150" rx="10" fill="${C.cream}" stroke="${C.espresso}" stroke-width="10"/><path d="M135 185l50-60 40 40 30-26 44 46z" fill="${C.sage}"/><circle cx="270" cy="105" r="18" fill="${C.mustard}"/>` +
    shelf(350) + bag(210, 198, 0.95) + bag(400, 198, 0.95, C.terra) + mug(560, 350, C.white) + mug(660, 350, C.mustard) + g(610, 278, 0, 1, `<rect x="-34" y="-70" width="68" height="70" rx="10" fill="${C.green}"/><path d="M34-52h14a16 16 0 0 1 0 32H34" fill="none" stroke="${C.green}" stroke-width="10"/>`) + pot(770, 290, 0.95, C.cream, C.green) +
    shelf(640) + pot(170, 575, 1.05) + g(350, 640, 0, 1, `<rect x="-52" y="-150" width="104" height="150" rx="16" fill="#fff" opacity=".65"/><rect x="-52" y="-96" width="104" height="96" rx="12" fill="${C.brown}"/><rect x="-58" y="-166" width="116" height="24" rx="8" fill="${C.caramel}"/>`) +
    g(520, 640, 0, 1, `<rect x="-52" y="-120" width="104" height="120" rx="16" fill="#fff" opacity=".65"/><rect x="-52" y="-70" width="104" height="70" rx="12" fill="${C.matcha}"/><rect x="-58" y="-136" width="116" height="24" rx="8" fill="${C.caramel}"/>`) + bag(710, 490, 0.9, C.green, C.cream) +
    `<rect y="786" width="${W}" height="114" fill="${C.terra}"/><rect y="786" width="${W}" height="14" fill="#000" opacity=".12"/>`); };

art['galeri-6'] = () => { seed = 61; const W = 1200, H = 760;
  return svg(W, H, bg(W, H, C.mustard) + `<rect x="94" y="130" width="1040" height="540" rx="60" fill="#1b0f08" opacity=".14"/><rect x="80" y="110" width="1040" height="540" rx="60" fill="${C.milk}"/><rect x="112" y="142" width="976" height="476" rx="40" fill="none" stroke="${C.oat}" stroke-width="5"/>` +
    glass(310, 380, 150, { liquid: C.latte, straw: -65 }) + glass(600, 380, 150, { liquid: C.matcha, swirl: '#E9F0D2', straw: -90, strawCol: C.green }) + glass(890, 380, 150, { liquid: '#6B4126', swirl: '#C9A58A', straw: -115, strawCol: C.mustard }) +
    leaf(60, 80, 30, 1.2) + beans([[1120, 80, 30], [1150, 150, -30], [70, 690, 60], [140, 720, 10]], 1.3)); };

art.about = () => { const W = 1000, H = 1100;
  let awn = '';
  for (let i = 0; i < 9; i++) awn += `<path d="M${130 + i * 82} 372h82l14 96a41 41 0 0 1-82 0z" fill="${i % 2 ? C.cream : C.terra}" transform="skewX(${(i - 4) * -1.6})" transform-origin="${171 + i * 82} 372"/>`;
  const win = `<rect x="170" y="520" width="380" height="330" rx="14" fill="${C.espresso}"/><rect x="186" y="536" width="348" height="298" rx="6" fill="#F6E7C8"/><path d="M360 536v298M186 660h348" stroke="${C.espresso}" stroke-width="10"/>` +
    `<path d="M250 536v40M460 536v64" stroke="${C.espresso}" stroke-width="4"/><path d="M228 576h44l10 34h-64z" fill="${C.mustard}"/><path d="M438 600h44l10 34h-64z" fill="${C.mustard}"/>` +
    `<rect x="200" y="760" width="320" height="12" fill="${C.caramel}"/><rect x="226" y="722" width="40" height="38" rx="6" fill="${C.terra}"/><rect x="286" y="730" width="30" height="30" rx="5" fill="${C.white}"/><rect x="400" y="716" width="36" height="44" rx="6" fill="${C.green}"/><rect x="452" y="730" width="30" height="30" rx="5" fill="${C.white}"/>`;
  const door = `<rect x="610" y="500" width="210" height="390" rx="14" fill="${C.green}"/><rect x="634" y="526" width="162" height="210" rx="8" fill="#F6E7C8"/><rect x="634" y="756" width="162" height="110" rx="8" fill="#000" opacity=".14"/><rect x="772" y="690" width="12" height="60" rx="6" fill="${C.mustard}"/>` +
    `<rect x="668" y="596" width="94" height="56" rx="8" fill="${C.cream}" transform="rotate(-4 715 624)"/><text x="715" y="634" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="28" fill="${C.terra}" transform="rotate(-4 715 624)">BUKA</text>`;
  return svg(W, H, bg(W, H, C.sand) + `<circle cx="820" cy="170" r="90" fill="${C.mustard}" opacity=".55"/><path d="M0 250q120-70 250-20t260-30 240 30 250-40V1100H0z" fill="${C.oat}" opacity=".6"/>` +
    `<rect x="110" y="250" width="780" height="650" fill="${C.cream}"/><rect x="110" y="250" width="780" height="26" fill="${C.caramel}"/><rect x="90" y="226" width="820" height="34" rx="8" fill="${C.brown}"/>` +
    `<rect x="250" y="286" width="500" height="74" rx="12" fill="${C.espresso}"/><text x="500" y="337" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="40" fill="${C.cream}" letter-spacing="6">KOPI LENTERA</text>` +
    `<rect x="110" y="872" width="780" height="28" fill="${C.caramel}" opacity=".5"/>` + win + door + `<g>${awn}</g><rect x="122" y="360" width="756" height="18" rx="6" fill="${C.brick}"/>` +
    `<path d="M930 380h-70" stroke="${C.espresso}" stroke-width="8" stroke-linecap="round"/>` + lantern(868, 452, 1.15) +
    `<rect y="900" width="${W}" height="200" fill="#CDB594"/><rect y="900" width="${W}" height="16" fill="#000" opacity=".1"/><path d="M0 1000h1000" stroke="#000" stroke-opacity=".06" stroke-width="4" stroke-dasharray="90 30"/>` +
    pot(140, 838, 1.35) + pot(900, 842, 1.2, C.espresso, C.sage) +
    g(530, 905, 0, 1, `<path d="M-52 0L-34-150H34L52 0z" fill="${C.espresso}"/><rect x="-26" y="-134" width="52" height="96" rx="4" fill="#3D2A20"/><text y="-96" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="${C.cream}">Kopi</text><text y="-74" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="${C.mustard}">18K</text><path d="M-14-58h28" stroke="${C.cream}" stroke-width="3" stroke-linecap="round"/>`)); };

art['about-2'] = () => { seed = 71; const W = 700, H = 700;
  return svg(W, H, bg(W, H, C.terra, C.brick) + bag(300, 330, 1.55) + cup(540, 560, 78, { liquid: C.espresso, crema: C.caramel, handle: -30, saucer: C.cream }) + beans([[110, 600, 30], [170, 640, -40], [80, 520, 70], [600, 130, 20], [560, 200, -50]], 1.5, C.espresso)); };

art['produk-kopi-susu'] = () => { seed = 81; const W = 1000, H = 800;
  return svg(W, H, bg(W, H, C.blush, '#F7DCC9') + napkin(610, 380, 300, 300, 18, C.terra) + glass(480, 400, 215, { liquid: C.latte, straw: -48 }) +
    g(190, 610, 14, 1, `<rect x="6" y="10" width="110" height="80" rx="14" fill="#1b0f08" opacity=".15"/><rect width="110" height="80" rx="14" fill="${C.crust}"/><rect x="60" y="-40" width="90" height="70" rx="14" fill="${C.brown}" transform="rotate(-20)"/>`) +
    leaf(820, 150, 150, 1.2) + beans([[150, 170, 30], [210, 120, -40], [820, 640, 50], [760, 700, -20], [130, 300, 80]], 1.4)); };
art['produk-cappuccino'] = () => { seed = 82; const W = 1000, H = 800;
  return svg(W, H, bg(W, H, C.sage, '#B9C9A5') + cup(480, 400, 185, { liquid: C.caramel, crema: '#A8642B', art: 'rosetta', artRot: -14, handle: 24, saucer: C.milk }) + spoon(820, 300, 22, 1.15) + cookie(170, 620, 66) + beans([[150, 150, 30], [210, 200, -40], [860, 660, 50], [800, 710, -20]], 1.4)); };
art['produk-matcha'] = () => { seed = 83; const W = 1000, H = 800;
  return svg(W, H, bg(W, H, '#E9EED8', '#F4F6E8') + cup(470, 400, 185, { liquid: C.matcha, crema: '#7F9B4F', art: 'heart', artCol: '#F2F6E2', handle: 150, saucer: C.espresso, body: C.cream }) +
    g(830, 590, 0, 1, shadow(84, 0.08, 0.12) + `<circle r="84" fill="${C.cream}"/><circle r="66" fill="#6F8F3F"/><circle cx="-14" cy="-10" r="30" fill="#84A552"/>`) + leaf(760, 130, 130, 1.25) + leaf(110, 640, -20, 1.1, C.matcha) + leaf(150, 120, 40, 0.9, C.green)); };
art['produk-croissant'] = () => { seed = 84; const W = 1000, H = 800; let crumbs = '';
  for (let i = 0; i < 16; i++) crumbs += `<circle cx="${n(R(120, 880))}" cy="${n(R(100, 720))}" r="${n(R(3, 7))}" fill="${C.crust}" opacity=".7"/>`;
  return svg(W, H, bg(W, H, C.mustard, '#F5CB70') + napkin(90, 420, 280, 300, -12, C.cream) + plate(520, 400, 280, C.milk) + crumbs + croissant(520, 410, 1.9, -16) + g(850, 180, 0, 1, shadow(62) + `<circle r="62" fill="${C.white}"/><circle r="48" fill="#F6D98A"/><circle r="30" fill="#F2C55C"/>`) + spoon(860, 430, 12, 1)); };
art['produk-cookies'] = () => { seed = 85; const W = 1000, H = 800;
  return svg(W, H, bg(W, H, C.sand) + `<rect x="150" y="100" width="700" height="620" rx="16" fill="#1b0f08" opacity=".1" transform="rotate(-5 500 400)"/><rect x="140" y="85" width="700" height="620" rx="16" fill="#F8EEDD" transform="rotate(-5 500 400)"/>` +
    cookie(350, 300, 150, 10) + cookie(630, 360, 150, 60) + cookie(450, 540, 150, 120) +
    [[790, 610, 20], [840, 560, 60], [170, 600, 40], [220, 170, 10], [760, 150, 70]].map(([x, y, r]) => `<rect x="${x}" y="${y}" width="38" height="30" rx="7" fill="${C.choc}" transform="rotate(${r} ${x} ${y})"/>`).join('')); };
art['produk-literan'] = () => { seed = 86; const W = 1000, H = 800;
  const bottle = (x, s) => g(x, 0, 0, s, `<ellipse cy="640" rx="130" ry="18" fill="#1b0f08" opacity=".16"/><rect x="-46" y="120" width="92" height="46" rx="10" fill="${C.espresso}"/><path d="M-40 166h80v40c0 30 60 44 60 100v290a36 36 0 0 1-36 36h-128a36 36 0 0 1-36-36V306c0-56 60-70 60-100z" fill="#fff" opacity=".7"/><path d="M-100 330c0-10 4-22 10-32h180c6 10 10 22 10 32v266a36 36 0 0 1-36 36h-128a36 36 0 0 1-36-36z" fill="${C.latte}"/><path d="M-90 298h180" stroke="${C.milk}" stroke-width="10" opacity=".8"/>` +
    `<rect x="-100" y="380" width="200" height="170" fill="${C.cream}"/>` + lanternMark(0, 428, 0.62) + `<text y="486" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="25" fill="${C.espresso}" letter-spacing="1.5">KOPI LENTERA</text><text y="514" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="${C.terra}" letter-spacing="3">KOPI SUSU · 1 LITER</text><rect x="-78" y="200" width="16" height="390" rx="8" fill="#fff" opacity=".4"/>`);
  return svg(W, H, bg(W, H, '#EBD9BF') + `<rect y="560" width="${W}" height="240" fill="${C.oat}"/><circle cx="500" cy="380" r="300" fill="${C.sand}"/>` + bottle(430, 1) +
    g(710, 0, 0, 1, `<ellipse cy="640" rx="90" ry="13" fill="#1b0f08" opacity=".16"/><path d="M-70 430h140l-14 200a12 12 0 0 1-12 10h-88a12 12 0 0 1-12-10z" fill="#fff" opacity=".7"/><path d="M-66 484h132l-10 146a12 12 0 0 1-12 10h-88a12 12 0 0 1-12-10z" fill="${C.latte}"/><rect x="-36" y="500" width="40" height="40" rx="8" fill="#fff" opacity=".5" transform="rotate(12 -16 520)"/><rect x="6" y="540" width="40" height="40" rx="8" fill="#fff" opacity=".5" transform="rotate(-16 26 560)"/><path d="M26 620L60 380" stroke="${C.terra}" stroke-width="12" stroke-linecap="round"/>`) +
    beans([[180, 690, 30], [240, 720, -40], [850, 700, 60]], 1.4)); };

/* =====================================================================
 * Demo 2 — Garis Rapi Barbershop (gelap, tampak atas)
 * ===================================================================== */
const B = { char: '#151413', coal: '#211F1D', slate: '#2E2B28', gold: '#D9A441', red: '#C2452D', cream: '#F3EFE8', steel: '#C9CDD1', steelD: '#8C9196', wood: '#6B4A2F' };
function scissors(x, y, rot, s = 1) {
  const half = (flip) => `<g transform="${flip ? 'scale(-1 1) ' : ''}rotate(-11)"><path d="M-10 24L-12-214Q-3-250 7-214L10 24Z" fill="${B.steel}"/><path d="M-2-236L4 20" stroke="#fff" stroke-opacity=".5" stroke-width="3"/><path d="M0 20Q-2 84-30 118" stroke="${B.steelD}" stroke-width="15" fill="none" stroke-linecap="round"/><ellipse cx="-42" cy="160" rx="34" ry="44" fill="none" stroke="${B.gold}" stroke-width="15"/></g>`;
  const body = half(false) + half(true) + `<circle r="9" fill="${B.gold}"/><circle r="3" fill="${B.char}"/>`;
  return g(x, y, rot, s, `<g transform="translate(10 16)" opacity=".4" style="filter:brightness(0)">${body}</g>${body}`);
}
function comb(x, y, rot, s = 1, col = B.cream) {
  let t = '';
  for (let i = 0; i < 34; i++) { const fine = i > 16; t += `<rect x="${n(-146 + i * 8.6)}" y="12" width="${fine ? 3.4 : 5.2}" height="50" rx="1.6" fill="${col}"/>`; }
  const body = `<rect x="-150" y="-14" width="300" height="30" rx="9" fill="${col}"/>${t}`;
  return g(x, y, rot, s, `<g transform="translate(8 14)" opacity=".4" style="filter:brightness(0)">${body}</g>${body}<rect x="-140" y="-7" width="280" height="5" rx="2.5" fill="#000" opacity=".12"/>`);
}
function razor(x, y, rot, s = 1) {
  const body = `<g transform="rotate(-150)"><rect x="0" y="-18" width="230" height="36" rx="16" fill="${B.wood}"/><rect x="14" y="-6" width="200" height="5" rx="2.5" fill="#fff" opacity=".18"/></g><path d="M0-10H190Q214-10 214 12V34H18Q0 34 0 16Z" fill="${B.steel}"/><path d="M6 24H206" stroke="#fff" stroke-width="4" opacity=".6"/><circle r="9" fill="${B.gold}"/>`;
  return g(x, y, rot, s, `<g transform="translate(8 14)" opacity=".4" style="filter:brightness(0)">${body}</g>${body}`);
}
function clipper(x, y, rot, s = 1) {
  let teeth = '';
  for (let i = 0; i < 12; i++) teeth += `<rect x="${-40 + i * 7}" y="-166" width="3.4" height="20" fill="${B.steelD}"/>`;
  const body = `<rect x="-44" y="-150" width="88" height="46" rx="6" fill="${B.steel}"/>${teeth}<rect x="-48" y="-112" width="96" height="250" rx="40" fill="${B.slate}"/><rect x="-48" y="-112" width="96" height="250" rx="40" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="3"/><rect x="-48" y="-40" width="96" height="16" fill="${B.gold}"/><rect x="-12" y="20" width="24" height="46" rx="12" fill="${B.char}"/><circle cy="32" r="8" fill="${B.red}"/>`;
  return g(x, y, rot, s, `<g transform="translate(10 16)" opacity=".4" style="filter:brightness(0)">${body}</g>${body}`);
}
function pomade(x, y, r, col = B.gold, ink = B.char) {
  return g(x, y, 0, 1, `<circle cx="${n(r * 0.1)}" cy="${n(r * 0.14)}" r="${r}" fill="#000" opacity=".4"/><circle r="${r}" fill="${col}"/><circle r="${n(r * 0.84)}" fill="none" stroke="${ink}" stroke-width="${n(r * 0.03)}" opacity=".5"/><text y="${n(r * 0.1)}" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="${n(r * 0.5)}" fill="${ink}">GR</text><text y="${n(r * 0.42)}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="${n(r * 0.15)}" fill="${ink}" letter-spacing="${n(r * 0.04)}">POMADE</text><path d="M${n(-r * 0.86)} ${n(-r * 0.3)}A${n(r * 0.92)} ${n(r * 0.92)} 0 0 1 ${n(-r * 0.3)} ${n(-r * 0.86)}" fill="none" stroke="#fff" stroke-width="${n(r * 0.05)}" stroke-linecap="round" opacity=".5"/>`);
}
function pole(x, y, s = 1, id = 'pl') {
  let st = '';
  for (let i = -3; i < 9; i++) st += `<path d="M-40 ${i * 60}l80-50v26l-80 50z" fill="${i % 2 ? B.red : B.gold}"/>`;
  return g(x, y, 0, s, `<defs><clipPath id="${id}"><rect x="-30" y="0" width="60" height="300" rx="10"/></clipPath></defs><rect x="-30" y="0" width="60" height="300" rx="10" fill="${B.cream}"/><g clip-path="url(#${id})">${st}</g><rect x="-30" y="0" width="16" height="300" fill="#fff" opacity=".18"/><rect x="-38" y="-26" width="76" height="30" rx="8" fill="${B.steel}"/><rect x="-38" y="296" width="76" height="30" rx="8" fill="${B.steel}"/><circle cy="-44" r="22" fill="${B.steel}"/><rect x="-10" y="326" width="20" height="26" fill="${B.steelD}"/>`);
}
function planks(w, h, col, line) {
  let s = `<rect width="${w}" height="${h}" fill="${col}"/>`;
  for (let i = 1; i < 8; i++) s += `<path d="M${n(w / 8 * i)} 0V${h}" stroke="${line}" stroke-width="3"/>`;
  return s;
}
const barber = {};
barber.hero = () => { const W = 1600, H = 1000; return svg(W, H,
  planks(W, H, B.coal, '#2A2724') + `<circle cx="1180" cy="520" r="430" fill="${B.slate}" opacity=".55"/>` +
  g(960, 250, 9, 1, `<rect x="10" y="16" width="520" height="560" rx="18" fill="#000" opacity=".35"/><rect width="520" height="560" rx="18" fill="${B.cream}"/><path d="M0 70H520M0 110H520M0 450H520M0 490H520" stroke="${B.red}" stroke-width="12" opacity=".8"/>`) +
  scissors(1090, 520, 24, 1.25) + comb(1330, 300, -62, 1.15, B.char) + razor(930, 790, -8, 1.1) + clipper(1420, 640, 14, 1.15) +
  pomade(1210, 850, 78, B.red, B.cream) + pomade(1490, 200, 70, B.gold)); };
barber.about = () => { const W = 1000, H = 1100;
  const jar = (x, c, h2 = 70) => `<rect x="${x}" y="${640 - h2}" width="56" height="${h2}" rx="8" fill="${c}"/><rect x="${x - 3}" y="${632 - h2}" width="62" height="16" rx="5" fill="${B.char}"/>`;
  return svg(W, H, `<rect width="${W}" height="${H}" fill="${B.slate}"/><rect y="760" width="${W}" height="340" fill="${B.coal}"/><rect y="756" width="${W}" height="12" fill="${B.gold}" opacity=".6"/>` +
    `<path d="M0 760h1000" stroke="#000" stroke-opacity=".3" stroke-width="6"/>` +
    `<path d="M250 620V330a200 200 0 0 1 400 0V620Z" fill="${B.gold}"/><path d="M272 600V330a178 178 0 0 1 356 0V600Z" fill="#3A3A3C"/><path d="M300 560L420 200M350 590L500 170" stroke="#fff" stroke-opacity=".12" stroke-width="26" stroke-linecap="round"/>` +
    `<rect x="210" y="640" width="480" height="22" rx="6" fill="${B.wood}"/><path d="M250 662v36h-26zM650 662v36h26z" fill="${B.char}"/>` + jar(250, B.gold) + jar(322, B.cream, 96) + jar(394, B.red, 60) + jar(560, B.cream, 84) + jar(626, B.gold, 56) +
    `<path d="M830 0V120" stroke="${B.char}" stroke-width="6"/><path d="M780 120h100l30 70H750z" fill="${B.gold}"/><circle cx="830" cy="200" r="16" fill="${B.cream}"/><circle cx="830" cy="230" r="150" fill="${B.gold}" opacity=".07"/>` +
    pole(850, 380, 1, 'pl2') +
    g(430, 1010, 0, 1, `<ellipse cy="40" rx="210" ry="30" fill="#000" opacity=".35"/><ellipse cy="26" rx="150" ry="24" fill="${B.steelD}"/><rect x="-22" y="-120" width="44" height="150" fill="${B.steel}"/><rect x="-170" y="-60" width="130" height="18" rx="9" fill="${B.steel}" transform="rotate(-18 -170 -60)"/><rect x="-190" y="-30" width="90" height="22" rx="8" fill="${B.steelD}"/>` +
      `<rect x="-150" y="-200" width="300" height="86" rx="26" fill="${B.red}"/><rect x="-150" y="-134" width="300" height="20" rx="10" fill="#000" opacity=".2"/><rect x="-124" y="-470" width="248" height="290" rx="40" fill="${B.red}"/><path d="M-70-440V-210M0-446V-204M70-440V-210" stroke="#000" stroke-opacity=".16" stroke-width="5"/><rect x="-64" y="-540" width="128" height="62" rx="22" fill="${B.red}"/><rect x="-8" y="-482" width="16" height="16" fill="${B.steel}"/>` +
      `<rect x="-186" y="-290" width="50" height="26" rx="13" fill="${B.char}"/><rect x="136" y="-290" width="50" height="26" rx="13" fill="${B.char}"/><rect x="-172" y="-270" width="20" height="110" rx="8" fill="${B.steel}"/><rect x="152" y="-270" width="20" height="110" rx="8" fill="${B.steel}"/>`)); };
barber['about-2'] = () => { const W = 700, H = 700; return svg(W, H, `<rect width="${W}" height="${H}" fill="${B.gold}"/><circle cx="350" cy="360" r="300" fill="#E4B65C"/>` + comb(330, 560, -12, 1.15, B.char) + pomade(300, 290, 150, B.char, B.gold) + pomade(540, 420, 84, B.cream) + scissors(560, 170, 48, 0.5)); };

/* =====================================================================
 * Demo 3 — Seruni Skin (lembut, tampak depan)
 * ===================================================================== */
const K = { bg: '#FDF6F4', blush: '#F8E4DC', peach: '#F2C6B4', rose: '#B0456B', deep: '#6E2A45', sage: '#A9BC92', green: '#5C7253', cream: '#FFFBF7', gold: '#D8A878', sand: '#EAD3C4' };
const lbl = (y, big, small, col = K.deep, size = 17) => `<text y="${y}" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="${size}" fill="${col}" letter-spacing="3">${big}</text><text y="${y + 20}" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="${col}" letter-spacing="2.4" opacity=".75">${small}</text>`;
const floorShadow = (rx) => `<ellipse cx="14" cy="2" rx="${rx}" ry="${n(rx * 0.14)}" fill="${K.deep}" opacity=".16"/>`;
function dropper(x, y, s = 1, glass = '#C98A6B', small = 'FACE SERUM') {
  return g(x, y, 0, s, floorShadow(84) + `<rect x="-22" y="-306" width="44" height="74" rx="20" fill="${K.deep}"/><rect x="-33" y="-240" width="66" height="32" rx="7" fill="${K.gold}"/><rect x="-26" y="-212" width="52" height="26" fill="${glass}"/><rect x="-58" y="-192" width="116" height="192" rx="24" fill="${glass}"/><rect x="-58" y="-192" width="116" height="192" rx="24" fill="#000" opacity=".06"/><rect x="-58" y="-128" width="116" height="92" fill="${K.cream}"/>` + lbl(-80, 'SERUNI', small) + `<rect x="-44" y="-180" width="11" height="168" rx="5.5" fill="#fff" opacity=".35"/>`);
}
function jar(x, y, s = 1, body = K.cream, lid = K.rose, small = 'DAY CREAM') {
  return g(x, y, 0, s, floorShadow(120) + `<rect x="-92" y="-100" width="184" height="100" rx="22" fill="${body}"/><rect x="-92" y="-30" width="184" height="30" rx="14" fill="#000" opacity=".05"/><rect x="-98" y="-146" width="196" height="56" rx="14" fill="${lid}"/><rect x="-98" y="-104" width="196" height="14" fill="#000" opacity=".12"/>` + lbl(-52, 'SERUNI', small) + `<rect x="-80" y="-136" width="120" height="8" rx="4" fill="#fff" opacity=".3"/>`);
}
function tube(x, y, s = 1, body = K.peach, small = 'GENTLE CLEANSER') {
  return g(x, y, 0, s, floorShadow(64) + `<path d="M-56-270H56L46-44Q46-32 34-32H-34Q-46-32-46-44Z" fill="${body}"/><rect x="-58" y="-286" width="116" height="26" rx="4" fill="${body}"/><path d="M-58-262H58" stroke="#000" stroke-opacity=".1" stroke-width="4"/><rect x="-40" y="-34" width="80" height="34" rx="7" fill="${K.deep}"/>` + g(0, -150, 0, 1, lbl(0, 'SERUNI', small)) + `<path d="M-40-250L-34-60" stroke="#fff" stroke-opacity=".4" stroke-width="9" stroke-linecap="round"/>`);
}
function pump(x, y, s = 1, body = K.sage, small = 'BODY LOTION') {
  return g(x, y, 0, s, floorShadow(78) + `<rect x="-8" y="-330" width="16" height="60" fill="${K.gold}"/><path d="M-8-338h70a10 10 0 0 1 10 10v8H-8z" fill="${K.deep}"/><rect x="-26" y="-276" width="52" height="30" rx="6" fill="${K.deep}"/><rect x="-54" y="-250" width="108" height="250" rx="22" fill="${body}"/><rect x="-54" y="-160" width="108" height="96" fill="${K.cream}"/>` + lbl(-110, 'SERUNI', small) + `<rect x="-40" y="-236" width="11" height="220" rx="5.5" fill="#fff" opacity=".35"/>`);
}
function podium(x, y, w, hh, col = K.cream) {
  return g(x, y, 0, 1, `<ellipse cy="${hh}" rx="${w / 2}" ry="${n(w * 0.11)}" fill="${col}"/><rect x="${-w / 2}" y="0" width="${w}" height="${hh}" fill="${col}"/><rect x="${-w / 2}" y="0" width="${w}" height="${hh}" fill="${K.deep}" opacity=".06"/><ellipse rx="${w / 2}" ry="${n(w * 0.11)}" fill="${col}"/>`);
}
const arch = (x, y, w, hh, col) => `<path d="M${x - w / 2} ${y}V${y - hh + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${y}Z" fill="${col}"/>`;
function flower(x, y, r, col = K.cream, mid = K.gold) {
  let p = '';
  for (let i = 0; i < 8; i++) p += `<ellipse cy="${n(-r * 0.62)}" rx="${n(r * 0.26)}" ry="${n(r * 0.5)}" fill="${col}" transform="rotate(${i * 45})"/>`;
  return g(x, y, 0, 1, `<g transform="translate(5 8)" opacity=".14" style="filter:brightness(0)">${p}</g>${p}<circle r="${n(r * 0.28)}" fill="${mid}"/>`);
}
const skin = {};
skin.hero = () => { const W = 1600, H = 1000; return svg(W, H,
  `<rect width="${W}" height="${H}" fill="${K.blush}"/><rect y="640" width="${W}" height="360" fill="${K.sand}"/><circle cx="1240" cy="330" r="150" fill="${K.cream}" opacity=".8"/>` +
  arch(800, 700, 520, 560, K.peach) + arch(430, 700, 260, 330, K.rose) + arch(1170, 700, 260, 300, K.sage) +
  leaf(250, 640, -70, 2.2, K.green) + leaf(300, 660, -110, 1.8, K.sage) + leaf(1350, 650, -105, 2.2, K.green) + leaf(1310, 665, -65, 1.7, K.sage) +
  podium(800, 610, 300, 120) + podium(520, 690, 230, 70) + podium(1080, 680, 230, 80, K.blush) +
  pump(800, 610, 1) + dropper(520, 690, 0.92) + jar(1080, 680, 0.95) + tube(660, 790, 0.72, K.cream) + jar(950, 800, 0.6, K.peach, K.deep, 'EYE BALM') +
  flower(330, 800, 46) + flower(1270, 810, 40, K.rose, K.cream)); };
const shot = (bgc, archC, inner, deco = '') => svg(1000, 800, `<rect width="1000" height="800" fill="${bgc}"/><rect y="610" width="1000" height="190" fill="#000" opacity=".05"/>` + arch(500, 620, 430, 500, archC) + deco + podium(500, 600, 330, 60) + inner);
skin['produk-serum'] = () => shot(K.blush, K.peach, dropper(500, 600, 1.2), leaf(760, 600, -100, 1.6, K.green) + flower(250, 640, 44));
skin['produk-cream'] = () => shot('#F3E3EA', K.rose, jar(500, 600, 1.35), leaf(230, 600, -70, 1.6, K.sage) + flower(770, 650, 40, K.cream));
skin['produk-cleanser'] = () => shot('#E8EEDD', K.sage, tube(500, 600, 1.25, K.cream), leaf(770, 600, -110, 1.7, K.green) + flower(240, 650, 40, K.peach, K.cream));
skin['produk-lotion'] = () => shot('#F6E6D6', K.gold, pump(500, 600, 1.15, K.peach), leaf(240, 600, -75, 1.7, K.green) + flower(780, 650, 42));
skin['produk-paket'] = () => svg(1000, 800, `<rect width="1000" height="800" fill="${K.peach}"/><rect y="610" width="1000" height="190" fill="#000" opacity=".05"/>` + arch(500, 620, 700, 520, K.blush) + leaf(140, 610, -70, 1.6, K.green) + leaf(870, 610, -110, 1.6, K.green) +
  podium(500, 600, 620, 50) + tube(290, 600, 0.95, K.cream) + dropper(440, 600, 0.95) + pump(585, 600, 0.9) + jar(735, 600, 0.7) + flower(880, 700, 40));
skin.about = () => { seed = 91; const W = 1000, H = 1100; let pet = '';
  for (let i = 0; i < 14; i++) pet += `<ellipse cx="${n(R(60, 940))}" cy="${n(R(60, 1040))}" rx="16" ry="30" fill="${[K.peach, K.cream, K.rose][i % 3]}" opacity=".85" transform="rotate(${n(R(0, 180))} 500 550)"/>`;
  return svg(W, H, `<rect width="${W}" height="${H}" fill="${K.sand}"/><circle cx="520" cy="560" r="430" fill="${K.blush}"/>` + pet +
    leaf(120, 300, 20, 2.4, K.green) + leaf(160, 380, 50, 2, K.sage) + leaf(900, 900, 200, 2.4, K.green) + leaf(860, 820, 230, 1.9, K.sage) +
    g(430, 470, 0, 1, `<circle cx="16" cy="22" r="230" fill="${K.deep}" opacity=".16"/><circle r="230" fill="${K.rose}"/><circle r="196" fill="${K.cream}"/><path d="M-110 20C-90-110 100-120 110 0C116 90-30 120-40 30C-44-24 30-40 30 4" fill="none" stroke="${K.blush}" stroke-width="34" stroke-linecap="round"/><path d="M-200-110A226 226 0 0 1-110-200" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".6"/>`) +
    g(720, 760, 0, 1, `<circle cx="10" cy="14" r="130" fill="${K.deep}" opacity=".16"/><circle r="130" fill="${K.deep}"/><circle r="108" fill="none" stroke="${K.gold}" stroke-width="3"/>` + lbl(4, 'SERUNI', 'DAY CREAM', K.cream, 24)) +
    g(250, 830, -38, 1, `<rect x="-36" y="-170" width="72" height="230" rx="20" fill="#C98A6B"/><rect x="-36" y="-110" width="72" height="90" fill="${K.cream}"/><rect x="-22" y="-200" width="44" height="34" rx="6" fill="${K.gold}"/><rect x="-15" y="-262" width="30" height="66" rx="14" fill="${K.deep}"/>`) +
    flower(760, 270, 76) + flower(880, 420, 46, K.peach, K.cream) + flower(150, 620, 50, K.cream)); };
skin['about-2'] = () => svg(700, 700, `<rect width="700" height="700" fill="${K.rose}"/><circle cx="350" cy="350" r="270" fill="${K.deep}" opacity=".35"/>` + leaf(90, 520, -40, 1.9, K.sage) + leaf(600, 180, 140, 1.7, K.sage) + flower(350, 350, 170, K.cream) + flower(560, 540, 56, K.peach, K.cream) + flower(150, 170, 44, K.peach, K.cream));

const SETS = { 'kopi-lentera': art, 'garis-rapi': barber, 'seruni-skin': skin };
let grand = 0;
for (const client of Object.keys(SETS)) {
  const dir = path.join(__dirname, '..', 'clients', client, 'images');
  fs.mkdirSync(dir, { recursive: true });
  let total = 0;
  for (const name of Object.keys(SETS[client])) {
    const out = SETS[client][name]();
    fs.writeFileSync(path.join(dir, name + '.svg'), out);
    total += out.length;
  }
  grand += total;
  console.log(('  clients/' + client + '/images/').padEnd(38) + String(Object.keys(SETS[client]).length).padStart(2) + ' file  ' + (total / 1024).toFixed(1).padStart(6) + ' KB');
}
console.log('  total'.padEnd(38) + '         ' + (grand / 1024).toFixed(1).padStart(6) + ' KB');
