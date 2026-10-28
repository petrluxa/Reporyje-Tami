/*
 * Tenis Tami – míček v plochém logu se otočí jako koule.
 *
 * Najde <img src="…/tami-logo.svg"> a <img src="…/tami-logo-negativ.svg"> a po načtení obrázku
 * je nahradí vloženým SVG se stejnou kresbou, stejnými barvami a stejným rozměrem (převezme
 * skutečně použitý rozměr obrázku i při změně šířky okna, takže se nic neposune).
 *
 * Bílé švy míčku se během otáčky počítají jako pravoúhlý průmět křivky tenisového švu na kouli
 *   s(t) = (a·cos t + b·cos 3t,  a·sin t − b·sin 3t,  2·√(ab)·sin 2t),  a + b = 1,
 * otočené kolem mírně skloněné svislé osy. Šev je pás stálé šířky na povrchu koule; kreslí se
 * jen jeho přivrácená část (z > 0). U obrysu se tak pás sám zúží, jak se odvrací (žádný bílý
 * lem podél okraje míčku). Natočení a šířka pásu jsou napasované na původní kresbu švů;
 * v klidu je vidět přímo původní kresba.
 *
 * Chování: asi 0,6 s po načtení jedna plynulá otáčka (2,4 s), pak klid. Další otáčka při najetí
 * myší nebo fokusu na logo či jeho odkaz; rozjetá otáčka se nepřerušuje. Když logo není vidět,
 * animace stojí; logo v patičce se otočí, až se poprvé ukáže. Při prefers-reduced-motion: reduce
 * modul nic nemění (zůstane původní <img>).
 *
 * Bez závislostí. Kresba loga je níže jako řetězce (fetch na file:// v Chromiu nejde).
 * Při změně souborů assets/logo/tami-logo.svg nebo tami-logo-negativ.svg je zkopírovat sem.
 *
 * Pro ruční zkoušky: TamiLogoMicek.otocit([prvek]), TamiLogoMicek.snimek(prvek, podilOtacky).
 */
