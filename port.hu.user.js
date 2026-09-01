// ==UserScript==
// @name         port.hu TV műsor clean-up
// @namespace    norti
// @version      10.2
// @description  Egy logósor + folyamatos Korábbi/Aktuális/Esti lista + kiemelt műsor háttér színezés + ugró gombok elrejtése
// @author       norti - https://bsky.app/profile/norti79.bsky.social + Claude AI + Gemini AI
// @match        https://port.hu/tv*
// @icon         https://port.hu/favicons24/coast-icon-228x228.png
// @run-at       document-end
// @license      MIT
// @grant        GM_addStyle
// @downloadURL https://update.greasyfork.org/scripts/593864/porthu%20TV%20m%C5%B1sor%20clean-up.user.js
// @updateURL https://update.greasyfork.org/scripts/593864/porthu%20TV%20m%C5%B1sor%20clean-up.meta.js
// ==/UserScript==

(function() {
    'use strict';

    const customCSS = `
        /* Piros elválasztó sávok elrejtése (Korábbi/Aktuális/Esti feliratok) */
        #tvLister div[class*="bg_#EF3B39"],
        #tvLister div[class*="bg_#ef3b39"] {
            display: none !important;
        }

        /* Lebegő "Aktuális/Esti/Korábbi műsorok" ugró gombok elrejtése az oszlopokban */
        #tvLister .anchor {
            display: none !important;
        }

        /* Kiemelt műsor háttér színezés */
        .shadow_inset_4px_0px_0px_0px_\\#979797:not(#\\#):not(#\\#):not(#\\#):not(#\\#) {
            background-color: #11f2009e !important;
            border-radius: 10px !important;
            box-shadow: inset 0px 0px 0px 1px #000 !important;
        }
    `;

    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(customCSS);
    } else {
        const style = document.createElement('style');
        style.textContent = customCSS;
        document.head.appendChild(style);
    }

    function triggerPastProgramsLoad() {
        const bars = document.querySelectorAll('#tvLister div[class*="h_45px"]');

        bars.forEach(bar => {
            const text = (bar.innerText || '').trim().toUpperCase();
            if (text.startsWith('KORÁBBI') && !bar.dataset.triggered) {
                bar.dataset.triggered = "true";

                try { bar.click(); } catch (e) {}

                ['mousedown', 'mouseup', 'click'].forEach(type => {
                    const ev = new MouseEvent(type, {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    bar.dispatchEvent(ev);
                });
            }
        });
    }

    function dedupeChannelLogos() {
        const seen = new Set();
        const headers = document.querySelectorAll('#tvLister div[class*="min-h_60px"]');

        headers.forEach(header => {
            const link = header.querySelector('a[href*="/csatorna/tv/"]');
            if (!link) return;
            const href = link.getAttribute('href');

            if (seen.has(href)) {
                header.style.setProperty('display', 'none', 'important');
            } else {
                seen.add(href);
                header.style.removeProperty('display');
            }
        });
    }

    function refresh() {
        triggerPastProgramsLoad();
        dedupeChannelLogos();
    }

    const observer = new MutationObserver(() => {
        refresh();
    });

    const targetNode = document.getElementById('tvLister') || document.body;
    observer.observe(targetNode, { childList: true, subtree: true });

    setTimeout(refresh, 400);
    setTimeout(refresh, 1200);
    setTimeout(refresh, 2500);
})();