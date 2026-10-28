/*
 * Tenis Tami Řeporyje — ukázková data obsazenosti dvorců pro návrhy webu.
 *
 * Obsazenost je VYMYŠLENÁ: pseudonáhodná, ale pro daný den a hodinu pořád stejná
 * (po obnovení stránky se nemění). Ceny a provozní doba odpovídají ceníku
 * na současném webu klubu (stav 22. 10. 2026).
 *
 * Až bude hotové napojení na rezervační systém, nahradí se jen funkce
 * TAMI.nactiObsazenost() — tvar vráceného objektu zůstane stejný:
 *
 *   {
 *     ukazka: true,                       // false u skutečných dat
 *     ted: Date, tedText: '22. 10. 2026 17:40',
 *     sezona: { kod: 'zima'|'leto', nazev, misto },
 *     dvorce: [{ cislo: 1, nazev: 'Dvorec 1' }, …],
 *     rozsah: { od: 9, do: 21 },          // nejširší provozní doba v týdnu (celé hodiny)
 *     dny: [{                             // 7 dní od dneška
 *       datum: '2026-10-22', den: 'čtvrtek', denKratce: 'Čt',
 *       datumKratce: '22. 10.', datumDlouhe: '22. října',
 *       popisek: 'Dnes' | 'Zítra' | 'So 24. 10.',
 *       otevreno: 9, zavreno: 21,         // provoz [od, do) v celých hodinách
 *       volnychHodin: 7,                  // hodin, kdy je volný aspoň jeden dvorec (bez proběhlých)
 *       sloty: [{                         // jen hodiny v provozu
 *         hodina: 17, od: '17:00', do: '18:00',
 *         cena: 620, clen: 540,           // Kč za hodinu (clen = cena pro člena klubu, v létě null)
 *         pasmo: '16–21',
 *         dvorce: [{ cislo: 1, volno: false }, { cislo: 2, volno: true }, { cislo: 3, volno: true }],
 *         volnych: 2,                     // počet volných dvorců
 *         probehlo: false,                // hodina už skončila
 *         ted: true                       // právě probíhající hodina
 *       }, …]
 *     }, …],
 *     nejblizsi: { den: <odkaz na den>, slot: <odkaz na slot> } | null   // první volná hodina od teď
 *   }
 *
 * Testovací přepsání času (pro snímky):  stranka.html?ted=2026-10-22T17:40
 *
 * Použití ve stránce:
 *   <script src="assets/js/obsazenost-ukazka.js"></script>
 *   TAMI.nactiObsazenost().then(function (data) { … vykreslit … });
 *   // případně synchronně: TAMI.obsazenost (spočítá se při načtení skriptu)
 */