(function () {
  'use strict';

  if (window.TamiLogoMicek) return;

  var LOGA = {
    'tami-logo.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 116" width="350" height="116" role="img" aria-label="Tenis Tami \u2014 Tenis \u2022 Hala \u2022 \u0158eporyje"><title>Tenis Tami \u2014 Tenis \u2022 Hala \u2022 \u0158eporyje</title><path fill="#A39E98" d="M.25 113.82c5.85-64.59 80.41-113.73 177.15-113.73c97.89 0 166.88 49.78 172.41 113.73v.04c.06 .69 .11 1.38 .16 2.07h-349.88c.05-.7 .1-1.4 .16-2.09zm347.92 0c-5.08-46.89-59.79-84.95-141.39-92.32c-1.52-4.31-4-8.28-7.3-11.58c-5.8-5.8-13.67-9.06-21.88-9.06c-8.21 0-16.08 3.26-21.88 9.06c-3.29 3.29-5.77 7.25-7.29 11.55c-82.66 7.3-141.47 45.47-146.52 92.35z"/><circle cx="177.6" cy="31.81" r="28.99" fill="#FFCC00"/><path fill="#FFFFFF" d="M181.48 3.08q-4.1 8.5-10.84 15.24q-7.92 7.91-18.25 12.19q-1.88 .78-3.78 1.42c0-.04 0-.08 0-.12c0-.75 .03-1.5 .09-2.24q1.43-.5 2.85-1.09q9.93-4.11 17.53-11.71q6.18-6.19 10.06-13.91c.78 .04 1.57 .12 2.34 .22zm25.05 30.57c-.05 .82-.14 1.64-.26 2.46q-.42 .16-.84 .34q-10.07 4.17-17.77 11.87q-5.61 5.61-9.35 12.47c-.23 .01-.47 .01-.71 .01c-.59 0-1.17-.02-1.75-.05q4.01-7.74 10.25-13.99q8.01-8.01 18.48-12.34q.97-.41 1.95-.77z"/><path fill="#E80000" d="M223.29 82.31l10.69-29.69h8.42l11.08 29.56v-29.56h8.19l6.63 15.95l6.58-15.95h8.16v29.69h-8.46v-19.3l-7.96 19.3h-.86l-8.02-19.3v19.3h-13.14l-3.3-8.8h-10.62l-3.17 8.8zm-173.87-29.69h44.06v4.05h-10.41v8.71h9.83v3.88h-9.83v8.99h10.63v4.06h-19.09v-25.64h-8.51v25.64h-8.45v-25.64h-8.23zm46.22 29.69v-29.69h9.12l10.24 15.68v-15.68h4.26v29.69h-4.74l-14.62-22.38v22.38zm49.79-6.79q.04-.79-.11-1.42q-.16-.7-.73-1.24q-.5-.54-1.48-1q-.84-.47-2.22-.93q-1.49-.5-2.89-1.2q-1.4-.62-2.57-1.66q-1.24-1.04-2.04-2.7q-.82-1.66-.84-4.01q.01-2.19 .86-3.98q.87-1.73 2.42-3q1.56-1.2 3.68-1.88q2.01-.6 4.23-.62q2.53 .1 4.37 1.15q1.84 1.02 3.07 2.69q1.31 1.68 1.5 3.58l-5.07-.07q.02-.82-.28-1.72q-.37-.9-1.15-1.41q-.83-.5-2.11-.45q-1.18 .08-2.04 .59q-.89 .55-1.36 1.37q-.49 .85-.55 1.81q-.08 .87 .35 1.51q.37 .62 1.06 1.1q.59 .48 1.39 .89q.73 .43 1.64 .84q2.05 .69 3.65 1.59q1.68 .85 2.84 2.04q1.16 1.2 1.74 2.81q.55 1.61 .46 3.66q-.15 2.14-.99 3.78q-.83 1.62-2.26 2.78q-1.4 1.14-3.31 1.77q-1.87 .59-4.17 .68q-1.93 .08-3.7-.3q-1.6-.36-2.92-1.21q-1.33-.84-2.26-2.21q-.97-1.47-1.13-3.32l4.71-.59q-.02 .96 .2 1.85q.28 .9 .86 1.4q.63 .5 1.54 .65q.84 .13 2.06 0q1.3-.16 2.06-.66q.83-.54 1.15-1.32q.32-.77 .34-1.64zm58.48-22.9h24.94v4.05h-8.19v25.64h-8.46v-25.64h-8.29zm-81.69 0h8.46v29.69h-8.46zm163.85 0h8.46v29.69h-8.46zm-50.19 6.44l-3.86 10.73h7.89z"/><path fill="#24272B" d="M270.63 98.98q0 2.43-1.06 4.19q-1.06 1.76-3.01 2.71q-1.94 .95-4.61 .95q-2.67 0-4.61-.95q-1.94-.94-2.99-2.7q-1.05-1.76-1.05-4.2q0-2.43 1.04-4.16q1.03-1.72 2.97-2.65q1.94-.92 4.67-.92q2.68 0 4.62 .91q1.94 .92 2.99 2.65q1.04 1.72 1.04 4.17zm5.03 1.35v6.29h-2.37v-15.15h8.22q2.95 0 4.55 1.15q1.61 1.14 1.61 3.19q0 1.68-1.14 2.83q-1.13 1.15-3.12 1.45l4.95 6.53h-2.72l-4.54-6.29zm-67.02 0v6.29h-2.37v-15.15h8.22q2.95 0 4.56 1.15q1.6 1.14 1.6 3.19q0 1.68-1.14 2.83q-1.13 1.15-3.12 1.45l4.96 6.53h-2.73l-4.54-6.29zm43.23-4.3q0 1.43-.73 2.48q-.73 1.06-2.08 1.63q-1.34 .58-3.2 .58h-5.14v5.9h-2.36v-15.15h7.35q2.94 0 4.55 1.19q1.61 1.2 1.61 3.37zm16.34 2.95q0-2.83-1.63-4.44q-1.63-1.61-4.6-1.61q-3 0-4.63 1.59q-1.64 1.59-1.64 4.46q0 1.89 .74 3.28q.74 1.39 2.15 2.15q1.4 .76 3.35 .76q3.03 0 4.65-1.62q1.61-1.62 1.61-4.57zm-97.68 3.21l-2 4.43h-2.46l7.13-15.15h2.69l7.01 15.15h-2.41l-2-4.43zm-30.5 0l-2.01 4.43h-2.45l7.12-15.15h2.69l7.02 15.15h-2.42l-1.99-4.43zm-81.73-5.63v10.06h-2.1v-15.15h2.75l9.44 12.99q-.15-2.12-.15-3.05v-9.94h2.14v15.15h-2.85l-9.35-12.9q.02 .71 .07 1.42q.05 .71 .05 1.42zm-4.44 8.38v1.68h-13.76v-15.15h13.25v1.68h-10.88v4.86h10.14v1.65h-10.14v5.28zm182.73 0v1.68h-13.76v-15.15h13.25v1.68h-10.88v4.86h10.13v1.65h-10.13v5.28zm91.12 0v1.68h-13.76v-15.15h13.25v1.68h-10.88v4.86h10.14v1.65h-10.14v5.28zm-206.01-5.34v7.02h-2.37v-15.15h2.37v6.41h9.44v-6.41h2.37v15.15h-2.37v-7.02zm-28.47 2.84q0 2.09-1.89 3.24q-1.89 1.15-5.33 1.15q-6.38 0-7.4-3.84l2.3-.4q.39 1.36 1.68 2q1.29 .64 3.51 .64q2.29 0 3.53-.68q1.25-.68 1.25-2q0-.75-.39-1.21q-.39-.46-1.1-.76q-.7-.3-1.68-.5q-.98-.21-2.17-.45q-1.37-.27-2.29-.53q-.93-.25-1.53-.54q-.59-.28-1.01-.6q-.62-.5-.95-1.15q-.33-.66-.33-1.51q0-1.94 1.72-2.99q1.71-1.06 4.91-1.06q2.98 0 4.55 .79q1.57 .79 2.21 2.69l-2.33 .36q-.39-1.21-1.46-1.75q-1.08-.54-2.99-.54q-2.1 0-3.2 .6q-1.1 .6-1.1 1.79q0 .7 .42 1.16q.43 .46 1.24 .77q.75 .31 3.21 .78q1 .21 1.98 .43q.98 .22 1.85 .55q.51 .18 .97 .45q.47 .26 .81 .6q.47 .46 .74 1.07q.27 .61 .27 1.44zm203.98-2.1v6.28h-2.35v-6.28l-6.72-8.87h2.6l5.32 7.22l5.29-7.22h2.61zm-264.73-7.19v13.47h-2.36v-13.47h-6v-1.68h14.36v1.68zm275.19 13.68q-2.21 0-3.53-.99q-1.31-.99-1.73-2.98l2.31-.34q.23 1.25 1.01 1.95q.78 .7 1.96 .7q1.29 0 2.03-.77q.74-.77 .74-2.25v-9h-3.36v-1.68h5.72v10.63q0 2.21-1.38 3.47q-1.37 1.26-3.77 1.26zm-142.26-1.89v1.68h-11.19v-15.15h2.36v13.47zm52.86-9.11q0-1.32-1.03-2.02q-1.04-.69-2.98-.69h-5.62v5.59h5.72q1.87 0 2.89-.76q1.02-.76 1.02-2.12zm67.02 0q0-1.32-1.04-2.02q-1.03-.69-2.98-.69h-5.61v5.59h5.71q1.87 0 2.89-.76q1.03-.76 1.03-2.12zm-35.8 .22q0-2.93-4.07-2.93h-4.7v5.98h4.8q1.99 0 2.98-.76q.99-.76 .99-2.29zm-172.68-4.58v15.15h-2.37v-15.15zm67.2 1.55q-.21 .6-.51 1.34q-.29 .74-.53 1.3l-2.22 4.93h6.53l-2.24-5q-.18-.37-.47-1.06q-.28-.69-.56-1.51zm30.5 0q-.21 .6-.5 1.34q-.29 .74-.54 1.3l-2.22 4.93h6.54l-2.25-5q-.17-.37-.45-1.06q-.29-.69-.58-1.51zm42.33-5.41l-2.78 2.56h-2.53l-2.9-2.56v-.23h1.29l2.87 1.49h.03l2.71-1.49h1.31z"/><path fill="#A39E98" d="M110.06 100.09c0 1.1-.44 2.15-1.21 2.92c-.78 .78-1.83 1.21-2.92 1.21c-1.1 0-2.15-.43-2.93-1.21c-.77-.77-1.21-1.82-1.21-2.92c0-1.09 .44-2.14 1.21-2.92c.78-.77 1.83-1.21 2.93-1.21c1.09 0 2.14 .44 2.92 1.21c.77 .78 1.21 1.83 1.21 2.92zm88.14 .08c0 1.09-.43 2.14-1.21 2.92c-.77 .77-1.82 1.2-2.92 1.2c-1.09 0-2.14-.43-2.92-1.2c-.77-.78-1.21-1.83-1.21-2.92c0-1.1 .44-2.15 1.21-2.93c.78-.77 1.83-1.2 2.92-1.2c1.1 0 2.15 .43 2.92 1.2c.78 .78 1.21 1.83 1.21 2.93z"/></svg>',
    'tami-logo-negativ.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 116" width="350" height="116" role="img" aria-label="Tenis Tami \u2014 Tenis \u2022 Hala \u2022 \u0158eporyje"><title>Tenis Tami \u2014 Tenis \u2022 Hala \u2022 \u0158eporyje</title><path fill="#7C8187" d="M.25 113.82c5.85-64.59 80.41-113.73 177.15-113.73c97.89 0 166.88 49.78 172.41 113.73v.04c.06 .69 .11 1.38 .16 2.07h-349.88c.05-.7 .1-1.4 .16-2.09zm347.92 0c-5.08-46.89-59.79-84.95-141.39-92.32c-1.52-4.31-4-8.28-7.3-11.58c-5.8-5.8-13.67-9.06-21.88-9.06c-8.21 0-16.08 3.26-21.88 9.06c-3.29 3.29-5.77 7.25-7.29 11.55c-82.66 7.3-141.47 45.47-146.52 92.35z"/><circle cx="177.6" cy="31.81" r="28.99" fill="#FFCC00"/><path fill="#FFFFFF" d="M181.48 3.08q-4.1 8.5-10.84 15.24q-7.92 7.91-18.25 12.19q-1.88 .78-3.78 1.42c0-.04 0-.08 0-.12c0-.75 .03-1.5 .09-2.24q1.43-.5 2.85-1.09q9.93-4.11 17.53-11.71q6.18-6.19 10.06-13.91c.78 .04 1.57 .12 2.34 .22zm25.05 30.57c-.05 .82-.14 1.64-.26 2.46q-.42 .16-.84 .34q-10.07 4.17-17.77 11.87q-5.61 5.61-9.35 12.47c-.23 .01-.47 .01-.71 .01c-.59 0-1.17-.02-1.75-.05q4.01-7.74 10.25-13.99q8.01-8.01 18.48-12.34q.97-.41 1.95-.77z"/><path fill="#E80000" d="M223.29 82.31l10.69-29.69h8.42l11.08 29.56v-29.56h8.19l6.63 15.95l6.58-15.95h8.16v29.69h-8.46v-19.3l-7.96 19.3h-.86l-8.02-19.3v19.3h-13.14l-3.3-8.8h-10.62l-3.17 8.8zm-173.87-29.69h44.06v4.05h-10.41v8.71h9.83v3.88h-9.83v8.99h10.63v4.06h-19.09v-25.64h-8.51v25.64h-8.45v-25.64h-8.23zm46.22 29.69v-29.69h9.12l10.24 15.68v-15.68h4.26v29.69h-4.74l-14.62-22.38v22.38zm49.79-6.79q.04-.79-.11-1.42q-.16-.7-.73-1.24q-.5-.54-1.48-1q-.84-.47-2.22-.93q-1.49-.5-2.89-1.2q-1.4-.62-2.57-1.66q-1.24-1.04-2.04-2.7q-.82-1.66-.84-4.01q.01-2.19 .86-3.98q.87-1.73 2.42-3q1.56-1.2 3.68-1.88q2.01-.6 4.23-.62q2.53 .1 4.37 1.15q1.84 1.02 3.07 2.69q1.31 1.68 1.5 3.58l-5.07-.07q.02-.82-.28-1.72q-.37-.9-1.15-1.41q-.83-.5-2.11-.45q-1.18 .08-2.04 .59q-.89 .55-1.36 1.37q-.49 .85-.55 1.81q-.08 .87 .35 1.51q.37 .62 1.06 1.1q.59 .48 1.39 .89q.73 .43 1.64 .84q2.05 .69 3.65 1.59q1.68 .85 2.84 2.04q1.16 1.2 1.74 2.81q.55 1.61 .46 3.66q-.15 2.14-.99 3.78q-.83 1.62-2.26 2.78q-1.4 1.14-3.31 1.77q-1.87 .59-4.17 .68q-1.93 .08-3.7-.3q-1.6-.36-2.92-1.21q-1.33-.84-2.26-2.21q-.97-1.47-1.13-3.32l4.71-.59q-.02 .96 .2 1.85q.28 .9 .86 1.4q.63 .5 1.54 .65q.84 .13 2.06 0q1.3-.16 2.06-.66q.83-.54 1.15-1.32q.32-.77 .34-1.64zm58.48-22.9h24.94v4.05h-8.19v25.64h-8.46v-25.64h-8.29zm-81.69 0h8.46v29.69h-8.46zm163.85 0h8.46v29.69h-8.46zm-50.19 6.44l-3.86 10.73h7.89z"/><path fill="#F3F0EA" d="M270.63 98.98q0 2.43-1.06 4.19q-1.06 1.76-3.01 2.71q-1.94 .95-4.61 .95q-2.67 0-4.61-.95q-1.94-.94-2.99-2.7q-1.05-1.76-1.05-4.2q0-2.43 1.04-4.16q1.03-1.72 2.97-2.65q1.94-.92 4.67-.92q2.68 0 4.62 .91q1.94 .92 2.99 2.65q1.04 1.72 1.04 4.17zm5.03 1.35v6.29h-2.37v-15.15h8.22q2.95 0 4.55 1.15q1.61 1.14 1.61 3.19q0 1.68-1.14 2.83q-1.13 1.15-3.12 1.45l4.95 6.53h-2.72l-4.54-6.29zm-67.02 0v6.29h-2.37v-15.15h8.22q2.95 0 4.56 1.15q1.6 1.14 1.6 3.19q0 1.68-1.14 2.83q-1.13 1.15-3.12 1.45l4.96 6.53h-2.73l-4.54-6.29zm43.23-4.3q0 1.43-.73 2.48q-.73 1.06-2.08 1.63q-1.34 .58-3.2 .58h-5.14v5.9h-2.36v-15.15h7.35q2.94 0 4.55 1.19q1.61 1.2 1.61 3.37zm16.34 2.95q0-2.83-1.63-4.44q-1.63-1.61-4.6-1.61q-3 0-4.63 1.59q-1.64 1.59-1.64 4.46q0 1.89 .74 3.28q.74 1.39 2.15 2.15q1.4 .76 3.35 .76q3.03 0 4.65-1.62q1.61-1.62 1.61-4.57zm-97.68 3.21l-2 4.43h-2.46l7.13-15.15h2.69l7.01 15.15h-2.41l-2-4.43zm-30.5 0l-2.01 4.43h-2.45l7.12-15.15h2.69l7.02 15.15h-2.42l-1.99-4.43zm-81.73-5.63v10.06h-2.1v-15.15h2.75l9.44 12.99q-.15-2.12-.15-3.05v-9.94h2.14v15.15h-2.85l-9.35-12.9q.02 .71 .07 1.42q.05 .71 .05 1.42zm-4.44 8.38v1.68h-13.76v-15.15h13.25v1.68h-10.88v4.86h10.14v1.65h-10.14v5.28zm182.73 0v1.68h-13.76v-15.15h13.25v1.68h-10.88v4.86h10.13v1.65h-10.13v5.28zm91.12 0v1.68h-13.76v-15.15h13.25v1.68h-10.88v4.86h10.14v1.65h-10.14v5.28zm-206.01-5.34v7.02h-2.37v-15.15h2.37v6.41h9.44v-6.41h2.37v15.15h-2.37v-7.02zm-28.47 2.84q0 2.09-1.89 3.24q-1.89 1.15-5.33 1.15q-6.38 0-7.4-3.84l2.3-.4q.39 1.36 1.68 2q1.29 .64 3.51 .64q2.29 0 3.53-.68q1.25-.68 1.25-2q0-.75-.39-1.21q-.39-.46-1.1-.76q-.7-.3-1.68-.5q-.98-.21-2.17-.45q-1.37-.27-2.29-.53q-.93-.25-1.53-.54q-.59-.28-1.01-.6q-.62-.5-.95-1.15q-.33-.66-.33-1.51q0-1.94 1.72-2.99q1.71-1.06 4.91-1.06q2.98 0 4.55 .79q1.57 .79 2.21 2.69l-2.33 .36q-.39-1.21-1.46-1.75q-1.08-.54-2.99-.54q-2.1 0-3.2 .6q-1.1 .6-1.1 1.79q0 .7 .42 1.16q.43 .46 1.24 .77q.75 .31 3.21 .78q1 .21 1.98 .43q.98 .22 1.85 .55q.51 .18 .97 .45q.47 .26 .81 .6q.47 .46 .74 1.07q.27 .61 .27 1.44zm203.98-2.1v6.28h-2.35v-6.28l-6.72-8.87h2.6l5.32 7.22l5.29-7.22h2.61zm-264.73-7.19v13.47h-2.36v-13.47h-6v-1.68h14.36v1.68zm275.19 13.68q-2.21 0-3.53-.99q-1.31-.99-1.73-2.98l2.31-.34q.23 1.25 1.01 1.95q.78 .7 1.96 .7q1.29 0 2.03-.77q.74-.77 .74-2.25v-9h-3.36v-1.68h5.72v10.63q0 2.21-1.38 3.47q-1.37 1.26-3.77 1.26zm-142.26-1.89v1.68h-11.19v-15.15h2.36v13.47zm52.86-9.11q0-1.32-1.03-2.02q-1.04-.69-2.98-.69h-5.62v5.59h5.72q1.87 0 2.89-.76q1.02-.76 1.02-2.12zm67.02 0q0-1.32-1.04-2.02q-1.03-.69-2.98-.69h-5.61v5.59h5.71q1.87 0 2.89-.76q1.03-.76 1.03-2.12zm-35.8 .22q0-2.93-4.07-2.93h-4.7v5.98h4.8q1.99 0 2.98-.76q.99-.76 .99-2.29zm-172.68-4.58v15.15h-2.37v-15.15zm67.2 1.55q-.21 .6-.51 1.34q-.29 .74-.53 1.3l-2.22 4.93h6.53l-2.24-5q-.18-.37-.47-1.06q-.28-.69-.56-1.51zm30.5 0q-.21 .6-.5 1.34q-.29 .74-.54 1.3l-2.22 4.93h6.54l-2.25-5q-.17-.37-.45-1.06q-.29-.69-.58-1.51zm42.33-5.41l-2.78 2.56h-2.53l-2.9-2.56v-.23h1.29l2.87 1.49h.03l2.71-1.49h1.31z"/><path fill="#7C8187" d="M110.06 100.09c0 1.1-.44 2.15-1.21 2.92c-.78 .78-1.83 1.21-2.92 1.21c-1.1 0-2.15-.43-2.93-1.21c-.77-.77-1.21-1.82-1.21-2.92c0-1.09 .44-2.14 1.21-2.92c.78-.77 1.83-1.21 2.93-1.21c1.09 0 2.14 .44 2.92 1.21c.77 .78 1.21 1.83 1.21 2.92zm88.14 .08c0 1.09-.43 2.14-1.21 2.92c-.77 .77-1.82 1.2-2.92 1.2c-1.09 0-2.14-.43-2.92-1.2c-.77-.78-1.21-1.83-1.21-2.92c0-1.1 .44-2.15 1.21-2.93c.78-.77 1.83-1.2 2.92-1.2c1.1 0 2.15 .43 2.92 1.2c.78 .78 1.21 1.83 1.21 2.93z"/></svg>'
  };

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var PI2 = Math.PI * 2;

  // Míček ve viewBoxu loga (0 0 350 116)
  var CX = 177.6, CY = 31.81, R = 28.99;

  // Šířka pásu švu na povrchu koule (v jednotkách viewBoxu). V průmětu je pás užší, čím víc se
  // odvrací; v klidové poloze tak vychází jako původní švy (2,2).
  var SIRKA_PASU = 2.626;

  // Křivka švu, b napasované na původní kresbu švů
  var B = 0.21046;
  var A = 1 - B, H = 2 * Math.sqrt(A * B);

  // Natočení křivky v klidu (napasované na původní švy: shoda plochy pásu s kresbou).
  // Osy: x vpravo, y nahoru, z k divákovi.
  var R0 = [
    [0.064863, -0.997323, 0.033770],
    [0.997337, 0.063659, -0.035593],
    [0.033348, 0.035989, 0.998796]
  ];

  // Osa otáčení: svislá, nahoře mírně k divákovi a doleva
  var OSA = normuj([-0.14, 1, 0.26]);

  var VZORKU = 240;

  // Časování (ms)
  var CAS_PRECHOD = 160;       // prolnutí původní kresby švů a počítaných švů (míček stojí)
  var CAS_OTOCKA = 2400;       // jedna otáčka o 360°
  var CAS_CELKEM = CAS_PRECHOD + CAS_OTOCKA + CAS_PRECHOD;
  var ZPOZDENI_PO_NACTENI = 600;
  var ZPOZDENI_PO_ZOBRAZENI = 400;

  // Vlastnosti, které rozhodují o umístění a rozměru obrázku; vložené SVG je převezme
  var ROZLOZENI = [
    'display', 'box-sizing', 'width', 'height',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
    'vertical-align', 'float', 'clear', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
    'flex-grow', 'flex-shrink', 'flex-basis', 'align-self', 'justify-self', 'order',
    'grid-row-start', 'grid-row-end', 'grid-column-start', 'grid-column-end'
  ];
  // Vzhled se převezme, jen když se liší od výchozího (aby dál fungovala pravidla tříd stránky)
  var VZHLED = { 'opacity': '1', 'transform': 'none', 'filter': 'none', 'visibility': 'visible' };

  var mqPohyb = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var instance = [];
  var pozorovatel = null;
  var casStartu = 0;
  var pocitadlo = 0;
  var cekaPrepocet = false;
  var posluchaci = false;

  // Hrany pásu švu v klidové poloze (počítají se jednou): L = levá, P = pravá hrana.
  // Body leží na jednotkové kouli.
  var LX = [], LY = [], LZ = [], PX = [], PY = [], PZ = [];
  (function () {
    var h = SIRKA_PASU / 2 / R, k = 1 / Math.sqrt(1 + h * h);
    function pridat(X, Y, Z, x, y, z) {
      X.push(R0[0][0] * x + R0[0][1] * y + R0[0][2] * z);
      Y.push(R0[1][0] * x + R0[1][1] * y + R0[1][2] * z);
      Z.push(R0[2][0] * x + R0[2][1] * y + R0[2][2] * z);
    }
    for (var i = 0; i < VZORKU; i++) {
      var t = PI2 * i / VZORKU;
      // bod křivky a její tečna
      var x = A * Math.cos(t) + B * Math.cos(3 * t);
      var y = A * Math.sin(t) - B * Math.sin(3 * t);
      var z = H * Math.sin(2 * t);
      var dx = -A * Math.sin(t) - 3 * B * Math.sin(3 * t);
      var dy = A * Math.cos(t) - 3 * B * Math.cos(3 * t);
      var dz = 2 * H * Math.cos(2 * t);
      // směr napříč pásem po povrchu koule: bod × tečna
      var nx = y * dz - z * dy, ny = z * dx - x * dz, nz = x * dy - y * dx;
      var nd = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= nd; ny /= nd; nz /= nd;
      pridat(LX, LY, LZ, (x + h * nx) * k, (y + h * ny) * k, (z + h * nz) * k);
      pridat(PX, PY, PZ, (x - h * nx) * k, (y - h * ny) * k, (z - h * nz) * k);
    }
  })();

  // Pracovní pole pro natočené hrany (aby se při každém snímku nealokovalo)
  var lx = new Array(VZORKU), ly = new Array(VZORKU), lz = new Array(VZORKU);
  var px = new Array(VZORKU), py = new Array(VZORKU), pz = new Array(VZORKU);

  function normuj(v) {
    var d = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / d, v[1] / d, v[2] / d];
  }

  function ted() {
    return window.performance && performance.now ? performance.now() : Date.now();
  }

  function omezenyPohyb() {
    return !!(mqPohyb && mqPohyb.matches);
  }

  function hladce(x) {
    x = x < 0 ? 0 : x > 1 ? 1 : x;
    return x * x * (3 - 2 * x);
  }

  function prubeh(p) {
    // ease-in-out (sinus): pomalý rozjezd i dojezd
    return 0.5 - 0.5 * Math.cos(Math.PI * p);
  }

  function bod(x, y) {
    return (CX + R * x).toFixed(2) + ' ' + (CY - R * y).toFixed(2);
  }

  // Úsek pásu mezi vzorky i a i+1 leží celý na přivrácené straně koule
  function celyVpredu(i) {
    var j = (i + 1) % VZORKU;
    return lz[i] > 0 && lz[j] > 0 && pz[j] > 0 && pz[i] > 0;
  }

  // Úsek pásu (čtyřúhelník L_i L_j P_j P_i) oříznutý obrysem koule (rovina z = 0)
  function orezanyUsek(i, j) {
    var ox = [lx[i], lx[j], px[j], px[i]], oy = [ly[i], ly[j], py[j], py[i]], oz = [lz[i], lz[j], pz[j], pz[i]];
    var body = [];
    for (var e = 0; e < 4; e++) {
      var f = (e + 1) % 4;
      if (oz[e] > 0) body.push(bod(ox[e], oy[e]));
      if ((oz[e] > 0) !== (oz[f] > 0)) {
        // průsečík s obrysem, dotažený přesně na kružnici
        var u = oz[e] > 0 ? e : f, v = u === e ? f : e;
        var q = oz[u] / (oz[u] - oz[v]);
        var x = ox[u] + (ox[v] - ox[u]) * q, y = oy[u] + (oy[v] - oy[u]) * q;
        var r = Math.sqrt(x * x + y * y) || 1;
        body.push(bod(x / r, y / r));
      }
    }
    return body.length >= 3 ? 'M' + body.join('L') + 'Z' : '';
  }

  // Bílé švy pro natočení theta: viditelná část pásu jako vyplněné mnohoúhelníky v souřadnicích loga.
  // Souvislé úseky celé vpředu tvoří jeden pruh (levá hrana tam, pravá zpět), úseky přes obrys se ořežou.
  // Všechny díly mají stejnou orientaci, takže se při vyplnění spojí bez spár.
  function cestaSvu(theta) {
    var c = Math.cos(theta), s = Math.sin(theta), k = 1 - c;
    var kx = OSA[0], ky = OSA[1], kz = OSA[2];
    // Rodriguesova rotace kolem OSA
    var m00 = c + kx * kx * k, m01 = kx * ky * k - kz * s, m02 = kx * kz * k + ky * s;
    var m10 = ky * kx * k + kz * s, m11 = c + ky * ky * k, m12 = ky * kz * k - kx * s;
    var m20 = kz * kx * k - ky * s, m21 = kz * ky * k + kx * s, m22 = c + kz * kz * k;
    var i, x, y, z;
    for (i = 0; i < VZORKU; i++) {
      x = LX[i]; y = LY[i]; z = LZ[i];
      lx[i] = m00 * x + m01 * y + m02 * z;
      ly[i] = m10 * x + m11 * y + m12 * z;
      lz[i] = m20 * x + m21 * y + m22 * z;
      x = PX[i]; y = PY[i]; z = PZ[i];
      px[i] = m00 * x + m01 * y + m02 * z;
      py[i] = m10 * x + m11 * y + m12 * z;
      pz[i] = m20 * x + m21 * y + m22 * z;
    }
    // začít na úseku přes obrys, aby se pruh nerozdělil na konci pole
    var zacatek = 0;
    for (i = 0; i < VZORKU; i++) {
      if (!celyVpredu(i)) { zacatek = i; break; }
    }
    var d = [], pruh = [];
    function uzavritPruh() {
      if (pruh.length >= 2) {
        var cast = 'M' + bod(lx[pruh[0]], ly[pruh[0]]), n;
        for (n = 1; n < pruh.length; n++) cast += 'L' + bod(lx[pruh[n]], ly[pruh[n]]);
        for (n = pruh.length - 1; n >= 0; n--) cast += 'L' + bod(px[pruh[n]], py[pruh[n]]);
        d.push(cast + 'Z');
      }
      pruh = [];
    }
    for (var m = 0; m < VZORKU; m++) {
      i = (zacatek + m) % VZORKU;
      var j = (i + 1) % VZORKU;
      if (celyVpredu(i)) {
        if (!pruh.length) pruh.push(i);
        pruh.push(j);
      } else {
        uzavritPruh();
        d.push(orezanyUsek(i, j));
      }
    }
    uzavritPruh();
    return d.join('');
  }

  // ---- vložené SVG ----

  function vytvorSvg(zdroj) {
    var doc;
    try {
      doc = new DOMParser().parseFromString(zdroj, 'image/svg+xml');
    } catch (e) {
      return null;
    }
    var koren = doc && doc.documentElement;
    if (!koren || koren.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) return null;
    var svg = document.importNode(koren, true);
    // <title> by při najetí myší ukázal bublinu, kterou <img> neměl
    var titulky = svg.getElementsByTagName('title');
    while (titulky.length) titulky[0].parentNode.removeChild(titulky[0]);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.removeAttribute('role');
    svg.removeAttribute('aria-label');
    return svg;
  }

  function zmerit(img) {
    var cs = window.getComputedStyle(img), v = {}, i, p, h;
    for (i = 0; i < ROZLOZENI.length; i++) {
      p = ROZLOZENI[i];
      h = cs.getPropertyValue(p);
      if (h) v[p] = h;
    }
    for (p in VZHLED) {
      if (!VZHLED.hasOwnProperty(p)) continue;
      h = cs.getPropertyValue(p);
      if (h && h !== VZHLED[p]) v[p] = h;
    }
    // Přesný rozměr: vypočtený styl má jen 6 platných číslic a prohlížeč pak zlomkový rozměr
    // (např. 64,953 px) usekne o 1/64 px níž. Rozměr z getBoundingClientRect je přesný, pokud
    // obrázek ani jeho předky nic nezvětšuje (transformace) – jinak zůstane vypočtený styl.
    var b = img.getBoundingClientRect(), sirka = b.width, vyska = b.height;
    if (v['box-sizing'] !== 'border-box') {
      sirka -= delka(cs, 'padding-left') + delka(cs, 'padding-right') + delka(cs, 'border-left-width') + delka(cs, 'border-right-width');
      vyska -= delka(cs, 'padding-top') + delka(cs, 'padding-bottom') + delka(cs, 'border-top-width') + delka(cs, 'border-bottom-width');
    }
    if (Math.abs(sirka - parseFloat(v.width)) < 0.05 && Math.abs(vyska - parseFloat(v.height)) < 0.05) {
      v.width = sirka + 'px';
      v.height = vyska + 'px';
    }
    return v;
  }

  function delka(cs, p) {
    return parseFloat(cs.getPropertyValue(p)) || 0;
  }

  function prevzit(svg, styl, stylImg) {
    if (stylImg) svg.setAttribute('style', stylImg);
    else svg.removeAttribute('style');
    for (var p in styl) {
      if (styl.hasOwnProperty(p)) svg.style.setProperty(p, styl[p]);
    }
    svg.style.setProperty('min-width', '0');
    svg.style.setProperty('min-height', '0');
    svg.style.setProperty('max-width', 'none');
    svg.style.setProperty('max-height', 'none');
  }

  function vykreslenyObrazek(img) {
    return !!(img.getClientRects && img.getClientRects().length);
  }

  // Znovu převezme rozměr: na okamžik vrátí <img>, změří ho a vrátí SVG (vše v jednom kroku, bez překreslení)
  function prepocitat(inst) {
    var svg = inst.svg, img = inst.img, rodic = svg.parentNode;
    if (!rodic) return;
    rodic.replaceChild(img, svg);
    var styl = vykreslenyObrazek(img) ? zmerit(img) : null;
    rodic.replaceChild(svg, img);
    if (styl) prevzit(svg, styl, inst.stylImg);
  }

  function prepocitatVse() {
    cekaPrepocet = false;
    for (var i = 0; i < instance.length; i++) prepocitat(instance[i]);
  }

  function naplanovatPrepocet() {
    if (cekaPrepocet) return;
    cekaPrepocet = true;
    window.requestAnimationFrame(prepocitatVse);
  }

  function nahradit(img, zdroj) {
    if (!img.parentNode || !vykreslenyObrazek(img)) return;
    var svg = vytvorSvg(zdroj);
    if (!svg) return;
    var puvodni = svg.querySelector('path[fill="#FFFFFF"]');
    var kruh = svg.querySelector('circle');
    if (!puvodni || !kruh) return;

    var id = 'tami-micek-orez-' + (++pocitadlo);
    var defs = document.createElementNS(SVG_NS, 'defs');
    var orez = document.createElementNS(SVG_NS, 'clipPath');
    orez.setAttribute('id', id);
    var kruhOrez = document.createElementNS(SVG_NS, 'circle');
    kruhOrez.setAttribute('cx', kruh.getAttribute('cx'));
    kruhOrez.setAttribute('cy', kruh.getAttribute('cy'));
    kruhOrez.setAttribute('r', kruh.getAttribute('r'));
    orez.appendChild(kruhOrez);
    defs.appendChild(orez);
    svg.insertBefore(defs, svg.firstChild);

    var anim = document.createElementNS(SVG_NS, 'path');
    anim.setAttribute('fill', puvodni.getAttribute('fill'));
    anim.setAttribute('clip-path', 'url(#' + id + ')');
    anim.style.display = 'none';
    puvodni.parentNode.insertBefore(anim, puvodni.nextSibling);

    // atributy a přístupnost
    var w = img.getAttribute('width'), h = img.getAttribute('height');
    if (w) svg.setAttribute('width', w);
    if (h) svg.setAttribute('height', h);
    var trida = img.getAttribute('class');
    svg.setAttribute('class', (trida ? trida + ' ' : '') + 'tami-logo-micek');
    // <img> zůstane mimo dokument (jen na chvíli se vrací kvůli měření), id se tedy nepotká
    if (img.id) svg.setAttribute('id', img.id);
    if (img.getAttribute('title')) svg.setAttribute('title', img.getAttribute('title'));
    var alt = img.getAttribute('alt');
    if (alt) {
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', alt);
    } else {
      svg.setAttribute('aria-hidden', 'true');
    }
    svg.setAttribute('focusable', 'false');

    var stylImg = img.getAttribute('style') || '';
    prevzit(svg, zmerit(img), stylImg);
    img.parentNode.replaceChild(svg, img);

    var inst = {
      svg: svg, img: img, stylImg: stylImg, puvodni: puvodni, anim: anim,
      bezi: false, cas: 0, posledni: null, raf: 0, kreslenaTheta: NaN,
      naObrazovce: !pozorovatel, dobreVidet: !pozorovatel, cekaPrvni: true, casovac: 0
    };
    instance.push(inst);

    var spoust = (svg.closest && svg.closest('a[href], button')) || svg;
    var naJeti = function () { spustit(inst); };
    spoust.addEventListener(window.PointerEvent ? 'pointerenter' : 'mouseenter', naJeti);
    spoust.addEventListener('focusin', naJeti);

    pridatPosluchace();
    if (pozorovatel) pozorovatel.observe(svg);
    else zmenaViditelnosti(inst);
  }

  // ---- animace ----

  function klid(inst) {
    inst.bezi = false;
    inst.posledni = null;
    if (inst.raf) { window.cancelAnimationFrame(inst.raf); inst.raf = 0; }
    inst.puvodni.style.opacity = '';
    inst.anim.style.display = 'none';
    inst.anim.style.opacity = '';
  }

  function nakreslitSvy(inst, theta, viditelnostAnim, viditelnostPuvodni) {
    if (theta !== inst.kreslenaTheta) {
      inst.anim.setAttribute('d', cestaSvu(theta));
      inst.kreslenaTheta = theta;
    }
    inst.anim.style.display = '';
    inst.anim.style.opacity = viditelnostAnim >= 1 ? '' : viditelnostAnim.toFixed(3);
    inst.puvodni.style.opacity = viditelnostPuvodni >= 1 ? '' : viditelnostPuvodni.toFixed(3);
  }

  function vykreslit(inst) {
    var t = inst.cas, u;
    if (t < CAS_PRECHOD) {
      // nejdřív se počítané švy objeví přes původní, pak původní zmizí (žádný skok)
      u = t / CAS_PRECHOD;
      nakreslitSvy(inst, 0, hladce(u * 2), 1 - hladce(u * 2 - 1));
    } else if (t < CAS_PRECHOD + CAS_OTOCKA) {
      nakreslitSvy(inst, PI2 * prubeh((t - CAS_PRECHOD) / CAS_OTOCKA), 1, 0);
    } else {
      u = (t - CAS_PRECHOD - CAS_OTOCKA) / CAS_PRECHOD;
      nakreslitSvy(inst, 0, 1 - hladce(u * 2 - 1), hladce(u * 2));
    }
  }

  function planovat(inst) {
    if (!inst.raf) inst.raf = window.requestAnimationFrame(function (cas) { krok(inst, cas); });
  }

  function krok(inst, cas) {
    inst.raf = 0;
    if (!inst.bezi) return;
    if (!inst.naObrazovce) { inst.posledni = null; return; }   // pauza, pokračuje se po zobrazení
    if (omezenyPohyb()) { klid(inst); return; }
    if (inst.posledni !== null) inst.cas += Math.min(Math.max(cas - inst.posledni, 0), 100);
    inst.posledni = cas;
    if (inst.cas >= CAS_CELKEM) { klid(inst); return; }
    vykreslit(inst);
    planovat(inst);
  }

  function spustit(inst) {
    if (inst.bezi || omezenyPohyb() || !inst.svg.parentNode) return;
    inst.cekaPrvni = false;
    if (inst.casovac) { clearTimeout(inst.casovac); inst.casovac = 0; }
    inst.bezi = true;
    inst.cas = 0;
    inst.posledni = null;
    vykreslit(inst);
    if (inst.naObrazovce) planovat(inst);
  }

  function zmenaViditelnosti(inst) {
    if (inst.bezi) {
      if (inst.naObrazovce) { inst.posledni = null; planovat(inst); }
      return;
    }
    if (!inst.cekaPrvni) return;
    if (inst.dobreVidet && !inst.casovac) {
      var zbyva = Math.max(ZPOZDENI_PO_ZOBRAZENI, ZPOZDENI_PO_NACTENI - (ted() - casStartu));
      inst.casovac = setTimeout(function () {
        inst.casovac = 0;
        if (inst.cekaPrvni && inst.dobreVidet) spustit(inst);
      }, zbyva);
    } else if (!inst.dobreVidet && inst.casovac) {
      clearTimeout(inst.casovac);
      inst.casovac = 0;
    }
  }

  function najitInstanci(prvek) {
    for (var i = 0; i < instance.length; i++) {
      var inst = instance[i];
      if (inst.svg === prvek || inst.img === prvek || (prvek && prvek.contains && prvek.contains(inst.svg))) return inst;
    }
    return null;
  }

  function kazda(prvek, fn) {
    if (prvek) {
      var inst = najitInstanci(prvek);
      if (inst) fn(inst);
    } else {
      for (var i = 0; i < instance.length; i++) fn(instance[i]);
    }
  }

  // ---- start ----

  var VZOR_SRC = /(?:^|[\/\\])(tami-logo(?:-negativ)?\.svg)(?:[?#].*)?$/;

  function init() {
    if (omezenyPohyb()) return;
    if (!window.DOMParser || !document.createElementNS || !window.requestAnimationFrame || !window.getComputedStyle) return;
    casStartu = ted();
    if ('IntersectionObserver' in window) {
      pozorovatel = new IntersectionObserver(function (zaznamy) {
        for (var i = 0; i < zaznamy.length; i++) {
          var inst = najitInstanci(zaznamy[i].target);
          if (!inst) continue;
          inst.naObrazovce = zaznamy[i].isIntersecting;
          inst.dobreVidet = zaznamy[i].isIntersecting && zaznamy[i].intersectionRatio >= 0.5;
          zmenaViditelnosti(inst);
        }
      }, { threshold: [0, 0.5] });
    }
    var obrazky = document.getElementsByTagName('img'), kandidati = [], i;
    for (i = 0; i < obrazky.length; i++) {
      var m = VZOR_SRC.exec(obrazky[i].getAttribute('src') || '');
      if (m && LOGA[m[1]]) kandidati.push([obrazky[i], LOGA[m[1]]]);
    }
    for (i = 0; i < kandidati.length; i++) poNacteni(kandidati[i][0], kandidati[i][1]);
  }

  // Nahradí obrázek až po jeho načtení: do té doby má <img> rozměr jen podle atributů width/height
  // (líně načítané logo v patičce), ne podle skutečného poměru stran kresby.
  function poNacteni(img, zdroj) {
    if (img.complete && img.naturalWidth > 0) { nahradit(img, zdroj); return; }
    var nacteno = function () {
      img.removeEventListener('load', nacteno);
      if (img.naturalWidth > 0 && !omezenyPohyb()) nahradit(img, zdroj);
    };
    img.addEventListener('load', nacteno);
  }

  // Posluchače pro celou stránku (přidají se s prvním nahrazeným logem)
  function pridatPosluchace() {
    if (posluchaci) return;
    posluchaci = true;
    window.addEventListener('resize', naplanovatPrepocet);
    window.addEventListener('load', naplanovatPrepocet);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(naplanovatPrepocet, function () {});
    if (mqPohyb) {
      var zmena = function () {
        if (omezenyPohyb()) {
          for (var j = 0; j < instance.length; j++) {
            if (instance[j].casovac) { clearTimeout(instance[j].casovac); instance[j].casovac = 0; }
            instance[j].cekaPrvni = false;
            klid(instance[j]);
          }
        }
      };
      if (mqPohyb.addEventListener) mqPohyb.addEventListener('change', zmena);
      else if (mqPohyb.addListener) mqPohyb.addListener(zmena);
    }
  }

  window.TamiLogoMicek = {
    // spustí otáčku (všech log, nebo loga v daném prvku)
    otocit: function (prvek) { kazda(prvek, spustit); },
    // zastaví logo v natočení podil × 360° (pro kontrolní snímky); bez podílu vrátí klid
    snimek: function (prvek, podil) {
      kazda(prvek, function (inst) {
        inst.cekaPrvni = false;
        if (inst.casovac) { clearTimeout(inst.casovac); inst.casovac = 0; }
        klid(inst);
        if (typeof podil === 'number') nakreslitSvy(inst, PI2 * podil, 1, 0);
      });
    },
    instance: instance
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
