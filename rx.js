/* Receptor F1 dentro de la app: port a JavaScript de f1_dash.py (mismos diseños de paquete EA, mismas cuentas).
   NO PROBADO CON EL JUEGO REAL. El móvil recibe UDP (Java) y entrega los paquetes a este código; no sale nada a internet. */
(function (G) {
'use strict';
var N = 24, BIN = 5.0;
var SIZES = {B: 1, b: 1, H: 2, h: 2, I: 4, i: 4, f: 4, Q: 8, d: 8, s: 1};
function mk(fmt) {            // '<HBBf4H32s' -> {size, un(view, off)}
  var items = [], re = /(\d*)([BbHhIifQds])/g, m, off = 0;
  fmt = fmt.replace('<', '');
  while ((m = re.exec(fmt))) {
    var n = m[1] === '' ? 1 : +m[1], t = m[2];
    if (t === 's') { items.push([t, off, n]); off += n; continue; }
    for (var k = 0; k < n; k++) { items.push([t, off, 1]); off += SIZES[t]; }
  }
  return {size: off, un: function (v, o) {
    var out = new Array(items.length);
    for (var i = 0; i < items.length; i++) {
      var t = items[i][0], p = o + items[i][1];
      switch (t) {
        case 'B': out[i] = v.getUint8(p); break;
        case 'b': out[i] = v.getInt8(p); break;
        case 'H': out[i] = v.getUint16(p, true); break;
        case 'h': out[i] = v.getInt16(p, true); break;
        case 'I': out[i] = v.getUint32(p, true); break;
        case 'i': out[i] = v.getInt32(p, true); break;
        case 'f': out[i] = v.getFloat32(p, true); break;
        case 'd': out[i] = v.getFloat64(p, true); break;
        case 'Q': out[i] = v.getUint32(p + 4, true) + ':' + v.getUint32(p, true); break;   // clave de sesión (solo se compara)
        case 's': { var a = []; for (var j = 0; j < items[i][2]; j++) a.push(v.getUint8(p + j)); out[i] = a; break; }
      }
    }
    return out;
  }};
}
var HDR = mk('<HBBBBBQfIIBB'), LAP = mk('<IIHBHBHBHBfffBBBBBBBBBBBBBBBHHBfB'), TEL = mk('<HfffBbHBBH4H4B4BB4f4B'),
    ST = mk('<BBBBBfffHHBBHBBBbfffBffffB'), T2 = mk('<BBHBBHBB'), MOT = mk('<6f9h3f'), DMG = mk('<4f30B'),
    PART = mk('<BHHHBBB32sBBHBB12B'), TSET = mk('<BBBBBBBhB'), SES = mk('<BbbBHBb'),
    HIST_HEAD = mk('<BBBBBBB'), HLAP = mk('<IHBHBHBB');
var H = HDR.size;
var TSET_TOTAL = H + 1 + 20 * TSET.size + 1, HIST_TOTAL = H + HIST_HEAD.size + 100 * HLAP.size + 8 * 3, EV_TOTAL = 45;
var EXPECT = {1: [SES, 926, 0], 0: [MOT, 1325, 0], 2: [LAP, 1399, 2], 6: [TEL, 1448, 3], 7: [ST, 1445, 0], 16: [T2, 269, 0]};
var EXTRA = {10: [DMG, 1133, 0], 4: [PART, 1470, 1]};
var SIZE_OK = {};
Object.keys(EXPECT).concat(Object.keys(EXTRA)).forEach(function (k) {
  var e = EXPECT[k] || EXTRA[k]; SIZE_OK[k] = H + N * e[0].size + e[2] === e[1];
});
SIZE_OK[12] = TSET_TOTAL === 231; SIZE_OK[1] = 'solo longitud (926)'; SIZE_OK[11] = HIST_TOTAL === 1460; SIZE_OK[3] = 'solo longitud (45)';
var EA_TRACKS={"0": "Melbourne", "2": "Shanghai", "3": "Sakhir (Bahrain)", "4": "Catalunya", "5": "Monaco", "6": "Montreal", "7": "Silverstone", "9": "Hungaroring", "10": "Spa", "11": "Monza", "12": "Singapore", "13": "Suzuka", "14": "Abu Dhabi", "15": "Texas", "16": "Brazil", "17": "Austria", "19": "Mexico", "20": "Baku (Azerbaijan)", "26": "Zandvoort", "27": "Imola", "29": "Jeddah", "30": "Miami", "31": "Las Vegas", "32": "Losail", "39": "Silverstone (Reverse)", "40": "Austria (Reverse)", "41": "Zandvoort (Reverse)", "42": "Madrid"}, EA_MODES={"4": "Grand Prix ‘23", "5": "Time Trial", "6": "Splitscreen", "7": "Online Custom", "15": "Online Weekly Event", "17": "Story Mode (Braking Point)", "27": "My Team Career ‘25", "28": "Driver Career ‘25", "29": "Career ’25 Online", "30": "Challenge Career ‘25", "75": "Story Mode (APXGP)", "127": "Benchmark"}, EA_RULES={"0": "Practice & Qualifying", "1": "Race", "2": "Time Trial", "12": "Elimination"}, EA_TEAMS={"0": "Mercedes", "465": "Art GP ‘25", "1": "Ferrari", "466": "Campos ‘25", "2": "Red Bull Racing", "467": "Rodin Motorsport ‘25", "3": "Williams", "468": "AIX Racing ‘25", "4": "Aston Martin", "469": "DAMS ‘25", "5": "Alpine", "470": "Hitech ‘25", "6": "RB", "471": "MP Motorsport ‘25", "7": "Haas", "472": "Prema ‘25", "8": "McLaren", "473": "Trident ‘25", "9": "Sauber", "474": "Van Amersfoort Racing ‘25", "475": "Invicta ‘25", "476": "Mercedes ‘26", "477": "Ferrari ‘26", "478": "Red Bull Racing ‘26", "479": "Williams ‘26", "480": "Aston Martin ‘26", "481": "Alpine ‘26", "482": "RB ‘26", "483": "Haas ‘26", "484": "McLaren ‘26", "485": "Audi ‘26", "486": "Cadillac ‘26", "489": "Art GP ‘26", "490": "Campos ‘26", "491": "Rodin Motorsport ‘26", "492": "AIX Racing ‘26", "493": "DAMS ‘26", "494": "Hitech ‘26", "495": "MP Motorsport ‘26", "496": "Prema ‘26", "497": "Trident ‘26", "498": "Van Amersfoort Racing ‘26", "499": "Invicta ‘26", "62": "Alexander Albon", "164": "Joshua Dürksen", "70": "Rashid Nair", "165": "Andrea-Kimi Antonelli", "71": "Jack Tremblay", "166": "Ritomo Miyata", "77": "Ayrton Senna", "167": "Rafael Villagómez", "80": "Guanyu Zhou", "168": "Zak O’Sullivan", "83": "Juan Manuel Correa", "169": "Pepe Marti", "10": "Nico Hülkenberg", "90": "Michael Schumacher", "170": "Sonny Hayes", "11": "Kevin Magnussen", "94": "Yuki Tsunoda", "171": "Joshua Pearce", "14": "Sergio Pérez", "102": "Aidan Jackson", "172": "Callum Voisin", "15": "Valtteri Bottas", "109": "Jenson Button", "173": "Matias Zagazeta", "17": "Esteban Ocon", "110": "David Coulthard", "174": "Nikola Tsolov", "19": "Lance Stroll", "112": "Oscar Piastri", "175": "Tim Tramnitz", "20": "Arron Barnes", "113": "Liam Lawson", "185": "Luca Cortez", "21": "Martin Giles", "116": "Richard Verschoor", "186": "Luke Browning", "22": "Alex Murray", "123": "Enzo Fittipaldi", "187": "Cian Shields", "23": "Lucas Roth", "125": "Mark Webber", "188": "Arvid Lindblad", "24": "Igor Correia", "126": "Jacques Villeneuve", "189": "Dino Beganovic", "25": "Sophie Levasseur", "127": "Callie Mayer", "190": "Leonardo Fornaroli", "26": "Jonas Schiffer", "132": "Logan Sargeant", "191": "Oliver Goethe", "27": "Alain Forest", "136": "Jack Doohan", "192": "Gabriele Minì", "28": "Jay Letourneau", "137": "Amaury Cordeel", "193": "Sebastián Montoya", "29": "Esto Saari", "138": "Dennis Hauger", "194": "Alexander Dunne", "30": "Yasar Atiyeh", "145": "Zane Maloney", "195": "Max Esterson", "31": "Callisto Calabresi", "146": "Victor Martins", "196": "Sami Meguetounif", "32": "Naota Izumi", "147": "Oliver Bearman", "197": "John Bennett", "33": "Howard Clarke", "148": "Jak Crawford", "198": "Emerson Fittipaldi", "34": "Lars Kaufmann", "149": "Isack Hadjar", "199": "Tasanopol Inthraphuvasak", "35": "Marie Laursen", "152": "Roman Stanek", "200": "Noel León", "36": "Flavio Nieves", "153": "Kush Maini", "201": "Roman Bilinski", "38": "Klimek Michalski", "156": "Brendon Leigh", "202": "Colton Herta", "39": "Santiago Moreno", "157": "David Tonizza", "203": "Rafael Câmara", "40": "Benjamin Coppens", "158": "Jarno Opmeer", "204": "Mari Boya", "41": "Noah Visser", "159": "Lucas Blakeley", "205": "Martinius Stenshorne", "50": "George Russell", "160": "Paul Aron", "206": "Laurens van Hoepen", "54": "Lando Norris", "161": "Gabriel Bortoleto", "207": "Nico Varrone", "58": "Charles Leclerc", "162": "Franco Colapinto", "59": "Pierre Gasly", "163": "Taylor Barnard"}; // tablas del apéndice del PDF oficial de EA «F1 25 2026 Season Pack (Season 8)»; un id que no esté aquí se guarda como «id N»
var RACE_TYPES = [15, 16, 17];
var SESSION_NAMES = {0: 'Desconocida', 1: 'Libres 1', 2: 'Libres 2', 3: 'Libres 3', 4: 'Libres cortas', 5: 'Clasificación 1', 6: 'Clasificación 2',
  7: 'Clasificación 3', 8: 'Clasificación corta', 9: 'Clasificación a una vuelta', 10: 'Sprint Shootout 1', 11: 'Sprint Shootout 2',
  12: 'Sprint Shootout 3', 13: 'Sprint Shootout corto', 14: 'Sprint Shootout a una vuelta', 15: 'Carrera', 16: 'Carrera 2', 17: 'Carrera 3', 18: 'Contrarreloj'};
var PEN_TYPES = {0: 'Drive through', 1: 'Stop & go', 2: 'Sanción en parrilla', 3: 'Recordatorio de sanción', 4: 'Sanción de tiempo',
  5: 'Aviso', 6: 'Descalificado', 7: 'Fuera de la vuelta de formación', 8: 'Parado demasiado tiempo', 9: 'Normas de neumáticos'};

function now() { return (G.__now ? G.__now() : Date.now()) / 1000; }
function pyRound(x, n) {      // como round() de Python (empates exactos al par)
  n = n || 0; var f = Math.pow(10, n), y = x * f, r = Math.round(y);
  if (Math.abs(y % 1) === 0.5) r = 2 * Math.round(y / 2);
  return n ? +(r / f).toFixed(n) : r;
}
function ms(m, p) { return m * 60000 + p; }
function has(a, v) { return a.indexOf(v) >= 0; }
function sortedBins(m) { return Object.keys(m).map(Number).sort(function (a, b) { return a - b; }).map(function (k) { return m[k]; }); }

var S;
function newState() {
  return {live: {}, lapdata: null, packets: 0, last_rx: 0, fmt: null, session: null, simulated: false, cur: null, laps: [], status: null,
    motion: null, cars: [], allcars: {}, carcomp: {}, names: {}, hist: {}, events: [], rrec: {}, rlaps: {}, damage: null, tyresets: null,
    player: null, track: null, sess_key: null, total_laps: 0, max_dist: -1.0, max_ms: -1,
    sx: {}, final: null, rlog: [], rl_lap: null, rl_f: null, last_save: 0, saved_final: false, tcache: {}};
}
S = newState();

function addWhy(c, reason, L, dist) {
  if (!has(c.unclean, reason)) {
    c.unclean.push(reason);
    (c.why = c.why || []).push({r: reason, dist: dist, ms: L.cur_ms, st: L.status, pit: L.pit});
  }
}
function sample(tel) {
  var L = S.lapdata; if (!L) return;
  var lap_no = L.lap, dist = L.dist, t = L.cur_ms / 1000.0;
  if (S.cur === null || S.cur.lap !== lap_no) {
    S.max_dist = -1.0; S.max_ms = -1;
    S.cur = {lap: lap_no, bins: {}, invalid: false, comp: (S.status || {}).comp, fuel: (S.status || {}).fuel_laps, session: S.session,
      track: S.track, unclean: [], why: [], s1: 0, s2: 0};
  }
  if (L.invalid) S.cur.invalid = true;
  if ((dist < S.max_dist - 50 && S.max_dist > 0) || L.cur_ms < S.max_ms - 500) {
    addWhy(S.cur, 'rebobinado/flashback', L, dist);
    Object.keys(S.cur.bins).forEach(function (k) { if (S.cur.bins[k][0] > dist) delete S.cur.bins[k]; });
  }
  S.max_dist = Math.max(S.max_dist, dist); S.max_ms = Math.max(S.max_ms, L.cur_ms);
  if (L.pit !== 0) addWhy(S.cur, 'boxes', L, dist);
  if (L.status === 0 || L.status === 2 || L.status === 3) addWhy(S.cur, 'vuelta de salida/entrada o garaje', L, dist);
  S.cur.s1 = Math.max(S.cur.s1, L.s1); S.cur.s2 = Math.max(S.cur.s2, L.s2);
  if (dist < 0) return;
  S.cur.t_rx = now();
  var b = Math.floor(dist / BIN);
  if (!(b in S.cur.bins)) { var mo = S.motion || [0.0, 0.0]; S.cur.bins[b] = [dist, t, tel.speed, tel.throttle, tel.brake, tel.gear, mo[0], mo[1]]; }
}

function rsample(i, w) {
  var a = S.allcars[i];
  if (!a || a.dist < 0) return;
  var c = S.rrec[i];
  if (c === undefined || c.lap !== a.lap) c = S.rrec[i] = {lap: a.lap, bins: {}, unclean: [], session: S.session};
  if (a.pit !== 0 && !has(c.unclean, 'boxes')) c.unclean.push('boxes');
  if ((a.status === 0 || a.status === 2 || a.status === 3) && !has(c.unclean, 'vuelta de salida/entrada o garaje')) c.unclean.push('vuelta de salida/entrada o garaje');
  c.t_rx = now();
  var ks = Object.keys(c.bins);
  if (ks.length) {
    var mx = Math.max.apply(null, ks.map(function (k) { return c.bins[k][0]; }));
    if (a.dist < mx - 50) { c.bins = {}; c.rewound = true; }
  }
  var b = Math.floor(a.dist / BIN);
  if (!(b in c.bins)) c.bins[b] = [a.dist, a.cur_ms / 1000.0, w[0], w[1], w[3], w[5], 0.0, 0.0];
}
function lapsSane(bins, last_ms) { return Math.abs(bins[bins.length - 1][1] - last_ms / 1000.0) < 15.0; }
function recClose(i, new_lap, last_ms) {
  var c = S.rrec[i];
  if (c && c.lap !== new_lap) {
    if (Object.keys(c.bins).length && last_ms > 0) {
      var bins = sortedBins(c.bins);
      if (bins[bins.length - 1][0] > 500 && lapsSane(bins, last_ms)) {
        var L = {lap: c.lap, time: last_ms / 1000.0, pts: bins, track: S.track, session: c.session, unclean: c.unclean, invalid: false,
          comp: (S.carcomp[i] || [null])[0]};
        (S.rlaps[i] = S.rlaps[i] || []).push(L);
        if (S.rlaps[i].length > 8) S.rlaps[i].splice(0, S.rlaps[i].length - 8);
      }
    }
    delete S.rrec[i];
  }
}
function closeLap(new_lap, last_ms) {
  var c = S.cur;
  if (c && c.lap !== new_lap && Object.keys(c.bins).length && last_ms > 0) {
    var bins = sortedBins(c.bins);
    if (c.track === null && S.sess_key && S.sess_key[0] === c.session) c.track = S.track;
    if (bins[bins.length - 1][0] > 500 && lapsSane(bins, last_ms)) {
      c.time = last_ms / 1000.0;
      c.s3 = (c.s1 && c.s2) ? Math.max(0, last_ms - c.s1 - c.s2) : 0;
      c.pts = bins;
      var o = {}; Object.keys(c).forEach(function (k) { if (k !== 'bins') o[k] = c[k]; });
      S.laps.push(o); if (S.laps.length > 60) S.laps = S.laps.slice(-60);
      S.dirty = now();
      saveLaps();
    }
    S.cur = null;
  }
}
function saveLaps() {}   // nada se guarda en disco: las vueltas viven solo mientras la app está abierta
function loadLaps() { try { var j = G.localStorage && G.localStorage.getItem('f1laps'); if (j) S.laps = JSON.parse(j); } catch (e) { S.laps = []; } }

function handle(data) {            // data: Uint8Array
  if (data.length < H) return;
  var v = new DataView(data.buffer, data.byteOffset, data.byteLength);
  var h = HDR.un(v, 0), fmt = h[0], pid = h[5], pidx = h[10];
  if (pidx >= N) return;
  var t0 = now();
  if (S.last_rx && t0 - S.last_rx > 10) { S.cur = null; S.lapdata = null; S.motion = null; S.status = null; S.rrec = {}; }
  S.pids = S.pids || {}; S.pids[pid] = (S.pids[pid] || 0) + 1;
  S.packets++; S.last_rx = t0; S.player = pidx; S.fmt = fmt; S.session = h[6];
  if (pid === 3 || pid === 11) return handleHistEvent(pid, data, v, h);
  if (pid === 8) return handleFinal(data, v);
  if (pid in EXTRA || pid === 12) return handleExtra(pid, data, v, pidx);
  if (!(pid in EXPECT)) return;
  var e = EXPECT[pid], st = e[0], total = e[1];
  if (data.length !== total) { S.live.warning = 'packet ' + pid + ' size ' + data.length + ', expected ' + total + ' (game version / format?)'; return; }
  if (pid === 1) {
    var ses = SES.un(v, H), track = [ses[6], ses[4], ses[5]];
    S.total_laps = ses[3];
    var key = [h[6], track];
    if (S.sess_key !== null && JSON.stringify(key) !== JSON.stringify(S.sess_key)) {
      S.arch_ses = S.sess_key[0]; archive('cambio de sesión'); delete S.arch_ses; S.chunk_base = null;
      S.cur = null; S.hist = {}; S.events = []; S.rrec = {}; S.rlaps = {}; S.live.session_changed = true;
      S.final = null; S.rlog = []; S.rl_lap = null; S.rl_f = null; S.saved_final = false; S.sx = {};
    }
    S.sess_key = key; S.track = track;
    sessionExtras(data, v, h);
    S.live.track = {id: track[0], length: track[1], type: track[2], total_laps: ses[3], is_result: classif(), fastest: fastLaps(), race: has(RACE_TYPES, track[2]),
      name: SESSION_NAMES[track[2]] || ('tipo ' + track[2])};
    return;
  }
  if (pid === 0) {
    S.cars = [];
    for (var i = 0; i < N; i++) { var c = MOT.un(v, H + i * MOT.size); if (c[0] !== 0.0 || c[2] !== 0.0) S.cars.push([i, c[0], c[2]]); }
    var m = MOT.un(v, H + pidx * MOT.size); S.motion = [m[0], m[2]];
    S.live.cars = S.cars; S.live.player = pidx; return;
  }
  var p = st.un(v, H + pidx * st.size);
  if (pid === 2) {
    S.allcars = {};
    for (var i2 = 0; i2 < N; i2++) {
      var w = st.un(v, H + i2 * st.size);
      if (w[13] === 0 && w[14] === 0) continue;
      S.allcars[i2] = {pos: w[13], lap: w[14], last_ms: w[0], front: ms(w[7], w[6]), leader: ms(w[9], w[8]), pits: w[16], pen: w[19],
        status: w[25], result: w[26], cur_ms: w[1], dist: w[10], pit: w[15]};
      if (i2 !== pidx) recClose(i2, w[14], w[0]);
    }
    S.lapdata = {last_ms: p[0], cur_ms: p[1], s1: ms(p[3], p[2]), s2: ms(p[5], p[4]), front: ms(p[7], p[6]), leader: ms(p[9], p[8]),
      dist: p[10], pos: p[13], lap: p[14], invalid: !!p[18], sector: p[17], status: p[25], pit: p[15]};
    closeLap(S.lapdata.lap, S.lapdata.last_ms);
    S.live.lap = S.lapdata;
    raceLogTick();
  } else if (pid === 6) {
    var tel = {speed: p[0], throttle: p[1], steer: p[2], brake: p[3], gear: p[5], rpm: p[6], drs: p[7], rev_pct: p[8], rev_bits: p[9],
      tyre_surf: p.slice(14, 18), tyre_inner: p.slice(18, 22), engine_temp: p[22], tyre_psi: p.slice(23, 27), brake_temp: p.slice(10, 14)};
    S.live.tel = tel; sample(tel);
    for (var i3 = 0; i3 < N; i3++) if (i3 !== pidx) rsample(i3, st.un(v, H + i3 * st.size));
  } else if (pid === 7) {
    for (var i4 = 0; i4 < N; i4++) { var w4 = st.un(v, H + i4 * st.size); S.carcomp[i4] = [w4[14], w4[15]]; }
    S.status = {fuel_kg: p[5], fuel_cap: p[6], brake_bias: p[3], fia: p[16], fuel_laps: p[7], max_rpm: p[8], comp: p[13], visual: p[14],
      tyre_age: p[15], ers_j: p[19], ers_mode: p[20], ers_dep: p[24], ers_harv_k: p[21], ers_harv_h: p[22]};
    S.live.status = S.status;
  } else if (pid === 16) {
    S.live.t2 = {aero_mode: p[0], aero_avail: p[1], aero_dist: p[2], boost_avail: p[3], boost_active: p[4], boost_dist: p[5], reg2026: p[6]};
  }
}

function handleHistEvent(pid, data, v, h) {
  if (pid === 11) {
    if (data.length !== HIST_TOTAL) { S.live.warning = 'packet 11 size ' + data.length + ', expected ' + HIST_TOTAL; return; }
    var hd = HIST_HEAD.un(v, H), car = hd[0], nl = hd[1];
    if (car >= N || nl > 100) return;
    var laps = [];
    for (var k = 0; k < nl; k++) {
      var t = HLAP.un(v, H + HIST_HEAD.size + k * HLAP.size);
      laps.push({lap: k + 1, ms: t[0], s1: ms(t[2], t[1]), s2: ms(t[4], t[3]), s3: ms(t[6], t[5]), flags: t[7]});
    }
    S.hist[car] = {laps: laps, best: hd[3], bs1: hd[4], bs2: hd[5], bs3: hd[6]};
    return;
  }
  if (data.length !== EV_TOTAL) { S.live.warning = 'packet 3 size ' + data.length + ', expected ' + EV_TOTAL; return; }
  var code = String.fromCharCode(data[H], data[H + 1], data[H + 2], data[H + 3]), d = H + 4, ev = null;
  if (code === 'PENA') {
    var pt = data[d];
    ev = {kind: 'PENA', car: data[d + 2], other: data[d + 3], ptype: pt, pname: PEN_TYPES[pt] || ('tipo ' + pt), secs: data[d + 4], lap: data[d + 5]};
  } else if (code === 'FTLP') { ev = {kind: 'FTLP', car: data[d], secs: v.getFloat32(d + 1, true)}; }
  else if (code === 'RTMT') ev = {kind: 'RTMT', car: data[d]};
  else if (has(['DRSE', 'DRSD', 'CHQF', 'RDFL', 'SSTA', 'SEND', 'LGOT'], code)) ev = {kind: code};
  else if (code === 'DTSV' || code === 'SGSV') ev = {kind: code, car: data[d]};
  else if (code === 'RCWN') ev = {kind: 'RCWN', car: data[d]};
  if (ev) {
    ev.t = h[7];
    ev.lap = ev.lap || ((S.allcars[ev.car] || {}).lap) || (S.lapdata || {}).lap;
    if (ev.lap === undefined) ev.lap = null;
    S.events.push(ev); if (S.events.length > 40) S.events.splice(0, S.events.length - 40);
  }
}

function handleExtra(pid, data, v, pidx) {
  if (pid === 12) {
    if (data.length !== TSET_TOTAL) { S.live.warning = 'packet 12 size ' + data.length + ', expected ' + TSET_TOTAL; return; }
    if (data[H] !== pidx) return;
    var sets = [];
    for (var k = 0; k < 20; k++) {
      var t = TSET.un(v, H + 1 + k * TSET.size);
      sets.push({actual: t[0], visual: t[1], wear: t[2], available: !!t[3], life: t[5], usable: t[6], delta_ms: t[7], fitted: !!t[8]});
    }
    S.tyresets = sets; S.live.tyresets = sets; return;
  }
  var e = EXTRA[pid], st = e[0], total = e[1];
  if (data.length !== total) { S.live.warning = 'packet ' + pid + ' size ' + data.length + ', expected ' + total; return; }
  if (pid === 10) {
    var q = st.un(v, H + pidx * st.size);
    S.damage = {wear: q.slice(0, 4), tyre_dmg: q.slice(4, 8), brake_dmg: q.slice(8, 12), blisters: q.slice(12, 16), wing_fl: q[16], wing_fr: q[17],
      wing_r: q[18], floor: q[19], diffuser: q[20], sidepod: q[21], drs_fault: q[22], ers_fault: q[23], gearbox: q[24], engine: q[25],
      w_mguh: q[26], w_es: q[27], w_ce: q[28], w_ice: q[29], w_mguk: q[30], w_tc: q[31], blown: q[32], seized: q[33]};
    S.live.damage = S.damage;
  } else if (pid === 4) {
    var n = data[H], names = {};
    for (var i = 0; i < Math.min(n, N); i++) {
      var r = st.un(v, H + 1 + i * st.size), bytes = r[7], z = bytes.indexOf(0); if (z >= 0) bytes = bytes.slice(0, z);
      var nm; try { nm = new TextDecoder('utf-8').decode(new Uint8Array(bytes)); } catch (x) { nm = String.fromCharCode.apply(null, bytes); }
      names[i] = {name: nm, ai: !!r[0], driver_id: r[1], network_id: r[2], team: r[3], my_team: r[4], number: r[5], nationality: r[6], restricted: r[8] === 0,
        your_telemetry: r[8], show_names: r[9], tech_level: r[10], platform: r[11]};
    }
    S.names = names; S.names_n = Object.keys(names).length; S.names_nonempty = Object.keys(names).filter(function (k) { return names[k].name; }).length;
  }
}

// ---------------- ingeniero ----------------
function bsearch(pts, d) {
  var lo = 0, hi = pts.length - 1;
  while (hi - lo > 1) { var m = Math.floor((lo + hi) / 2); if (pts[m][0] <= d) lo = m; else hi = m; }
  return [pts[lo], pts[hi]];
}
function interpTime(pts, d) {
  if (d <= pts[0][0]) return pts[0][1];
  if (d >= pts[pts.length - 1][0]) return null;
  var ab = bsearch(pts, d), a = ab[0], b = ab[1], f = b[0] > a[0] ? (d - a[0]) / (b[0] - a[0]) : 0;
  return a[1] + f * (b[1] - a[1]);
}
function interpField(pts, d, i) {
  if (d <= pts[0][0]) return pts[0][i];
  if (d >= pts[pts.length - 1][0]) return pts[pts.length - 1][i];
  var ab = bsearch(pts, d), a = ab[0], b = ab[1], f = b[0] > a[0] ? (d - a[0]) / (b[0] - a[0]) : 0;
  return a[i] + f * (b[i] - a[i]);
}
function pyStr(x) { return x === null || x === undefined ? 'None' : String(x); }
function compare(a, r, seg) {
  seg = seg || 100.0; var cav_cov = '';
  var ta_ = a.track, tr_ = r.track;
  if (!ta_ || !tr_ || ta_[0] !== tr_[0]) return {error: 'No comparable: circuito distinto o desconocido (falta el paquete Session).'};
  var pa = a.pts, pr = r.pts, end = Math.min(pa[pa.length - 1][0], pr[pr.length - 1][0]);
  var xs = [], delta = [], sa = [], sr = [], ta = [], tr = [], ba = [], br = [], d = 0.0;
  while (d <= end) {
    var t1 = interpTime(pa, d), t2 = interpTime(pr, d);
    if (t1 === null || t2 === null) break;
    xs.push(pyRound(d)); delta.push(pyRound(t1 - t2, 3));
    sa.push(pyRound(interpField(pa, d, 2))); sr.push(pyRound(interpField(pr, d, 2)));
    ta.push(pyRound(interpField(pa, d, 3), 2)); tr.push(pyRound(interpField(pr, d, 3), 2));
    ba.push(pyRound(interpField(pa, d, 4), 2)); br.push(pyRound(interpField(pr, d, 4), 2));
    d += BIN;
  }
  var GAPMAX = 25.0; // criterio propio: hueco entre muestras de una traza (m) a partir del cual no se interpreta ese tramo
  function gapsOf(pts) { var g = [], mx = 0; for (var q = 0; q < pts.length - 1; q++) { var dd = pts[q + 1][0] - pts[q][0]; if (dd > mx) mx = dd; if (dd > GAPMAX) g.push([pts[q][0], pts[q + 1][0]]); } return {gaps: g, max: mx, n: pts.length}; }
  function inGap(g, x) { for (var q = 0; q < g.length; q++) if (x > g[q][0] && x < g[q][1]) return 1; return 0; }
  var qa = gapsOf(pa), qr = gapsOf(pr), ga = [], gr = [];
  // Cobertura de extremos (mismo criterio explícito de GAPMAX): si la traza empieza más allá de GAPMAX desde la meta, lo anterior no se extrapola; queda sin datos.
  var tl = (a.track && a.track[1]) || 0, s0a = pa[0][0], s0r = pr[0][0], e0a = pa[pa.length - 1][0], e0r = pr[pr.length - 1][0];
  var startA = s0a > GAPMAX, startR = s0r > GAPMAX;
  xs.forEach(function (x) { ga.push(inGap(qa.gaps, x) || (startA && x < s0a) ? 1 : 0); gr.push(inGap(qr.gaps, x) || (startR && x < s0r) ? 1 : 0); });
  var endKnown = tl > 0, endA = endKnown ? e0a < tl - GAPMAX : null, endR = endKnown ? e0r < tl - GAPMAX : null;
  var covOk = !startA && !startR && endKnown && !endA && !endR;
  var cov = {a: {start: pyRound(s0a), end: pyRound(e0a)}, r: {start: pyRound(s0r), end: pyRound(e0r)}, track_len: endKnown ? pyRound(tl) : null,
    start_ok_a: !startA, start_ok_r: !startR, end_ok_a: endA === null ? null : !endA, end_ok_r: endR === null ? null : !endR, ok: endKnown ? covOk : null};
  var segs = [], k = Math.floor(seg / BIN);
  function mn(arr, i, j) { var m = Infinity; for (var x = i; x <= j; x++) m = Math.min(m, arr[x]); return m; }
  function first(arr, i, j) { for (var x = i; x <= j; x++) if (arr[x] > 0.3) return xs[x]; return null; }
  function cnt(arr, i, j) { var c = 0; for (var x = i; x <= j; x++) if (arr[x] > 0.95) c++; return c; }
  for (var i = 0; i < xs.length - k; i += k) {
    var j = Math.min(i + k, xs.length - 1);
    var nod = false; for (var z = i; z <= j; z++) if (ga[z] || gr[z]) { nod = true; break; }
    segs.push({start: xs[i], end: xs[i + k], nodata: nod, loss: nod ? null : pyRound(delta[i + k] - delta[i], 3), min_speed_a: mn(sa, i, j), min_speed_r: mn(sr, i, j),
      brake_start_a: first(ba, i, j), brake_start_r: first(br, i, j), full_throttle_a: cnt(ta, i, j), full_throttle_r: cnt(tr, i, j)});
  }
  if (startA || startR || endA || endR || !endKnown) {
    var cp = [];
    if (startA) cp.push('tu traza empieza a ' + Math.round(s0a) + ' m de la meta');
    if (startR) cp.push('la del rival empieza a ' + Math.round(s0r) + ' m');
    if (endA) cp.push('tu traza termina a ' + Math.round(e0a) + ' m de ' + Math.round(tl));
    if (endR) cp.push('la del rival termina a ' + Math.round(e0r) + ' m de ' + Math.round(tl));
    if (!endKnown) cp.push('no se conoce la longitud del circuito para comprobar el final');
    cav_cov = 'Cobertura insuficiente (criterio propio: más de ' + GAPMAX + ' m sin traza en el inicio o el final): ' + cp.join('; ') + '. Esos extremos no se extrapolan ni se interpretan; los tiempos de vuelta son los del juego pero no se afirma que la traza cubra la vuelta entera.';
  }
  var okSegs = segs.filter(function (x) { return !x.nodata; });
  var worst = okSegs.slice().sort(function (x, y) { return y.loss - x.loss; }).slice(0, 5);
  var best = okSegs.slice().sort(function (x, y) { return x.loss - y.loss; }).slice(0, 3);
  var cav = [];
  if (cav_cov) cav.push(cav_cov);
  var nNo = segs.length - okSegs.length;
  if (nNo > 0) cav.push('Huecos en la traza (' + (qa.gaps.length ? 'tuya: ' + qa.gaps.length + ', hueco máx. ' + Math.round(qa.max) + ' m' : '') + (qa.gaps.length && qr.gaps.length ? '; ' : '') + (qr.gaps.length ? 'del rival: ' + qr.gaps.length + ', hueco máx. ' + Math.round(qr.max) + ' m' : '') + '): ' + nNo + ' de ' + segs.length + ' tramos de 100 m sin datos suficientes. No se interpretan ni se dan consejos de freno o gas ahí; las líneas no se unen. Criterio propio: hueco mayor de ' + GAPMAX + ' m entre muestras.');
  if (a.session !== r.session) cav.push('Vueltas de sesiones distintas en el mismo circuito: clima y condiciones pueden diferir.');
  if (ta_[2] !== tr_[2]) cav.push('Tipos de sesión distintos (' + (SESSION_NAMES[ta_[2]] !== undefined ? SESSION_NAMES[ta_[2]] : ta_[2]) + ' vs ' + (SESSION_NAMES[tr_[2]] !== undefined ? SESSION_NAMES[tr_[2]] : tr_[2]) + '): no es comparable como carrera.');
  [['tuya', a], ['referencia', r]].forEach(function (x) { if (x[1].unclean && x[1].unclean.length) cav.push('Vuelta ' + x[0] + ' no comparable según el criterio de la app (no es la validez del juego): ' + x[1].unclean.join(', ') + '.'); });
  if (a.comp != null && r.comp != null && a.comp !== r.comp) cav.push('Compuesto distinto (' + a.comp + ' vs ' + r.comp + '): parte de la diferencia puede ser del neumático, no de la conducción.');
  if (a.fuel != null && r.fuel != null && Math.abs(a.fuel - r.fuel) > 1.0) cav.push('Combustible distinto en unas ' + Math.abs(a.fuel - r.fuel).toFixed(1) + ' vueltas: el peso cambia el tiempo.');
  if (a.invalid || r.invalid) cav.push('Una de las vueltas está marcada como inválida en el juego.');
  cav.push('Temperatura de pista, viento, desgaste de neumático y tráfico no se miden aquí: la comparación es orientativa.');
  var wx = xs.map(function (x) { return pyRound(interpField(pr, x, 6), 1); }), wz = xs.map(function (x) { return pyRound(interpField(pr, x, 7), 1); });
  var sec = [];
  if (a.s1 && a.s2 && a.s3 && r.s1 && r.s2 && r.s3) {
    ['s1', 's2', 's3'].forEach(function (kk, i) { sec.push({name: 'S' + (i + 1), a: a[kk] / 1000.0, r: r[kk] / 1000.0, d: pyRound((a[kk] - r[kk]) / 1000.0, 3)}); });
  }
  return {coverage: cov, quality: {a: {n: qa.n, max_gap: pyRound(qa.max, 1), gaps: qa.gaps.length}, r: {n: qr.n, max_gap: pyRound(qr.max, 1), gaps: qr.gaps.length}, nodata_segs: nNo, segs: segs.length, gapmax: GAPMAX}, ga: ga, gr: gr, segs: segs, sectors: sec, wx: wx, wz: wz, x: xs, delta: delta, speed_a: sa, speed_r: sr, thr_a: ta, thr_r: tr, brk_a: ba, brk_r: br,
    total: pyRound(a.time - r.time, 3), worst: worst, best: best, caveats: cav};
}
function liveLap(c, track) {
  if (!c || !Object.keys(c.bins).length) return null;
  var bins = sortedBins(c.bins); if (bins.length < 3) return null;
  var gap = 0; for (var i = 0; i < bins.length - 1; i++) gap = Math.max(gap, bins[i + 1][0] - bins[i][0]);
  return {lap: c.lap, pts: bins, track: track, session: c.session, unclean: (c.unclean || []).slice(), invalid: !!c.invalid, comp: c.comp,
    time: bins[bins.length - 1][1], t_rx: c.t_rx, gap: gap};
}
function compareLive(a, r) {
  var d = compare(a, r); if (d.error) return d;
  d.live = true; d.my_dist = pyRound(a.pts[a.pts.length - 1][0]); d.rival_dist = pyRound(r.pts[r.pts.length - 1][0]);
  d.my_lap = a.lap; d.rival_lap = r.lap; d.x_end = d.x.length ? d.x[d.x.length - 1] : 0;
  d.total = d.delta.length ? d.delta[d.delta.length - 1] : 0.0; d.sectors = [];
  d.caveats = d.caveats.filter(function (c) { return c.indexOf('Vuelta') !== 0; });
  [['tu vuelta', a], ['la del rival', r]].forEach(function (x) {
    var l = x[1];
    if (l.unclean && l.unclean.length) d.caveats.unshift('En curso, ' + x[0] + ' no cumple hasta ahora el criterio de comparación de la app: ' + l.unclean.join(', ') + '.');
    if ((l.gap || 0) > 60) d.caveats.unshift('Hay un hueco de ' + pyRound(l.gap) + ' m sin muestras en ' + x[0] + ' (paquetes perdidos o salto): esa parte se interpola.');
  });
  var n = now();
  d.my_age = a.t_rx ? pyRound(n - a.t_rx, 1) : null; d.rival_age = r.t_rx ? pyRound(n - r.t_rx, 1) : null;
  if (a.lap !== r.lap) d.caveats.unshift('Cada coche va en una vuelta distinta (tú V' + a.lap + ', rival V' + r.lap + '): se compara a la misma distancia dentro de su vuelta.');
  return d;
}
// Estado de validez del juego de una vuelta: Session History (lapValidBitFlags) y marca en directo (currentLapInvalid).
function validity(l) {
  var g = gameValid(l), live = !!l.invalid;
  if (g === true) return live ? 'conflicto' : 'valida';
  if (g === false) return 'invalida';
  return live ? 'invalida' : 'sin_dato';
}
// Elegible para la selección automática: comparable (criterio de la app) y sin invalidez indicada por el juego ni conflicto.
function clean(l) { var v = validity(l); return (v === 'valida' || v === 'sin_dato') && !(l.unclean && l.unclean.length); }
function gameValid(l) {
  var h = S.hist[S.player]; if (!h || !h.laps) return null;
  for (var i = 0; i < h.laps.length; i++) if (h.laps[i].lap === l.lap && h.laps[i].ms > 0) return (h.laps[i].flags & 1) ? true : false;
  return null;
}
function lapList() {
  var ref = null;
  S.laps.forEach(function (l) { if (clean(l) && (ref === null || l.time < ref.time)) ref = l; });
  return S.laps.map(function (l, i) {
    var t = l.track || [null, null, null];
    return {id: i, lap: l.lap, time: l.time, invalid: l.invalid, unclean: l.unclean || [], track: t[0], stype: t[2], comp: l.comp === undefined ? null : l.comp,
      is_best: l === ref, s1: l.s1 || 0, s2: l.s2 || 0, s3: l.s3 || 0, why: l.why || [], game_valid: gameValid(l), validity: validity(l), live_invalid: !!l.invalid, eligible: clean(l)};
  });
}
function rivalLaps(i) { return (S.rlaps[i] || []).filter(function (l) { return !(l.unclean && l.unclean.length); }); }
function rivalSummary() {
  var out = {};
  Object.keys(S.rlaps).forEach(function (i) {
    var ls = rivalLaps(i);
    if (ls.length) out[i] = {n: ls.length, best: Math.min.apply(null, ls.map(function (l) { return l.time; })), last: ls[ls.length - 1].time};
  });
  return out;
}
function histOut() {
  var out = {};
  Object.keys(S.hist).forEach(function (i) {
    var hh = S.hist[i], done = hh.laps.slice(0, -1).filter(function (l) { return l.ms > 0; });
    function bst(key, bit) { var v = done.filter(function (l) { return l[key] > 0 && (l.flags & bit); }).map(function (l) { return l[key]; }); return v.length ? Math.min.apply(null, v) : 0; }
    out[i] = {laps: done.slice(-12), best: bst('ms', 1), b1: bst('s1', 2), b2: bst('s2', 4), b3: bst('s3', 8)};
  });
  return out;
}
function stateOut() {
  var ids = Object.keys(S.allcars).map(Number).sort(function (a, b) { return (S.allcars[a].pos || 99) - (S.allcars[b].pos || 99) || a - b; });
  var cars = ids.map(function (i) {
    var o = {idx: i, player: i === S.player, comp: S.carcomp[i] || null}, c = S.allcars[i];
    Object.keys(c).forEach(function (k) { o[k] = c[k]; });
    o.name = (S.names[i] || {}).name; if (o.name === undefined) o.name = null;
    o.restricted = (S.names[i] || {}).restricted; if (o.restricted === undefined) o.restricted = null;
    return o;
  });
  return {live: S.live, packets: S.packets, age: S.last_rx ? now() - S.last_rx : null, fmt: S.fmt, simulated: S.simulated, size_ok: SIZE_OK,
    laps: lapList(), result: classif(), fastest: fastLaps(), race: has(RACE_TYPES, (S.track || [0, 0, -1])[2]) ? raceEvolution() : null, session_extra: S.sx, hist: histOut(), events: S.events.slice(), rec: rivalSummary(), cars: cars};
}
function rcompare(q) {
  try {
    var car = parseInt(q.car, 10);
    if (isNaN(car)) throw new Error("invalid literal for int()");
    if (q.view === 'live') {
      var tl = ((S.track || [null, 0, null])[1]) || 0, a_ = liveLap(S.cur, S.track), r_ = liveLap(S.rrec[car], S.track),
          age = S.last_rx ? now() - S.last_rx : null;
      var base = {live: true, track_len: tl, age: age, my_dist: a_ ? pyRound(a_.pts[a_.pts.length - 1][0]) : null, rival_dist: r_ ? pyRound(r_.pts[r_.pts.length - 1][0]) : null};
      if (!a_ || !r_) { base.error = 'Sin datos de la vuelta en curso: ' + (!a_ ? 'tu vuelta no ha empezado a registrarse' : 'el rival aún no tiene suficientes datos en su vuelta actual') + '.'; return base; }
      var d = compareLive(a_, r_);
      Object.keys(base).forEach(function (k) { if (k !== 'my_dist' && k !== 'rival_dist') d[k] = base[k]; });
      return d;
    }
    var rl = rivalLaps(car), mine = S.laps.filter(clean);
    if (!rl.length) return {error: 'Aún no hay una vuelta grabada de ese piloto que cumpla el criterio de comparación de la app (sin boxes, sin rebobinado, sin vuelta de salida/entrada).'};
    if (!mine.length) return {error: 'Aún no tienes una vuelta grabada elegible: comparable según el criterio de la app (sin boxes, sin rebobinado, sin vuelta de salida/entrada) y sin invalidez indicada por el juego ni datos en conflicto. Las demás se pueden inspeccionar en Ingeniero con su estado y motivo.'};
    function minBy(ls) { return ls.reduce(function (b, l) { return l.time < b.time ? l : b; }); }
    var rr = (q.which || 'best') === 'best' ? minBy(rl) : rl[rl.length - 1], aa = (q.mine || 'best') === 'best' ? minBy(mine) : mine[mine.length - 1];
    var dd = compare(aa, rr);
    if (!dd.error) {
      dd.rival_lap = rr.lap; dd.my_lap = aa.lap; dd.rival_time = rr.time; dd.my_time = aa.time;
      dd.caveats.unshift('Telemetría del rival calculada por el programa con Car Telemetry y Lap Data de ese coche (la especificación los envía para todos los coches). Sin probar con el juego real.');
    }
    return dd;
  } catch (e) { return {error: String(e && e.message || e)}; }
}
function compareLaps(q) {
  try { return compare(S.laps[parseInt(q.a, 10)], S.laps[parseInt(q.r, 10)]); } catch (e) { return {error: String(e && e.message || e)}; }
}


// ---------------- v0.4: sesión, clasificación final, evolución de carrera e histórico ----------------
function nm(tbl, id) { return (id in tbl) ? tbl[id] : 'id ' + id; }
function uidHex(q) { var p = String(q).split(':'); function h8(x) { return ('00000000' + (+x).toString(16)).slice(-8); } return h8(p[0]) + h8(p[1]); }
function sessionExtras(data, v, h) {   // desplazamientos calculados del PDF de EA (suma comprobada: 926 bytes)
  var x = S.sx;
  x.uid = uidHex(h[6]); if (!x.t_first) x.t_first = new Date().toISOString();
  x.formula = data[37]; x.spectating = data[44]; x.spectator_car = data[45]; x.sc_status = data[153]; x.online = data[154];
  x.ai_difficulty = data[669]; x.season_link = v.getUint32(670, true); x.weekend_link = v.getUint32(674, true); x.session_link = v.getUint32(678, true);
  x.game_mode = data[694]; x.rule_set = data[695]; x.session_length = data[700]; x.equal_cars = data[708]; x.car_damage = data[716]; x.collisions = data[718];
}
var FC = mk('<BBBBBBBIdBBB8s8s8s'); // posición, vueltas, parrilla, puntos, paradas, estado, motivo, mejor vuelta ms, tiempo total (s), sanción s, nº sanciones, nº stints, neumáticos
function handleFinal(data, v) {
  if (data.length !== 1134) { S.live.warning = 'packet 8 size ' + data.length + ', expected 1134'; return; }
  var n = data[H], rows = {};
  for (var i = 0; i < Math.min(n, N); i++) {
    var r = FC.un(v, H + 1 + i * FC.size);
    rows[i] = {pos: r[0], laps: r[1], grid: r[2], points: r[3], pits: r[4], status: r[5], reason: r[6], best_ms: r[7], total_s: r[8], pen_s: r[9], n_pen: r[10], stints: r[11]};
  }
  S.final = {n: n, cars: rows};
  archive('clasificación final');
}
function raceLogTick() {
  var L = S.lapdata; if (!L || !S.track || !has(RACE_TYPES, S.track[2])) return;
  var sc = S.sx.sc_status || 0;
  if (S.rl_lap === null) { S.rl_lap = L.lap; S.rl_f = {pit: 0, sc: 0, inv: 0, first: true}; }
  var f = S.rl_f;
  if (L.pit) f.pit = 1; if (sc) f.sc = Math.max(f.sc, sc); if (L.invalid) f.inv = 1;
  if (L.lap === S.rl_lap) return;
  if (L.lap === S.rl_lap + 1 && L.last_ms > 0) {
    var ids = Object.keys(S.allcars).map(Number), ahead = null, behind = null;
    ids.forEach(function (i) { var a = S.allcars[i]; if (a.pos === L.pos - 1) ahead = i; if (a.pos === L.pos + 1) behind = i; });
    S.rlog.push({lap: S.rl_lap, pos: L.pos, lap_ms: L.last_ms, front_ms: L.pos > 1 ? L.front : null, ahead: ahead,
      ahead_lap_down: ahead !== null ? S.allcars[ahead].lap < L.lap : null,
      behind_ms: behind !== null ? S.allcars[behind].front : null, behind: behind, behind_lap_down: behind !== null ? S.allcars[behind].lap < L.lap : null,
      leader_ms: L.pos > 1 ? L.leader : null, pit: f.pit, sc: f.sc, invalid: f.inv, partial: f.first});
    if (S.rlog.length > 120) S.rlog.shift();
  }
  S.rl_lap = L.lap; S.rl_f = {pit: 0, sc: 0, inv: 0, first: false};
}
// Lectura de la evolución: solo hechos del juego (Lap Data) y cálculos propios marcados como tales.
function raceEvolution() {
  var log = S.rlog, out = [], prev = null;
  log.forEach(function (e) {
    var why = [];
    if (e.partial) why.push('vuelta vista a medias');
    if (e.pit) why.push('boxes'); if (e.sc) why.push('coche de seguridad/VSC/formación'); if (e.invalid) why.push('vuelta inválida según el juego');
    var o = {lap: e.lap, pos: e.pos, lap_ms: e.lap_ms, front_ms: e.front_ms, behind_ms: e.behind_ms, ahead: e.ahead, behind: e.behind,
      d_lap_ms: null, d_front_ms: null, d_behind_ms: null, notes: why.slice(), comparable: !why.length, ahead_changed: false, behind_changed: false};
    if (prev && prev.lap === e.lap - 1) {
      var pc = out[out.length - 1]; if (pc.comparable && o.comparable) o.d_lap_ms = e.lap_ms - prev.lap_ms;
      if (!pc.comparable && o.comparable) o.notes.push('sin comparación con la vuelta anterior (' + (pc.notes[0] || 'no comparable') + '): ni tu tiempo ni los huecos');
      else if (!o.comparable) o.notes.push('sin comparación con la vuelta anterior: esta vuelta no es comparable');
      var both = pc.comparable && o.comparable;
      if (both && e.ahead !== null && e.ahead === prev.ahead && e.front_ms !== null && prev.front_ms !== null && !e.ahead_lap_down && !prev.ahead_lap_down) o.d_front_ms = e.front_ms - prev.front_ms;
      if (both && e.behind !== null && e.behind === prev.behind && e.behind_ms !== null && prev.behind_ms !== null && !e.behind_lap_down && !prev.behind_lap_down) o.d_behind_ms = e.behind_ms - prev.behind_ms;
      if (e.ahead !== prev.ahead) { o.ahead_changed = true; o.notes.push('cambió el coche de delante (adelantamiento, boxes o retirada): no se compara el hueco'); }
      if (e.behind !== prev.behind) { o.behind_changed = true; o.notes.push('cambió el coche de detrás: no se compara el hueco'); }
    }
    if (e.ahead_lap_down) o.notes.push('el de delante va una vuelta por detrás (doblado): su hueco no cuenta');
    if (e.behind_lap_down) o.notes.push('el de detrás va una vuelta por detrás (doblado): su hueco no cuenta');
    out.push(o); prev = e;
  });
  var clean = out.filter(function (o) { return o.comparable; }), tr = {n: clean.length};
  if (clean.length >= 4) {   // criterio propio: pendiente por mínimos cuadrados con al menos 4 vueltas comparables
    var xs = clean.map(function (o) { return o.lap; }), ys = clean.map(function (o) { return o.lap_ms; }), n = xs.length;
    var mx = xs.reduce(function (a, b) { return a + b; }) / n, my = ys.reduce(function (a, b) { return a + b; }) / n, sxy = 0, sxx = 0;
    for (var i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
    var srt = ys.slice().sort(function (a, b) { return a - b; });
    tr.slope_ms_per_lap = sxx ? Math.round(sxy / sxx) : null; tr.median_ms = srt[Math.floor(n / 2)]; tr.best_ms = srt[0]; tr.spread_ms = srt[n - 1] - srt[0];
    tr.method = 'cálculo propio (recta por mínimos cuadrados) sobre vueltas sin boxes, sin coche de seguridad, sin invalidez y completas; orientativo, el combustible baja y el neumático cae';
  } else tr.note = 'menos de 4 vueltas comparables: sin tendencia';
  return {laps: out, trend: tr, source: 'Lap Data: tiempo de última vuelta, tiempo al coche de delante y posición, leídos al cambiar tu contador de vuelta (aproximación a la línea de meta). El hueco de detrás es el «tiempo al de delante» del coche que viene detrás.'};
}
function pname(i) {
  var n = S.names[i]; if (!n) return null;
  if (i === S.player || n.ai || n.show_names === 1) return n.name;
  return 'humano #' + i;
}
function teamOf(i) { var n = S.names[i]; return n ? {id: n.team, name: nm(EA_TEAMS, n.team)} : null; }
function classif() {
  var rows = [];
  if (S.final) {
    Object.keys(S.final.cars).forEach(function (i) { var c = S.final.cars[i]; rows.push({pos: c.pos, car: +i, name: pname(+i), team: (teamOf(+i) || {}).name || null, grid: c.grid, laps: c.laps, points: c.points, pits: c.pits,
      status: c.status, reason: c.reason, best_ms: c.best_ms, total_s: c.total_s, pen_s: c.pen_s, me: +i === S.player}); });
    return {source: 'final', rows: rows.sort(function (a, b) { return a.pos - b.pos; })};
  }
  Object.keys(S.allcars).forEach(function (i) { var a = S.allcars[i]; rows.push({pos: a.pos, car: +i, name: pname(+i), team: (teamOf(+i) || {}).name || null, lap: a.lap, status: a.result, me: +i === S.player}); });
  return {source: 'provisional (Lap Data en directo; no se recibió la clasificación final)', rows: rows.sort(function (a, b) { return a.pos - b.pos; })};
}
function fastLaps() {
  var h = histOut();
  return Object.keys(h).map(function (i) { return {car: +i, name: pname(+i), best_valid_ms: h[i].best || null, s1: h[i].b1 || null, s2: h[i].b2 || null, s3: h[i].b3 || null, me: +i === S.player}; })
    .filter(function (r) { return r.best_valid_ms; }).sort(function (a, b) { return a.best_valid_ms - b.best_valid_ms; });
}

// ---------------- v1.0: trazas de vuelta (velocidad, gas, freno, tiempo) cada 10 m para comparar en el visor ----------------
var TSTEP = 10, TBUDGET = 225000;
function encLap(l, car, session) {
  var pts = l.pts; if (!pts || pts.length < 3) return null;
  var tl = ((l.track || S.track || [null, 0])[1]) || 0, end = pts[pts.length - 1][0];
  if (tl > 0) end = Math.min(end, tl);
  var sp = [], th = [], br = [], tt = [], prev = null, mg = 0;
  for (var q = 0; q < pts.length - 1; q++) { var g = pts[q + 1][0] - pts[q][0]; if (g > mg) mg = g; }
  for (var d = 0; d <= end; d += TSTEP) {
    var t = interpTime(pts, d); if (t === null) break;
    var cs = Math.round(t * 100);
    tt.push(prev === null ? cs : cs - prev); prev = cs;
    sp.push(Math.round(interpField(pts, d, 2))); th.push(Math.round(interpField(pts, d, 3) * 100)); br.push(Math.round(interpField(pts, d, 4) * 100));
  }
  if (tt.length < 10) return null;
  return {c: car, l: l.lap, T: l.time, s: (l.s1 && l.s2 && l.s3) ? [l.s1, l.s2, l.s3] : null, g: Math.round(mg), a: Math.round(pts[0][0]), e: Math.round(pts[pts.length - 1][0]),
    comp: l.comp === undefined ? null : l.comp, sp: sp.join(','), th: th.join(','), br: br.join(','), t: tt.join(','), _s: session};
}
function hash32(str) { var h = 5381; for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return h + ':' + str.length; }
function chunkInfo(n) { var m = /^tz(\d\d)_(.+)\.json$/.exec(n); return m ? {k: +m[1], base: m[2]} : null; }
function resumeTraces(ses, me) {
  /* Tras reiniciar la app con la misma sesión del juego, recupera las trazas guardadas antes (primero los archivos completos tzNN_, si no el archivo normal). */
  S.resumed = S.resumed || {};
  if (ses === null || ses === undefined || me === null || S.resumed[ses] || !G.Android || !G.Android.listSessions || !G.Android.readSession) return;
  S.resumed[ses] = 1; S.resume_info = {from: [], laps: 0};
  try {
    var suf = String(S.sx.uid || ses).slice(-8) + '.json', ls = JSON.parse(G.Android.listSessions()).map(function (x) { return x.name; }).filter(function (n) { return n && n.slice(-suf.length) === suf; }).sort();
    var chunks = ls.filter(function (n) { return chunkInfo(n); }), files = chunks.length ? chunks : ls;
    S.cdone = S.cdone || {};
    files.forEach(function (n) {
      var raw = G.Android.readSession(n), r = JSON.parse(raw), tr = chunks.length ? r : (r && r.traces); if (!tr || !tr.laps || (tr.me != null && tr.me !== me)) return;
      var ci = chunkInfo(n); if (ci) { S.chunk_base = ci.base; S.cdone[n] = hash32(raw); }
      tr.laps.forEach(function (e) {
        var key = e.c + '_' + e.l + '_' + ses; if (S.tcache[key]) return;
        var o = {}; Object.keys(e).forEach(function (k) { o[k] = e[k]; }); o._s = ses; S.tcache[key] = o; S.resume_info.laps++;
      });
      S.resume_info.from.push(n);
    });
  } catch (e) { S.live.warning = 'resume traces: ' + e.message; }
}
function fillCache(ses, me) {
  resumeTraces(ses, me);
  var cache = S.tcache;
  function put(l, car, own) {
    var key = car + '_' + l.lap + '_' + l.session; if (cache[key]) return;
    if (own ? !clean(l) : (l.unclean && l.unclean.length)) return;
    var e = encLap(l, car, l.session); if (e) cache[key] = e;
  }
  S.laps.forEach(function (l) { if (me !== null) put(l, me, true); });
  Object.keys(S.rlaps).forEach(function (i) { S.rlaps[i].forEach(function (l) { put(l, +i, false); }); });
}
function stripE(e) { var o = {}; Object.keys(e).forEach(function (k) { if (k !== '_s') o[k] = e[k]; }); return o; }
function sesEntries(ses) { return Object.keys(S.tcache).map(function (k) { return S.tcache[k]; }).filter(function (e) { return e._s === ses; }); }
function carsAll(rec, ents, me) {
  var have = {}; ents.forEach(function (e) { if (e.c !== me) have[e.c] = 1; });
  var cars = [], seen = {};
  ((rec.classification || {}).rows || []).forEach(function (r) { if (!r.me && have[r.car]) { cars.push({c: r.car, name: r.name || null, pos: r.pos}); seen[r.car] = 1; } });
  Object.keys(have).forEach(function (c) { if (!seen[c]) cars.push({c: +c, name: pname(+c) || null, pos: null}); });
  return cars;
}
function fullTraces(rec) {
  var ses = S.arch_ses !== undefined ? S.arch_ses : S.session, me = S.player;
  fillCache(ses, me);
  var ents = sesEntries(ses), isRace = has(RACE_TYPES, (S.track || [0, 0, -1])[2]);
  var restricted = []; Object.keys(S.names).forEach(function (i) { if (+i !== me && S.names[i] && S.names[i].your_telemetry === 0) restricted.push(+i); });
  return {step_m: TSTEP, race: isRace, me: me, me_name: (S.names[me] || {}).name || null, cars: carsAll(rec, ents, me), laps: ents.map(stripE), skipped: [], restricted_cars: restricted, complete: true,
    note: 'Todas las vueltas válidas guardadas (tuyas y de rivales), sin recorte.'};
}
var CHUNK = 300000;   // más de 250 KB a propósito: la app no sube archivos de ese tamaño, se quedan completos en el móvil
function writeChunks(rec, ses, base) {
  /* Guarda TODAS las trazas en archivos locales tzNN_<sesión>.json de ~300 KB. Los llenos no cambian nunca; solo se reescribe el último. */
  var ents = sesEntries(ses); if (!ents.length || !G.Android || !G.Android.saveSession) return 0;
  S.cseal = S.cseal || {}; var st = S.cseal[ses] = S.cseal[ses] || {k: 0, at: 0}; S.cdone = S.cdone || {};
  function nm(k) { return 'tz' + (k < 10 ? '0' : '') + k + '_' + base + '.json'; }
  function put(k, arr) {
    var ob = {schema: 'f1-historial/1', companion_of: base, chunk: k, session: {uid: S.sx.uid}, laps: arr.map(stripE)}, json = JSON.stringify(ob), n = nm(k);
    if (json.length < 258000) { ob.pad = new Array(258000 - json.length + 12).join(' '); json = JSON.stringify(ob); }   /* siempre > 250 KB: la subida los salta sin intentarlo */
    var h = hash32(json);
    if (S.cdone[n] === h) return;
    var r = G.Android.saveSession(n, json); if (r === 'OK' || r == null) S.cdone[n] = h; else S.live.warning = 'trazas: ' + r;
  }
  var cur = [], sz = 0, i = st.at;
  for (; i < ents.length; i++) {
    var e = ents[i], es = e.sp.length + e.th.length + e.br.length + e.t.length + 160;
    if (cur.length && sz + es > CHUNK) { put(st.k, cur); st.k++; st.at = i; cur = []; sz = 0; }
    cur.push(e); sz += es;
  }
  if (cur.length) put(st.k, cur);
  return st.k + 1;
}
function buildTraces(rec) {
  var cache = S.tcache, ses = S.arch_ses !== undefined ? S.arch_ses : S.session, me = S.player;
  fillCache(ses, me);
  var all = Object.keys(cache).map(function (k) { return cache[k]; }).filter(function (e) { return e._s === ses; });
  var mine = all.filter(function (e) { return e.c === me; }), myLaps = {}; mine.forEach(function (e) { myLaps[e.l] = 1; });
  var base = JSON.stringify(rec, null, 1).length, left = TBUDGET - base - 2000, out = [], cars = [], skipped = [], cnt = {};
  function size(e) { return e.sp.length + e.th.length + e.br.length + e.t.length + 120; }
  function strip(e) { var o = {}; Object.keys(e).forEach(function (k) { if (k !== '_s') o[k] = e[k]; }); return o; }
  var isRace = has(RACE_TYPES, (S.track || [0, 0, -1])[2]);
  if (!isRace && mine.length > 8) { mine.sort(function (a, b) { return a.T - b.T; }); skipped.push('tus vueltas más lentas (' + (mine.length - 8) + ')'); mine = mine.slice(0, 8); }
  mine.sort(function (a, b) { return a.l - b.l; });
  mine.forEach(function (e) { if (size(e) <= left) { left -= size(e); out.push(strip(e)); } else skipped.push('tu vuelta ' + e.l); });
  var myPos = null; (rec.classification.rows || []).forEach(function (r) { if (r.me) myPos = r.pos; });
  var order = (rec.classification.rows || []).filter(function (r) { return !r.me; }).sort(function (a, b) { return Math.abs(a.pos - (myPos || 1)) - Math.abs(b.pos - (myPos || 1)) || a.pos - b.pos; });
  var seen = {};
  order.forEach(function (r) {
    seen[r.car] = 1;
    var ls = all.filter(function (e) { return e.c === r.car && (!isRace || myLaps[e.l]); }).sort(function (a, b) { return a.l - b.l; });
    if (!isRace && ls.length > 3) ls = ls.sort(function (a, b) { return a.T - b.T; }).slice(0, 3).sort(function (a, b) { return a.l - b.l; });
    if (!ls.length) { return; }
    var need = ls.reduce(function (a, e) { return a + size(e); }, 0);
    if (need > left) { skipped.push((r.name || ('coche ' + r.car)) + ' (' + ls.length + ' vueltas)'); return; }
    left -= need; ls.forEach(function (e) { out.push(strip(e)); });
    cars.push({c: r.car, name: r.name || null, pos: r.pos});
  });
  var meName = (S.names[me] || {}).name || null;
  var restricted = []; Object.keys(S.names).forEach(function (i) { if (+i !== me && S.names[i] && S.names[i].your_telemetry === 0) restricted.push(+i); });
  return {step_m: TSTEP, race: isRace, me: me, me_name: meName, cars: cars, laps: out, skipped: skipped,
    restricted_cars: restricted,
    note: 'Cada vuelta: velocidad (km/h), gas y freno (0-100) cada ' + TSTEP + ' m y tiempo (centésimas, en incrementos). Solo vueltas válidas según el criterio de la app (sin boxes, rebobinado, salida/entrada). En carrera, cada rival incluye las vueltas en las que tú también tienes vuelta válida; en clasificación y libres, sus 3 vueltas más rápidas. Datos de rivales: Car Telemetry y Lap Data que el juego envía de cada coche; si un humano online tiene la telemetría restringida llega a cero.'};
}
function buildRecord(why) {
  var x = S.sx, tk = S.track || [null, 0, null], me = S.player, mn = S.names[me] || null, h = histOut();
  var rec = {schema: 'f1-historial/1', app: 'F1 Dashboard v1.1', saved_at: new Date().toISOString(), reason: why, simulated: !!S.simulated,
    source: 'Paquetes UDP del juego, formato «F1 25 2026 Season Pack»; ids de circuito, equipo, modo y reglas traducidos solo con las tablas del PDF oficial de EA de esta edición («id N» si no figuran).',
    session: {uid: x.uid || null, started_at: x.t_first || null, type: tk[2], type_name: SESSION_NAMES[tk[2]] || null, track_id: tk[0], track_name: tk[0] === null ? null : nm(EA_TRACKS, tk[0]),
      track_length_m: tk[1], total_laps: S.total_laps, game_mode: x.game_mode === undefined ? null : {id: x.game_mode, name: nm(EA_MODES, x.game_mode)},
      ruleset: x.rule_set === undefined ? null : {id: x.rule_set, name: nm(EA_RULES, x.rule_set)}, formula_id: x.formula === undefined ? null : x.formula,
      online: x.online === undefined ? null : !!x.online, spectating: x.spectating === undefined ? null : !!x.spectating, ai_difficulty: x.ai_difficulty === undefined ? null : x.ai_difficulty,
      link_ids: {season: x.season_link === undefined ? null : x.season_link, weekend: x.weekend_link === undefined ? null : x.weekend_link, session: x.session_link === undefined ? null : x.session_link}},
    local_player: me === null ? null : {car_index: me, name: mn ? mn.name : null, ai: mn ? mn.ai : null, platform_id: mn ? mn.platform : null, network_id: mn ? mn.network_id : null,
      driver_id: mn ? mn.driver_id : null, your_telemetry: mn ? mn.your_telemetry : null, show_online_names: mn ? mn.show_names : null, race_number: mn ? mn.number : null,
      team: teamOf(me), note: 'tal como lo envía el juego; si falta, queda null: no se atribuye a ninguna persona'}};
  rec.classification = classif();
  rec.fastest_laps = fastLaps();
  var mine = S.laps.filter(clean), myBest = mine.length ? Math.min.apply(null, mine.map(function (l) { return l.time; })) : null, loss = [];
  Object.keys(S.rlaps).forEach(function (i) {
    var ls = rivalLaps(+i); if (!ls.length || myBest === null) return;
    var rb = Math.min.apply(null, ls.map(function (l) { return l.time; })); if (rb >= myBest) return;
    var d = rcompare({car: i});
    if (d.error) { loss.push({rival: +i, name: pname(+i), error: d.error}); return; }
    loss.push({rival: +i, name: pname(+i), rival_time: d.rival_time, my_time: d.my_time, total_s: d.total, coverage_ok: d.coverage ? d.coverage.ok : null,
      nodata_segments: d.quality ? d.quality.nodata_segs : null, worst: d.worst.slice(0, 3).map(function (s) { return {from_m: s.start, to_m: s.end, loss_s: s.loss}; }),
      sign: 'tú − rival: positivo = pierdes'});
  });
  rec.my_losses = loss.sort(function (a, b) { return (a.rival_time || 1e9) - (b.rival_time || 1e9); }).slice(0, 3);
  rec.race_evolution = has(RACE_TYPES, tk[2]) ? raceEvolution() : null;
  rec.quality = {packets: S.packets, names_received: S.names_n || 0, names_nonempty: S.names_nonempty || 0, participants_packets: (S.pids || {})[4] || 0, warning: S.live.warning || null, spectating: x.spectating === 1, final_received: !!S.final, my_laps_recorded: S.laps.length};
  try { if (why === 'vista-completa') rec.traces = fullTraces(rec); else if (why !== 'vista-ligera') rec.traces = buildTraces(rec); } catch (e) { rec.traces_error = String(e && e.message || e); }
  return rec;
}
function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function archive(why) {
  try {
    if (S.simulated || !S.sx.uid || (!Object.keys(S.hist).length && !S.rlog.length && !S.final)) return null;
    var rec = buildRecord(why), tk = S.track || [null, 0, null];
    var d = (S.sx.t_first || '').slice(0, 16).replace(/[-:T]/g, '').replace(/^(\d{8})/, '$1-');
    var name = d + '_' + slug(rec.session.track_name || 'circuito') + '_' + slug(rec.session.type_name || 'sesion') + '_' + S.sx.uid.slice(-8) + '.json';
    var ses = S.arch_ses !== undefined ? S.arch_ses : S.session, base = S.chunk_base || name.replace(/\.json$/, '');
    function deco() {
      if (!rec.traces || rec.traces.complete) return;
      var ents = sesEntries(ses), me = S.player;
      rec.traces.chunk_base = base; rec.traces.full_laps = ents.length; rec.traces.cars_all = carsAll(rec, ents, me);
      rec.traces.note_full = 'Este archivo lleva un resumen (cabe en la subida de 250 KB). Todas las vueltas están completas solo en el móvil, en los archivos tzNN_' + base + '.json.';
    }
    var nch = 0; try { nch = writeChunks(rec, ses, base); S.chunk_base = base; } catch (e) { S.live.warning = 'chunks: ' + e.message; }
    deco();
    var json = JSON.stringify(rec, null, 1), tb = TBUDGET, tries = 0;
    while (json.length > 240000 && tries < 6) { tries++; tb = Math.round(tb * 0.85); var keep = TBUDGET; TBUDGET = tb; try { rec = buildRecord(why); } finally { TBUDGET = keep; } deco(); json = JSON.stringify(rec, null, 1); }
    G.RXLAST = {name: name, json: json, rec: rec};
    S.last_save = now();
    if (G.Android && G.Android.saveSession) { var r = G.Android.saveSession(name, json); S.live.save = r; }
    return name;
  } catch (e) { S.live.warning = 'archive error: ' + e.message; return null; }
}
function tick() {
  if (!S.last_rx || !S.sx.uid || !S.sess_key) return;
  var t = now();
  if (S.dirty && S.dirty > S.last_save && t - S.last_save > 8) { archive('vuelta cerrada'); return; }
  if (t - S.last_save > 90) archive('guardado periódico');
}

// ---------------- API (sustituye al servidor HTTP del PC) ----------------
function route(url) {
  var u = String(url), qi = u.indexOf('?'), p = qi < 0 ? u : u.slice(0, qi), q = {};
  if (qi >= 0) u.slice(qi + 1).split('&').forEach(function (kv) { var e = kv.split('='); if (e[0] && e[0] !== 't') q[decodeURIComponent(e[0])] = decodeURIComponent(e[1] || ''); });
  p = p.replace(/^.*?(\/state|\/rcompare|\/compare)$/, '$1');
  if (p === '/state') return stateOut();
  if (p === '/rcompare') return rcompare(q);
  if (p === '/compare') return compareLaps(q);
  return null;
}
function b64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
function push(list) {      // lista de paquetes en base64 separados por coma, desde Java
  tick(); if (!list) return 0; var arr = list.split(','), n = 0;
  for (var i = 0; i < arr.length; i++) {
    if (!arr[i]) continue;
    try { handle(b64(arr[i])); n++; } catch (e) { S.live.warning = 'parse error: ' + e.message; }
  }
  return n;
}
G.RXAPP = {handle: handle, push: push, route: route, state: function () { return S; }, reset: function () { S = newState(); }, loadLaps: loadLaps,
  setSimulated: function (v) { S.simulated = v; }, archive: archive, build: buildRecord, tick: tick};
})(typeof window !== 'undefined' ? window : globalThis);
