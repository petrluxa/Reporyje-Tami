/*
 * Tenis Tami — živý míček na 3D cedulce.
 *
 * Přes míček na obrázku cedule-3d*.jpg položí plátno a vykreslí na něm skutečnou kouli (WebGL):
 * plsť, šev tenisového míčku a světlo podle renderu cedule. Míček se pomalu otáčí, při najetí
 * myší na cedulku zrychlí a kliknutí ho roztočí.
 *
 * - Výchozí natočení švu je napasované na šev z renderu, takže se míček rozjede z polohy na fotce.
 * - prefers-reduced-motion: reduce nebo prohlížeč bez WebGL → zůstane fotka beze změny.
 * - Mimo obrazovku a ve skryté záložce se nekreslí.
 *
 * Použití: <script src="assets/js/tami-micek.js" defer></script> (obrázek cedule musí být v rodiči,
 * kterého skript smí nastavit na position:relative, pokud je statický).
 */
(function () {
  'use strict';

  // Poloha míčku v renderu cedule (px ve zdrojovém obrázku 1588 × 656)
  var MICEK = { cx: 814.5, cy: 219.5, r: 118.5, w: 1588, h: 656 };
  // Natočení švu v klidu (pohled ← objekt), napasované na fotku; b = tvar švu
  var R0 = [
    [-0.02729, 0.99327, 0.11253],
    [-0.99247, -0.04037, 0.11567],
    [0.11943, -0.10852, 0.98689]
  ];
  var B = 0.22;
  // Osa otáčení v pohledu (x vpravo, y nahoru, z k divákovi): skoro svislá, lehce nakloněná
  var OSA = normalizuj([0.22, 1, 0.3]);
  var PERIODA = 9;          // s na jednu otáčku v klidu
  var ZRYCHLENI = 3.2;      // násobek rychlosti při najetí myší
  var CVRNK = 7;            // přidaná rychlost (otáčky/s × 2π) po kliknutí, postupně odezní

  if (!window.requestAnimationFrame) return;
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  } catch (e) { /* bez matchMedia pokračovat */ }

  function normalizuj(v) {
    var d = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / d, v[1] / d, v[2] / d];
  }

  // Rotace kolem osy u o úhel a (Rodriguesova formule), řádková matice 3 × 3
  function rotace(u, a) {
    var c = Math.cos(a), s = Math.sin(a), t = 1 - c, x = u[0], y = u[1], z = u[2];
    return [
      [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
      [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
      [t * x * z - s * y, t * y * z + s * x, t * z * z + c]
    ];
  }
  function nasob(A, Bm) {
    var C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
      C[i][j] = A[i][0] * Bm[0][j] + A[i][1] * Bm[1][j] + A[i][2] * Bm[2][j];
    }
    return C;
  }

  var VS = [
    'attribute vec2 aPos;',
    'uniform float uOkraj;',
    'varying vec2 vP;',
    'void main(){ vP = aPos * uOkraj; gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var FS = [
    'precision highp float;',
    'varying vec2 vP;',
    'uniform mat3 uM;',      // pohled -> objekt
    'uniform float uPx;',    // velikost pixelu v poloměrech
    'uniform vec3 uSev;',    // a, b, 2*sqrt(ab)
    'vec3 sev(float t){ return vec3(uSev.x*cos(t)+uSev.y*cos(3.0*t), uSev.x*sin(t)-uSev.y*sin(3.0*t), uSev.z*sin(2.0*t)); }',
    'float hash(vec3 p){ p = fract(p*0.3183099 + vec3(0.71,0.113,0.419)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }',
    'float sum(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);',
    '  return mix(mix(mix(hash(i),hash(i+vec3(1.0,0.0,0.0)),f.x), mix(hash(i+vec3(0.0,1.0,0.0)),hash(i+vec3(1.0,1.0,0.0)),f.x),f.y),',
    '             mix(mix(hash(i+vec3(0.0,0.0,1.0)),hash(i+vec3(1.0,0.0,1.0)),f.x), mix(hash(i+vec3(0.0,1.0,1.0)),hash(i+vec3(1.0,1.0,1.0)),f.x),f.y), f.z); }',
    // barvy plsti naměřené z renderu podle n·l
    'vec3 plst(float nl){',
    '  vec3 c0 = vec3(0.537,0.592,0.165); vec3 c1 = vec3(0.722,0.757,0.251);',
    '  vec3 c2 = vec3(0.835,0.851,0.365); vec3 c3 = vec3(0.902,0.914,0.494);',
    '  if (nl < 0.2) return mix(c0, c1, clamp((nl + 0.3) / 0.5, 0.0, 1.0));',
    '  if (nl < 0.52) return mix(c1, c2, (nl - 0.2) / 0.32);',
    '  return mix(c2, c3, clamp((nl - 0.52) / 0.36, 0.0, 1.0));',
    '}',
    'void main(){',
    '  float r = length(vP);',
    '  float pokryti = 1.0 - smoothstep(1.0 - uPx, 1.0 + 0.6*uPx, r);',
    '  if (pokryti <= 0.0) { gl_FragColor = vec4(0.0); return; }',
    '  vec2 p = vP / max(r, 1.0);',
    '  float z = sqrt(max(0.0, 1.0 - dot(p, p)));',
    '  vec3 n = normalize(vec3(p, z));',
    '  vec3 q = uM * n;',
    // vzdálenost ke švu: hrubé hledání bez goniometrie (cos/sin úhlu se posouvá rotací), pak zpřesnění
    '  float nej = 1e3; float nt = 0.0; float kc = 1.0; float ks = 0.0;',
    '  for (int i = 0; i < 96; i++) {',
    '    float c3 = kc * (4.0 * kc * kc - 3.0); float s3 = ks * (3.0 - 4.0 * ks * ks);',
    '    vec3 d = q - vec3(uSev.x * kc + uSev.y * c3, uSev.x * ks - uSev.y * s3, 2.0 * uSev.z * ks * kc);',
    '    float dd = dot(d, d);',
    '    if (dd < nej) { nej = dd; nt = float(i) * 0.0654498; }',
    '    float kn = kc * 0.99785892 - ks * 0.06540313; ks = ks * 0.99785892 + kc * 0.06540313; kc = kn;',
    '  }',
    '  nej = sqrt(nej);',
    '  float krok = 0.0327;',
    '  for (int k = 0; k < 6; k++) {',
    '    float d1 = distance(q, sev(nt - krok)); float d2 = distance(q, sev(nt + krok));',
    '    if (d1 < nej) { nej = d1; nt -= krok; } else if (d2 < nej) { nej = d2; nt += krok; }',
    '    krok *= 0.5;',
    '  }',
    '  vec3 L = normalize(vec3(0.61, 0.78, 0.137));',
    '  float nl = dot(n, L);',
    // vlákna plsti se otáčejí s míčkem; jemnost podle velikosti na displeji (bez třpytu při otáčení)
    '  float jem = clamp(0.62 / uPx, 24.0, 130.0);',
    '  float v1 = sum(q * jem * 0.42); float v2 = sum(q * jem); float v3 = sum(q * 6.0);',
    '  float chlup = v1 * 0.5 + v2 * 0.5;',
    '  float jamky = smoothstep(0.6, 0.95, sum(q * jem * 1.6 + 3.1));',
    '  vec3 barva = plst(nl + (chlup - 0.5) * 0.3 + (v3 - 0.5) * 0.1) * (0.86 + 0.24 * chlup) * (1.0 - 0.2 * jamky);',
    // šev: bílý pruh, kolem něj jemná rýha
    '  float pul = 0.041; float aa = uPx * 1.3;',
    '  float s = 1.0 - smoothstep(pul - aa, pul + aa, nej);',
    '  float ryha = (1.0 - smoothstep(pul, pul + 0.032, nej)) * (1.0 - s);',
    '  vec3 sevBarva = vec3(0.905, 0.905, 0.835) * (0.70 + 0.36 * clamp(nl * 0.8 + 0.45, 0.0, 1.0));',
    '  barva = mix(barva * (1.0 - 0.3 * ryha), sevBarva, s);',
    // zastínění u okraje (míček sedí v objímce)
    '  barva *= 1.0 - 0.2 * smoothstep(0.78, 1.0, r);',
    '  gl_FragColor = vec4(barva * pokryti, pokryti);',
    '}'
  ].join('\n');

  function shader(gl, typ, zdroj) {
    var s = gl.createShader(typ);
    gl.shaderSource(s, zdroj);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  }

  function oziv(img) {
    var rodic = img.parentElement;
    if (!rodic || img.getAttribute('data-micek-ok')) return;
    img.setAttribute('data-micek-ok', '1');
    // Poloha míčku v obrázku: data-micek="cx cy r" (px ve zdroji), jinak plný render cedule
    var G = MICEK;
    var dm = (img.getAttribute('data-micek') || '').split(/[\s,]+/).map(parseFloat);
    if (dm.length === 3 && isFinite(dm[0]) && isFinite(dm[1]) && isFinite(dm[2])) {
      G = { cx: dm[0], cy: dm[1], r: dm[2],
        w: parseFloat(img.getAttribute('width')) || MICEK.w, h: parseFloat(img.getAttribute('height')) || MICEK.h };
    }
    if (getComputedStyle(rodic).position === 'static') rodic.style.position = 'relative';

    var platno = document.createElement('canvas');
    platno.setAttribute('aria-hidden', 'true');
    platno.style.cssText = 'position:absolute;pointer-events:none;opacity:0;transition:opacity .9s ease;z-index:1';
    var gl;
    try {
      gl = platno.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }) ||
        platno.getContext('experimental-webgl');
    } catch (e) { gl = null; }
    if (!gl) return;

    var program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, shader(gl, gl.VERTEX_SHADER, VS));
      gl.attachShader(program, shader(gl, gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link');
    } catch (e) {
      if (window.console && console.warn) console.warn('tami-micek: WebGL nejde, zůstává fotka (' + e.message + ')');
      return;
    }
    gl.useProgram(program);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    var uM = gl.getUniformLocation(program, 'uM');
    var uPx = gl.getUniformLocation(program, 'uPx');
    var uOkraj = gl.getUniformLocation(program, 'uOkraj');
    var a = 1 - B;
    gl.uniform3f(gl.getUniformLocation(program, 'uSev'), a, B, 2 * Math.sqrt(a * B));
    gl.clearColor(0, 0, 0, 0);

    rodic.appendChild(platno);

    var okraj = 1;          // poměr poloviny plátna k poloměru míčku
    function umisti() {
      var nw = img.naturalWidth || G.w, nh = img.naturalHeight || G.h;
      var bw = img.clientWidth, bh = img.clientHeight;
      if (!bw || !bh) return false;
      var cs = getComputedStyle(img);
      var fit = cs.objectFit || 'fill';
      var sx = bw / nw, sy = bh / nh, s;
      if (fit === 'cover') s = Math.max(sx, sy);
      else if (fit === 'contain' || fit === 'scale-down') s = Math.min(sx, sy);
      else s = Math.min(sx, sy); // fill: obrázky mají správný poměr stran
      var pos = (cs.objectPosition || '50% 50%').split(' ');
      function podil(v, volno) {
        if (!v) return volno * 0.5;
        if (v.indexOf('%') > 0) return volno * parseFloat(v) / 100;
        if (v === 'left' || v === 'top') return 0;
        if (v === 'right' || v === 'bottom') return volno;
        if (v === 'center') return volno * 0.5;
        return parseFloat(v) || 0;
      }
      var ox = podil(pos[0], bw - nw * s), oy = podil(pos[1] || pos[0], bh - nh * s);
      if (fit === 'fill') { ox = 0; oy = 0; }
      var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      var r = G.r * s * 1.012;                     // nepatrně větší, ať zakryje vyhlazený okraj fotky
      var rDev = r * dpr;
      var pul = Math.ceil(rDev + 3);                   // půlka plátna v px zařízení (rezerva na vyhlazení)
      okraj = pul / rDev;
      var strana = pul * 2;
      if (platno.width !== strana) { platno.width = strana; platno.height = strana; }
      var css = strana / dpr;
      var cx = img.offsetLeft + ox + G.cx * s, cy = img.offsetTop + oy + G.cy * s;
      platno.style.width = css + 'px';
      platno.style.height = css + 'px';
      platno.style.left = (cx - css / 2) + 'px';
      platno.style.top = (cy - css / 2) + 'px';
      gl.viewport(0, 0, strana, strana);
      gl.uniform1f(uPx, 1 / rDev);
      gl.uniform1f(uOkraj, okraj);
      return true;
    }

    var uhel = 0, rychlost = 2 * Math.PI / PERIODA, cil = rychlost, navic = 0;
    var bezi = false, viditelne = true, posledni = 0, kresleno = 0, prvni = true;

    function kresli() {
      var M = nasob(rotace(OSA, uhel), R0);           // objekt -> pohled
      // uniformMatrix3fv bere sloupce; potřebujeme pohled -> objekt = M^T, jehož sloupce jsou řádky M
      gl.uniformMatrix3fv(uM, false, new Float32Array([
        M[0][0], M[0][1], M[0][2],
        M[1][0], M[1][1], M[1][2],
        M[2][0], M[2][1], M[2][2]
      ]));
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (prvni) { prvni = false; platno.style.opacity = '1'; }
    }

    function snimek(t) {
      if (!bezi) return;
      var dt = posledni ? Math.min((t - posledni) / 1000, 0.05) : 0;
      posledni = t;
      rychlost += (cil - rychlost) * Math.min(1, dt * 2.2);
      navic *= Math.exp(-dt * 1.1);
      uhel += (rychlost + navic) * dt;
      // nejvýš ~60 snímků za sekundu i na 120Hz displejích
      if (t - kresleno >= 15.5) { kresleno = t; kresli(); }
      requestAnimationFrame(snimek);
    }
    function start() {
      if (bezi || !viditelne || document.hidden) return;
      bezi = true; posledni = 0;
      requestAnimationFrame(snimek);
    }
    function stop() { bezi = false; }

    function priprav() {
      if (!umisti()) return;
      kresli();
      start();
    }
    if (img.complete && img.naturalWidth) priprav();
    else img.addEventListener('load', priprav);

    if (window.ResizeObserver) new ResizeObserver(function () { if (umisti() && !bezi) kresli(); }).observe(img);
    else window.addEventListener('resize', function () { if (umisti() && !bezi) kresli(); });

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (z) {
        viditelne = z[0].isIntersecting;
        if (viditelne) start(); else stop();
      }).observe(rodic);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

    var zakl = 2 * Math.PI / PERIODA;
    rodic.addEventListener('pointerenter', function () { cil = zakl * ZRYCHLENI; });
    rodic.addEventListener('pointerleave', function () { cil = zakl; });
    rodic.addEventListener('click', function () { navic += CVRNK; });

    platno.addEventListener('webglcontextlost', function (e) { e.preventDefault(); stop(); platno.style.opacity = '0'; });
  }

  function init() {
    var obrazky = document.querySelectorAll('img[src*="cedule-3d"]');
    for (var i = 0; i < obrazky.length; i++) (function (img) {
      if (img.getClientRects().length) { oziv(img); return; }
      // skrytá cedule (např. na telefonu): WebGL zapnout, až když se cedule opravdu ukáže
      if (window.ResizeObserver) {
        var ro = new ResizeObserver(function () {
          if (img.getClientRects().length) { ro.disconnect(); oziv(img); }
        });
        ro.observe(img);
      }
    })(obrazky[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