(function () {
  'use strict';

  var DNY = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
  var DNY_KRATCE = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
  var MESICE = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července',
    'srpna', 'září', 'října', 'listopadu', 'prosince'];

  // Provozní doba [od, do) v celých hodinách; klíč = getDay() (0 = neděle)
  var PROVOZ = {
    zima: { 0: [10, 20], 1: [13, 21], 2: [9, 21], 3: [9, 21], 4: [9, 21], 5: [9, 21], 6: [10, 18] },
    leto: { 0: [8, 22], 1: [8, 22], 2: [8, 22], 3: [8, 22], 4: [8, 22], 5: [8, 22], 6: [8, 22] }
  };

  var SEZONY = {
    zima: { kod: 'zima', nazev: 'Zimní sezóna 2026/27', misto: 'hala nad antukou' },
    leto: { kod: 'leto', nazev: 'Letní sezóna', misto: 'antuka pod širým nebem' }
  };

  var DVORCE = [
    { cislo: 1, nazev: 'Dvorec 1' },
    { cislo: 2, nazev: 'Dvorec 2' },
    { cislo: 3, nazev: 'Dvorec 3' }
  ];

  // Ceník (Kč za hodinu) podle současného webu klubu.
  // Zima (hala): Po–Pá 9–13 520/460, 13–16 560/500, 16–21 620/540; So, Ne 10–20 550/480 (jednotlivá hod./člen).
  // Léto: Po–Pá 8–13 240, 13–21 290; So–Ne 8–21 240. Hodina 21–22 (provoz do 22) bere poslední pásmo.
  function cenik(sezona, denTydne, hodina) {
    var vikend = denTydne === 0 || denTydne === 6;
    if (sezona === 'zima') {
      if (vikend) return { pasmo: '10–20', cena: 550, clen: 480 };
      if (hodina < 13) return { pasmo: '9–13', cena: 520, clen: 460 };
      if (hodina < 16) return { pasmo: '13–16', cena: 560, clen: 500 };
      return { pasmo: '16–21', cena: 620, clen: 540 };
    }
    if (vikend) return { pasmo: '8–21', cena: 240, clen: null };
    if (hodina < 13) return { pasmo: '8–13', cena: 240, clen: null };
    return { pasmo: '13–21', cena: 290, clen: null };
  }

  // Hala stojí od 19. 10. (sezóna 2026/27 začala v pondělí 19. 10. 2026) do poloviny dubna.
  function urciSezonu(d) {
    var m = d.getMonth() + 1, den = d.getDate();
    if (m > 10 || (m === 10 && den >= 19) || m < 4 || (m === 4 && den <= 15)) return 'zima';
    return 'leto';
  }

  // Pravděpodobnost, že je dvorec v danou hodinu obsazený (ukázka, ne statistika klubu)
  function vytizeni(sezona, denTydne, hodina) {
    var vikend = denTydne === 0 || denTydne === 6;
    if (sezona === 'zima') {
      if (vikend) return hodina < 13 ? 0.62 : hodina < 16 ? 0.5 : 0.38;
      if (hodina < 12) return 0.34;
      if (hodina < 16) return 0.52;
      return 0.86;
    }
    if (vikend) return hodina < 11 ? 0.5 : hodina < 16 ? 0.42 : 0.36;
    if (hodina < 13) return 0.3;
    if (hodina < 17) return 0.46;
    return 0.8;
  }

  // Deterministický pseudonáhodný generátor (stejný vstup = stejné číslo 0..1)
  function nahoda(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }

  function dvojciferne(n) { return (n < 10 ? '0' : '') + n; }
  function isoDatum(d) { return d.getFullYear() + '-' + dvojciferne(d.getMonth() + 1) + '-' + dvojciferne(d.getDate()); }

  function zjistiTed() {
    try {
      var m = /[?&]ted=([^&#]+)/.exec(window.location.search);
      if (m) {
        var t = new Date(decodeURIComponent(m[1]));
        if (!isNaN(t.getTime())) return t;
      }
    } catch (e) { /* bez přepsání */ }
    return new Date();
  }

  function vytvorData(ted) {
    var dnes = new Date(ted.getFullYear(), ted.getMonth(), ted.getDate());
    var sezona = urciSezonu(dnes);
    var rozsahOd = 24, rozsahDo = 0;
    var dny = [];
    var nejblizsi = null;

    for (var i = 0; i < 7; i++) {
      var d = new Date(dnes.getFullYear(), dnes.getMonth(), dnes.getDate() + i);
      var dt = d.getDay();
      var provoz = PROVOZ[sezona][dt];
      rozsahOd = Math.min(rozsahOd, provoz[0]);
      rozsahDo = Math.max(rozsahDo, provoz[1]);
      var datum = isoDatum(d);
      var sloty = [];
      var predchozi = {};
      var volnychHodin = 0;

      for (var h = provoz[0]; h < provoz[1]; h++) {
        var p = vytizeni(sezona, dt, h);
        var dvorce = [];
        var volnych = 0;
        for (var k = 0; k < DVORCE.length; k++) {
          var c = DVORCE[k].cislo;
          var r = nahoda(datum + '|' + h + '|' + c);
          var obsazeno = r < p;
          // rezervace často trvají dvě hodiny: navázat na předchozí hodinu
          if (!obsazeno && predchozi[c] && nahoda(datum + '|' + h + '|' + c + '|navaz') < 0.45) obsazeno = true;
          // Dvorec 1 bývá na dlouhodobé rezervace o něco plnější
          if (!obsazeno && c === 1 && nahoda(datum + '|' + h + '|perm') < 0.18) obsazeno = true;
          predchozi[c] = obsazeno;
          dvorce.push({ cislo: c, volno: !obsazeno });
          if (!obsazeno) volnych++;
        }
        var konec = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h + 1);
        var zacatek = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h);
        var probehlo = konec <= ted;
        var cena = cenik(sezona, dt, h);
        var slot = {
          hodina: h,
          od: h + ':00',
          do: (h + 1) + ':00',
          cena: cena.cena,
          clen: cena.clen,
          pasmo: cena.pasmo,
          dvorce: dvorce,
          volnych: volnych,
          probehlo: probehlo,
          ted: zacatek <= ted && ted < konec
        };
        if (!probehlo && volnych > 0) {
          volnychHodin++;
          if (!nejblizsi) nejblizsi = { slot: slot, denIndex: i };
        }
        sloty.push(slot);
      }

      dny.push({
        datum: datum,
        den: DNY[dt],
        denKratce: DNY_KRATCE[dt],
        datumKratce: d.getDate() + '. ' + (d.getMonth() + 1) + '.',
        datumDlouhe: d.getDate() + '. ' + MESICE[d.getMonth()],
        popisek: i === 0 ? 'Dnes' : i === 1 ? 'Zítra' : DNY_KRATCE[dt] + ' ' + d.getDate() + '. ' + (d.getMonth() + 1) + '.',
        otevreno: provoz[0],
        zavreno: provoz[1],
        volnychHodin: volnychHodin,
        sloty: sloty
      });
    }

    return {
      ukazka: true,
      ted: ted,
      tedText: ted.getDate() + '. ' + (ted.getMonth() + 1) + '. ' + ted.getFullYear() + ' ' +
        ted.getHours() + ':' + dvojciferne(ted.getMinutes()),
      sezona: SEZONY[sezona],
      dvorce: DVORCE.slice(),
      rozsah: { od: rozsahOd, do: rozsahDo },
      dny: dny,
      nejblizsi: nejblizsi ? { den: dny[nejblizsi.denIndex], slot: nejblizsi.slot } : null
    };
  }

  var TAMI = window.TAMI = window.TAMI || {};
  TAMI.obsazenost = vytvorData(zjistiTed());
  TAMI.nactiObsazenost = function () {
    // Později: return fetch(API_URL).then(r => r.json()).then(prevedNaTvarVyse);
    return Promise.resolve(TAMI.obsazenost);
  };
  TAMI.cenik = cenik;
})();
