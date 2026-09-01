// ==UserScript==
// @name         port.hu TV műsor clean-up [f*ck you index]
// @namespace    http://tampermonkey.net/
// @version      10.0
// @description  Egy logósor + folyamatos Korábbi/Aktuális/Esti lista
// @author       norti + Claude AI
// @match        https://port.hu/tv*
// @icon         https://port.hu/favicons24/coast-icon-228x228.png
// @run-at       document-end
// @grant        GM_addStyle
// @downloadURL https://update.greasyfork.org/scripts/593864/porthu%20TV%20m%C5%B1sor%20clean-up%20%5Bf%2Ack%20you%20index%5D.user.js
// @updateURL https://update.greasyfork.org/scripts/593864/porthu%20TV%20m%C5%B1sor%20clean-up%20%5Bf%2Ack%20you%20index%5D.meta.js
// ==/UserScript==

(function() {
    'use strict';
    const customCSS = `
        /* Piros elválasztó sávok elrejtése (Korábbi/Aktuális/Esti feliratok) */
        #tvLister div[class*="bg_#EF3B39"],
        #tvLister div[class*="bg_#ef3b39"] {
            display: none !important;
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
// ==UserScript==
// @name         port.hu TV műsor clean-up [f*ck you index]
// @namespace    http://tampermonkey.net/
// @version      10.0
// @description  Egy logósor + folyamatos Korábbi/Aktuális/Esti lista
// @author       norti + Claude AI
// @match        https://port.hu/tv*
// @icon         https://port.hu/favicons24/coast-icon-228x228.png
// @run-at       document-end
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';
    const customCSS = `
        /* Piros elválasztó sávok elrejtése (Korábbi/Aktuális/Esti feliratok) */
        #tvLister div[class*="bg_#EF3B39"],
        #tvLister div[class*="bg_#ef3b39"] {
            display: none !important;
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
