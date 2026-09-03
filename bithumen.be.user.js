// ==UserScript==
// @name         bithumen.be [quality&info badges + advanced live filters]
// @namespace    http://bithumen.be/
// @version      9.3
// @description  bithumen add-on badge-elt info sorral, élő szűrőkkel, igazított 2. sori badge-ekkel és jobbra zárt gombokkal
// @author       norti + Vector + Gemini AI + a-sync
// @match        https://bithumen.be/browse.php*
// @match        https://bithumen.be/watchlist.php*
// @icon         https://bithumen.be/favicon.ico
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // KATEGÓRIA DEFINÍCIÓK ELŐKÉSZÍTÉSE
    const ALL_CATEGORIES = {
        23: "Film/Hun/SD",
        24: "Film/Hun/DVD-R",
        25: "Film/Hun/720p",
        37: "Film/Hun/1080p",
        33: "Film/Hun/Blu-ray",
        30: "XXX/SD",
        19: "Film/Eng/SD",
        20: "Film/Eng/DVD-R",
        5:  "Film/Eng/720p",
        39: "Film/Eng/1080p",
        40: "Film/Eng/Blu-ray",
        34: "XXX/HD",
        7:  "Sorozat/Hun/SD",
        41: "Sorozat/Hun/HD",
        26: "Sorozat/Eng/SD",
        42: "Sorozat/Eng/HD",
        28: "eBook/Hun",
        29: "eBook/Eng",
        9:  "Mp3/Hun",
        35: "Lossless/Hun",
        1:  "Programok/ISO",
        4:  "Játékok/ISO",
        31: "Játékok/PS",
        36: "Játékok/Wii",
        6:  "Mp3/Eng",
        38: "Lossless/Eng",
        22: "Programok/egyéb",
        21: "Játékok/Rip/Dox",
        32: "Játékok/Xbox360",
        27: "Klipek"
    };

    // KIZÁRÓLAG EZEKNÉL A KATEGÓRIÁKNÁL JELENNEK MEG A VIDEÓ BADGE-EK (Group 1-3)
    const VIDEO_CATS = [23, 24, 25, 37, 33, 30, 19, 20, 5, 39, 40, 34, 7, 41, 26, 42];

    // 1. STÍLUSOK BESZÚRÁSA
    const customCSS = `
        /* Logó konténer elrejtése */
        #logoholderdiv {
            display: none !important;
        }

        /* Szűrő Panel */
        #bh-filter-panel {
            background-color: #1a1a1a;
            border: 1px solid #333;
            border-radius: 6px;
            padding: 10px 15px;
            margin: 10px auto;
            max-width: 950px;
            color: #ccc;
            font-family: sans-serif;
            font-size: 12px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .bh-panel-row {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
            width: 100%;
        }
        .bh-panel-row strong {
            color: #fff;
            margin-right: 4px;
            min-width: 75px;
        }

        /* Fehér torrentnevek és alapértelmezett linkek */
        a:link, a:visited {
           color: #ffffff !important;
        }

        /* Torrent cella tiszta rendezése */
        #torrenttable td[align="left"] {
            padding-top: 8px !important;
            padding-bottom: 8px !important;
            line-height: 1.4 !important;
        }

        /* Új Műveletek oszlop stílusa */
        .bh-action-cell {
            text-align: center !important;
            white-space: nowrap !important;
            vertical-align: middle !important;
            padding: 4px 6px !important;
        }
        .bh-action-container {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 3px !important;
        }

        /* Szűrőgombok alapstílusa */
        .bh-filter-btn {
            border: 1px solid #444;
            color: #fff;
            padding: 3px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            font-weight: bold;
            transition: all 0.2s ease;
            user-select: none;
            opacity: 0.4;
            filter: grayscale(50%);
            background-color: #2a2a2a;
        }
        .bh-filter-btn:hover {
            opacity: 0.8;
            filter: grayscale(0%);
            border-color: #888;
        }
        .bh-filter-btn.active {
            opacity: 1;
            filter: grayscale(0%);
            border-color: rgba(255,255,255,0.6);
            box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }

        /* Reset Gomb */
        #bh-reset-btn {
            background-color: #d9534f;
            border: 1px solid #c9302c;
            color: #fff;
            padding: 3px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            font-weight: bold;
            transition: all 0.2s ease;
            user-select: none;
            margin-left: auto;
        }
        #bh-reset-btn:hover {
            background-color: #c9302c;
        }

        /* Szűrőgombok egyedi színei */
        .btn-res-2160p.active { background-color: #d9534f !important; }
        .btn-res-1080p.active { background-color: #0275d8 !important; }
        .btn-res-720p.active  { background-color: #5cb85c !important; }
        .btn-res-sd.active    { background-color: #6c757d !important; }

        .btn-lang-hun.active   {
            background: linear-gradient(to bottom, #ce2939 33%, #ffffff 33%, #ffffff 66%, #477050 66%) !important;
            color: #000 !important;
            text-shadow: 0 0 2px #fff;
        }
        .btn-lang-eng.active   { background-color: #ffffff !important; color: #000000 !important; }
        .btn-type-movie.active { background-color: #6c757d !important; color: #fff !important; }
        .btn-type-series.active { background-color: #e84393 !important; color: #fff !important; }

        .btn-show-row1.active  { background-color: #17a2b8 !important; }
        .btn-show-row2.active  { background-color: #17a2b8 !important; }
        .btn-show-row3.active  { background-color: #17a2b8 !important; }
        .btn-show-row4.active  { background-color: #17a2b8 !important; }
        .btn-show-ser.active   { background-color: #e84393 !important; }

        /* Kereső Konténer */
        .bh-search-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 2px;
            padding-top: 6px;
            border-top: 1px solid #2a2a2a;
        }
        .bh-search-wrapper {
            position: relative;
            display: inline-flex;
            align-items: center;
        }
        #bh-search-input {
            background-color: #111;
            border: 1px solid #444;
            color: #fff;
            padding: 3px 22px 3px 8px;
            border-radius: 3px;
            font-size: 11px;
            outline: none;
            width: 180px;
        }
        #bh-search-input:focus {
            border-color: #0275d8;
        }
        #bh-search-clear {
            position: absolute;
            right: 5px;
            color: #888;
            cursor: pointer;
            font-weight: bold;
            font-size: 13px;
            line-height: 1;
            display: none;
            user-select: none;
        }
        #bh-search-clear:hover {
            color: #fff;
        }

        #bh-count-display {
            font-size: 11px;
            color: #888;
            font-weight: bold;
        }

        /* Badge-ek alapestílusai */
        .bh-badge {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 1px 5px !important;
            font-size: 9px !important;
            font-weight: bold !important;
            color: #ffffff !important;
            border-radius: 3px !important;
            margin: 0 !important;
            vertical-align: middle !important;
            letter-spacing: 0.3px !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
            line-height: 12px !important;
            text-transform: uppercase;
            text-decoration: none !important;
            box-sizing: border-box !important;
        }

        /* Első sori (Torrent név) konténer flex elrendezése */
        .bh-title-container {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            gap: 6px !important;
        }

        /* Piros ÚJ Badge - Jobbra igazítva */
        .new-tag {
            background-color: #be1400 !important;
            color: #ffffff !important;
            margin-left: auto !important;
            flex-shrink: 0 !important;
        }

        /* DL Badge & RSS Badge */
        .dl-badge {
            background-color: #0275d8 !important;
            color: #ffffff !important;
            margin: 0 !important;
            cursor: pointer;
        }
        .dl-badge:hover {
            background-color: #025aa5 !important;
            color: #ffffff !important;
        }

        .rss-badge {
            background-color: #fd7e14 !important;
            color: #ffffff !important;
            margin: 0 !important;
            cursor: pointer;
            user-select: none;
        }
        .rss-badge:hover { background-color: #e36d0c !important; }
        .rss-badge.rss-added { background-color: #28a745 !important; }
        .rss-badge.rss-added:hover { background-color: #218838 !important; }
        .rss-badge.rss-removed { background-color: #dc3545 !important; }
        .rss-badge.rss-removed:hover { background-color: #c82333 !important; }

        /* MÁSODIK SORI KONTÉNER & BADGE STÍLUSOK (Flex igazítással) */
        .bh-second-row {
            display: flex !important;
            align-items: center !important;
            flex-wrap: wrap !important;
            gap: 4px !important;
            width: 100% !important;
            margin-top: 3px !important;
        }

        a.bh-info-badge, a.bh-info-badge:visited, a.bh-info-badge:link {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: Georgia, serif !important;
            font-style: italic !important;
            font-weight: bold !important;
            font-size: 11px !important;
            width: 16px !important;
            height: 16px !important;
            padding: 0 !important;
            text-transform: lowercase !important;
        }
        a.bh-info-badge:hover {
            background-color: #dddddd !important;
            color: #000000 !important;
        }

        /* Trailer gomb méretének szinkronizálása az i badge-hez */
        a.bh-trailer-badge, a.bh-trailer-badge:visited, a.bh-trailer-badge:link {
            background-color: #343a40 !important;
            color: #ffffff !important;
            font-size: 10px !important;
            width: 16px !important;
            height: 16px !important;
            padding: 0 !important;
        }
        a.bh-trailer-badge:hover {
            background-color: #495057 !important;
            color: #ffffff !important;
        }

        a.bh-imdb-badge, a.bh-imdb-badge:visited, a.bh-imdb-badge:link {
            background-color: #f5c518 !important;
            color: #000000 !important;
            font-weight: 900 !important;
            padding: 1px 5px !important;
            letter-spacing: 0px !important;
            height: 16px !important;
        }
        a.bh-imdb-badge:hover {
            background-color: #e2b616 !important;
            color: #000000 !important;
        }

        /* Kisebb műfaj badge-ek */
        a.bh-genre-badge, a.bh-genre-badge:visited, a.bh-genre-badge:link {
            background-color: #383838 !important;
            color: #e0e0e0 !important;
            font-weight: normal !important;
            font-size: 8px !important;
            text-transform: lowercase !important;
            padding: 1px 4px !important;
            height: 14px !important;
        }
        a.bh-genre-badge:hover {
            background-color: #4a4a4a !important;
            color: #ffffff !important;
        }

        /* További változatok (+🠇) badge - Jobbra igazítva */
        a.bh-others-badge, a.bh-others-badge:visited, a.bh-others-badge:link {
            background-color: #17a2b8 !important;
            color: #000000 !important;
            font-size: 10px !important;
            font-weight: bold !important;
            padding: 1px 6px !important;
            height: 16px !important;
            cursor: pointer;
            margin-left: auto !important;
            flex-shrink: 0 !important;
        }
        a.bh-others-badge:hover {
            background-color: #138496 !important;
            color: #000000 !important;
        }

        /* Eredeti ikonok elrejtése */
        .bh-hide-original {
            display: none !important;
        }

        .bh-badges-bottom-row {
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
            width: 100%;
            margin-top: 4px;
            line-height: 1;
        }
        .bh-badge-group {
            display: inline-flex;
            gap: 2px;
        }

        /* Felbontások */
        .res-2160p { background-color: #d9534f !important; }
        .res-1080p { background-color: #0275d8 !important; }
        .res-720p  { background-color: #5cb85c !important; }
        .res-sd    { background-color: #6c757d !important; }

        /* Kép & Hang technológiák & DVD */
        .tech-hdr   { background-color: #f0ad4e !important; color: #000 !important; }
        .tech-dovi  { background-color: #8e44ad !important; }
        .tech-atmos { background-color: #17a2b8 !important; }
        .tech-audio { background-color: #4a69bd !important; }
        .tech-codec { background-color: #343a40 !important; }
        .tech-remux { background-color: #e84118 !important; }
        .tech-dvd   { background-color: #e67e22 !important; }

        /* Forrás & Nyelv */
        .src-bluray { background-color: #6f42c1 !important; }
        .src-webdl  { background-color: #20c997 !important; }

        /* Magyar Zászló HUN Badge */
        .lang-hun   {
            background: linear-gradient(to bottom, #ce2939 33%, #ffffff 33%, #ffffff 66%, #477050 66%) !important;
            color: #111111 !important;
            text-shadow: 0 0 2px #ffffff, 0 0 1px #ffffff !important;
        }
        .lang-eng   { background-color: #ffffff !important; color: #000000 !important; }

        /* Release Group & Series Badge */
        .grp-tag {
            background-color: #495057 !important;
            cursor: pointer !important;
            transition: transform 0.1s ease;
        }
        .grp-tag:hover {
            background-color: #6c757d !important;
            transform: scale(1.05);
        }
        .series-tag { background-color: #e84393 !important; color: #ffffff !important; }

        /* TOVÁBBI VERZIÓK INLINE DOBOZ STÍLUSA */
        .bh-subreleases-row {
            background-color: #121212 !important;
        }
        .bh-subreleases-container {
            padding: 8px 12px !important;
            background-color: #181818 !important;
            border: 1px dashed #444 !important;
            border-radius: 4px !important;
            margin: 4px 10px 8px 10px !important;
            overflow-x: auto;
        }
        .bh-subreleases-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 11px !important;
        }
        .bh-subreleases-table td, .bh-subreleases-table th {
            padding: 5px 8px !important;
            border-bottom: 1px solid #282828 !important;
            vertical-align: middle !important;
        }
        .bh-subreleases-loading {
            color: #17a2b8;
            font-weight: bold;
            font-size: 11px;
            padding: 6px;
        }
    `;

    const styleNode = document.createElement('style');
    styleNode.type = 'text/css';
    styleNode.appendChild(document.createTextNode(customCSS));
    (document.head || document.documentElement).appendChild(styleNode);


    // 2. LOCALSTORAGE ÁLLAPOTKEZELÉS
    const STORAGE_KEY = 'bh_quality_filters';
    const defaultFilters = {
        'res-2160p': true,
        'res-1080p': true,
        'res-720p': true,
        'res-sd': true,
        'lang-hun': true,
        'lang-eng': true,
        'type-movie': true,
        'type-series': true,
        'show-row1': true,
        'show-row2': true,
        'show-row3': true,
        'show-row4': true,
        'show-ser': true
    };

    let activeFilters = Object.assign({}, defaultFilters, JSON.parse(localStorage.getItem(STORAGE_KEY)) || {});
    let searchQuery = '';

    function saveFilters() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeFilters));
    }

    // Segédfüggvény: Kategória ID kinyerése
    function getCategoryIdFromRow(row) {
        const catLink = row.querySelector('a[href*="cat="]');
        if (catLink) {
            const match = catLink.href.match(/cat=(\d+)/);
            if (match) return parseInt(match[1], 10);
        }
        return null;
    }


    // 3. SZŰRŐ PANEL LÉTREHOZÁSA
    function createFilterPanel() {
        const targetContainer = document.querySelector('#lsForm') || document.querySelector('#maintd');
        if (!targetContainer || document.querySelector('#bh-filter-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'bh-filter-panel';
        panel.innerHTML = `
            <div class="bh-panel-row">
                <strong>Szűrés:</strong>
                <button class="bh-filter-btn btn-res-2160p ${activeFilters['res-2160p'] ? 'active' : ''}" data-filter="res-2160p">4K | 2160p</button>
                <button class="bh-filter-btn btn-res-1080p ${activeFilters['res-1080p'] ? 'active' : ''}" data-filter="res-1080p">FHD | 1080p</button>
                <button class="bh-filter-btn btn-res-720p ${activeFilters['res-720p'] ? 'active' : ''}" data-filter="res-720p">HD | 720p</button>
                <button class="bh-filter-btn btn-res-sd ${activeFilters['res-sd'] ? 'active' : ''}" data-filter="res-sd">SD | 480p</button>
                <button class="bh-filter-btn btn-lang-hun ${activeFilters['lang-hun'] ? 'active' : ''}" data-filter="lang-hun">HUN</button>
                <button class="bh-filter-btn btn-lang-eng ${activeFilters['lang-eng'] ? 'active' : ''}" data-filter="lang-eng">ENG</button>
                <button class="bh-filter-btn btn-type-movie ${activeFilters['type-movie'] ? 'active' : ''}" data-filter="type-movie">Film</button>
                <button class="bh-filter-btn btn-type-series ${activeFilters['type-series'] ? 'active' : ''}" data-filter="type-series">Sorozat</button>

                <button id="bh-reset-btn" title="Sz&#251;r&#246;k alaphelyzetbe &#225;ll&#237;t&#225;sa">↺ Alaphelyzet</button>
            </div>

            <div class="bh-panel-row">
                <strong>Címkék:</strong>
                <button class="bh-filter-btn btn-show-row1 ${activeFilters['show-row1'] ? 'active' : ''}" data-filter="show-row1" title="Felbont&#225;s">Felbont&#225;s</button>
                <button class="bh-filter-btn btn-show-row2 ${activeFilters['show-row2'] ? 'active' : ''}" data-filter="show-row2" title="Audio+codec info">Info</button>
                <button class="bh-filter-btn btn-show-row3 ${activeFilters['show-row3'] ? 'active' : ''}" data-filter="show-row3" title="Nyelv">Nyelv</button>
                <button class="bh-filter-btn btn-show-row4 ${activeFilters['show-row4'] ? 'active' : ''}" data-filter="show-row4" title="Release Csoport">RLSGRP</button>
                <button class="bh-filter-btn btn-show-ser ${activeFilters['show-ser'] ? 'active' : ''}" data-filter="show-ser" title="Series badge">Sorozat</button>
            </div>

            <div class="bh-search-row">
                <strong>Élő szűrés:</strong>
                <div class="bh-search-wrapper">
                    <input type="text" id="bh-search-input" placeholder="Keres&#233;s a tal&#225;latok k&#246;z&#246;tt..." />
                    <span id="bh-search-clear" title="T&#246;rl&#233;s (ESC)">&times;</span>
                </div>
                <span id="bh-count-display"></span>
            </div>
        `;

        targetContainer.parentNode.insertBefore(panel, targetContainer.nextSibling);

        panel.querySelectorAll('.bh-filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const filterKey = this.getAttribute('data-filter');
                activeFilters[filterKey] = !activeFilters[filterKey];

                this.classList.toggle('active', activeFilters[filterKey]);
                saveFilters();

                if (filterKey.startsWith('show-')) {
                    applyBadgeVisibility();
                } else {
                    applyRowFiltering();
                }
            });
        });

        const resetBtn = panel.querySelector('#bh-reset-btn');
        resetBtn.addEventListener('click', function() {
            activeFilters = Object.assign({}, defaultFilters);
            saveFilters();

            panel.querySelectorAll('.bh-filter-btn').forEach(btn => {
                const filterKey = btn.getAttribute('data-filter');
                btn.classList.toggle('active', activeFilters[filterKey]);
            });

            const searchInput = panel.querySelector('#bh-search-input');
            const clearBtn = panel.querySelector('#bh-search-clear');
            searchInput.value = '';
            searchQuery = '';
            clearBtn.style.display = 'none';

            applyRowFiltering();
            applyBadgeVisibility();
        });

        const searchInput = panel.querySelector('#bh-search-input');
        const clearBtn = panel.querySelector('#bh-search-clear');

        function clearSearch() {
            searchInput.value = '';
            searchQuery = '';
            clearBtn.style.display = 'none';
            applyRowFiltering();
            searchInput.focus();
        }

        searchInput.addEventListener('input', function() {
            searchQuery = this.value.toLowerCase().trim();
            clearBtn.style.display = searchQuery.length > 0 ? 'inline' : 'none';
            applyRowFiltering();
        });

        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                clearSearch();
            }
        });

        clearBtn.addEventListener('click', clearSearch);
    }

    function applyRowFiltering() {
        const rows = document.querySelectorAll('#torrenttable tr');
        let totalRows = 0;
        let visibleRows = 0;

        const isVideoFilterActive = !activeFilters['res-2160p'] || !activeFilters['res-1080p'] || !activeFilters['res-720p'] || !activeFilters['res-sd'] || !activeFilters['type-movie'] || !activeFilters['type-series'];

        rows.forEach(row => {
            if (row.querySelector('td.colhead') || row.classList.contains('bh-subreleases-row')) return;

            totalRows++;
            let showRow = true;

            const catId = getCategoryIdFromRow(row);
            const isVideoCategory = catId ? VIDEO_CATS.includes(catId) : true;

            if (isVideoFilterActive && !isVideoCategory) {
                showRow = false;
            }

            if (showRow && isVideoCategory) {
                if (!activeFilters['res-2160p'] && row.querySelector('.res-2160p')) showRow = false;
                if (!activeFilters['res-1080p'] && row.querySelector('.res-1080p')) showRow = false;
                if (!activeFilters['res-720p'] && row.querySelector('.res-720p')) showRow = false;
                if (!activeFilters['res-sd'] && row.querySelector('.res-sd')) showRow = false;

                const isSeries = !!row.querySelector('.series-tag');
                if (!activeFilters['type-series'] && isSeries) showRow = false;
                if (!activeFilters['type-movie'] && !isSeries) showRow = false;
            }

            if (showRow && row.querySelector('.bh-badges-bottom-row')) {
                const isHun = !!row.querySelector('.lang-hun');
                const isEng = !!row.querySelector('.lang-eng');

                if (!activeFilters['lang-hun'] && isHun && !isEng) showRow = false;
                if (!activeFilters['lang-eng'] && isEng && !isHun) showRow = false;
                if (!activeFilters['lang-hun'] && !activeFilters['lang-eng']) showRow = false;
            }

            if (showRow && searchQuery !== '') {
                const rowText = row.textContent.toLowerCase();
                if (!rowText.includes(searchQuery)) {
                    showRow = false;
                }
            }

            row.style.display = showRow ? '' : 'none';

            const nextRow = row.nextElementSibling;
            if (nextRow && nextRow.classList.contains('bh-subreleases-row')) {
                nextRow.style.display = showRow ? '' : 'none';
            }

            if (showRow) visibleRows++;
        });

        const countDisplay = document.querySelector('#bh-count-display');
        if (countDisplay) {
            countDisplay.textContent = `(${visibleRows} / ${totalRows})`;
        }
    }

    function applyBadgeVisibility() {
        for (let i = 1; i <= 5; i++) {
            const groupElements = document.querySelectorAll(`.bh-badge-group-${i}`);
            const key = (i === 5) ? 'show-ser' : `show-row${i}`;
            groupElements.forEach(el => {
                el.style.display = activeFilters[key] ? 'inline-block' : 'none';
            });
        }
    }

    // 4. RSS TOGGLE LOGIKA
    function handleRSSToggle(badgeElem, torrentId) {
        let currentState = badgeElem.getAttribute('data-state') || 'initial';
        let action = (currentState === 'added') ? 'del' : 'add';

        badgeElem.innerHTML = '...';

        fetch(`/torrentmark.php?torrentid=${torrentId}&type=personalrss&json=1&action=${action}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01'
            }
        })
        .then(response => response.text())
        .then(text => {
            let data;
            try { data = JSON.parse(text); } catch (e) { data = text; }

            if ((Array.isArray(data) && data[0] == 1) || (typeof data === 'string' && data.length > 0)) {
                if (action === 'add') {
                    badgeElem.setAttribute('data-state', 'added');
                    badgeElem.className = 'bh-badge rss-badge rss-added';
                    badgeElem.innerHTML = 'RSS &#10003;';
                    badgeElem.title = (Array.isArray(data) && data[1]) ? data[1] : 'RSS-hez hozzáadva';
                } else {
                    badgeElem.setAttribute('data-state', 'removed');
                    badgeElem.className = 'bh-badge rss-badge rss-removed';
                    badgeElem.innerHTML = 'RSS-';
                    badgeElem.title = (Array.isArray(data) && data[1]) ? data[1] : 'RSS-ből eltávolítva';
                }
            } else {
                badgeElem.innerHTML = 'Hiba!';
            }
        })
        .catch(err => {
            console.error('RSS error:', err);
            badgeElem.innerHTML = 'Hiba!';
        });
    }

    // 5. TOVÁBBI VERZIÓK TÁBLÁZATÁNAK TELJES BADGE-ELÉSE
    function processSubTable(subTable, parentCatId) {
        subTable.className = 'bh-subreleases-table';
        const rows = subTable.querySelectorAll('tr');

        rows.forEach(row => {
            const nameCell = row.querySelector('td[align="left"]') || row.children[1];
            if (!nameCell) return;

            const catId = getCategoryIdFromRow(row) || parentCatId;
            const isVideoCategory = catId ? VIDEO_CATS.includes(catId) : true;

            const nameLink = nameCell.querySelector('a[href^="details.php"]');
            if (nameLink) {
                let torrentId = null;
                const idMatch = nameLink.href.match(/id=(\d+)/);
                if (idMatch) torrentId = idMatch[1];

                // DL / RSS ikonok cseréje
                nameCell.querySelectorAll('a').forEach(a => {
                    const href = a.getAttribute('href') || '';
                    const img = a.querySelector('img');

                    if (href.includes('download.php')) {
                        a.className = 'bh-badge dl-badge';
                        a.textContent = 'DL';
                        a.title = 'Letöltés';
                        a.innerHTML = 'DL';
                    } else if (href.includes('torrentmark.php') || href.includes('personalrss') || (img && img.alt && img.alt.toLowerCase().includes('rss'))) {
                        if (torrentId) {
                            const rssBadge = document.createElement('span');
                            rssBadge.className = 'bh-badge rss-badge';
                            rssBadge.innerHTML = 'RSS+';
                            rssBadge.title = 'Egyéni RSS-hez adás';
                            rssBadge.setAttribute('data-state', 'initial');

                            rssBadge.addEventListener('click', function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRSSToggle(this, torrentId);
                            });

                            a.parentNode.replaceChild(rssBadge, a);
                        }
                    }
                });

                // Badge-ek generálása
                if (!nameCell.querySelector('.bh-badges-bottom-row')) {
                    const text = nameLink.textContent;
                    const badgesContainer = document.createElement('div');
                    badgesContainer.className = 'bh-badges-bottom-row';

                    const group1 = document.createElement('div'); group1.className = 'bh-badge-group bh-badge-group-1';
                    const group2 = document.createElement('div'); group2.className = 'bh-badge-group bh-badge-group-2';
                    const group3 = document.createElement('div'); group3.className = 'bh-badge-group bh-badge-group-3';
                    const group4 = document.createElement('div'); group4.className = 'bh-badge-group bh-badge-group-4';

                    if (isVideoCategory) {
                        // Felbontás
                        const has2160p = text.includes('2160p') || text.includes('UHD') || text.includes('4K');
                        const has1080p = text.includes('1080p') || text.includes('1080i');
                        const has720p  = text.includes('720p');

                        if (has2160p) addBadge(group1, '4K', 'bh-badge res-2160p');
                        else if (has1080p) addBadge(group1, '1080p', 'bh-badge res-1080p');
                        else if (has720p) addBadge(group1, 'HD', 'bh-badge res-720p');
                        else addBadge(group1, 'SD', 'bh-badge res-sd');

                        if (text.includes('HDR')) addBadge(group1, 'HDR', 'bh-badge tech-hdr');
                        if (text.includes('DV.') || text.includes('DoVi') || text.includes('Dolby.Vision')) addBadge(group1, 'DoVi', 'bh-badge tech-dovi');

                        // Audio & Codec + BDRip
                        if (text.includes('Atmos')) addBadge(group2, 'Atmos', 'bh-badge tech-atmos');
                        else if (text.includes('DDP') || text.includes('DD+') || text.includes('DD5')) addBadge(group2, '5.1', 'bh-badge tech-audio');
                        else if (text.includes('DD2') || text.includes('2.0')) addBadge(group2, 'STEREO', 'bh-badge tech-audio');
                        else if (text.includes('DTS')) addBadge(group2, 'DTS', 'bh-badge tech-audio');

                        if (text.includes('REMUX')) addBadge(group2, 'REMUX', 'bh-badge tech-remux');
                        if (text.includes('BluRay') || text.includes('Bluray') || text.includes('BDRip') || text.includes('BD-Rip')) addBadge(group2, 'BR', 'bh-badge src-bluray');
                        else if (text.includes('WEB-DL') || text.includes('WEBDL') || text.includes('WEB')) addBadge(group2, 'WEB-DL', 'bh-badge src-webdl');
                        else if (text.includes('DVDR') || text.includes('DVD')) addBadge(group2, 'DVD', 'bh-badge tech-dvd');

                        if (text.includes('x265') || text.includes('H.265') || text.includes('HEVC')) addBadge(group2, 'x265', 'bh-badge tech-codec');
                        else if (text.includes('x264') || text.includes('H.264')) addBadge(group2, 'x264', 'bh-badge tech-codec');

                        // Nyelv
                        const isHun = text.includes('HUN') || text.includes('HuN') || text.includes('Hun') || text.includes('.HU.');
                        const isEng = text.includes('ENG') || text.includes('Eng') || text.includes('.EN.') || !isHun;

                        if (isHun) addBadge(group3, 'HUN', 'bh-badge lang-hun');
                        if (isEng) addBadge(group3, 'ENG', 'bh-badge lang-eng');
                    }

                    // Release Csoport (MINDEN KATEGÓRIÁNÁL MEGJELENIK)
                    const rlsMatch = text.match(/-([A-Za-z0-9]+)$/);
                    if (rlsMatch && rlsMatch[1]) {
                        const grpBadge = addBadge(group4, rlsMatch[1], 'bh-badge grp-tag');
                        grpBadge.title = `Kattints a(z) "${rlsMatch[1]}" szűréséhez`;
                        grpBadge.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();

                            const searchInput = document.querySelector('#bh-search-input');
                            const clearBtn = document.querySelector('#bh-search-clear');
                            if (searchInput) {
                                searchInput.value = rlsMatch[1];
                                searchQuery = rlsMatch[1].toLowerCase().trim();
                                if (clearBtn) clearBtn.style.display = 'inline';
                                applyRowFiltering();
                                searchInput.focus();
                            }
                        });
                    }

                    if (group1.children.length > 0) badgesContainer.appendChild(group1);
                    if (group2.children.length > 0) badgesContainer.appendChild(group2);
                    if (group3.children.length > 0) badgesContainer.appendChild(group3);
                    if (group4.children.length > 0) badgesContainer.appendChild(group4);

                    if (badgesContainer.children.length > 0) {
                        nameCell.appendChild(badgesContainer);
                    }
                }
            }
        });
    }

    // 6. TOVÁBBI VERZIÓK INLINE BETÖLTÉSE
    function toggleSubReleases(othersLink, parentRow) {
        let subRow = parentRow.nextElementSibling;

        if (subRow && subRow.classList.contains('bh-subreleases-row')) {
            if (subRow.style.display === 'none') {
                subRow.style.display = '';
                othersLink.innerHTML = '-🠇';
            } else {
                subRow.style.display = 'none';
                othersLink.innerHTML = '+🠇';
            }
            return;
        }

        const colCount = parentRow.children.length;
        subRow = document.createElement('tr');
        subRow.className = 'bh-subreleases-row';

        const subTd = document.createElement('td');
        subTd.colSpan = colCount;
        subTd.className = 'clear';

        const container = document.createElement('div');
        container.className = 'bh-subreleases-container';
        container.innerHTML = '<div class="bh-subreleases-loading">További verziók betöltése...</div>';

        subTd.appendChild(container);
        subRow.appendChild(subTd);
        parentRow.parentNode.insertBefore(subRow, parentRow.nextSibling);

        othersLink.innerHTML = '-🠇';

        const parentCatId = getCategoryIdFromRow(parentRow);

        fetch(othersLink.href)
            .then(res => res.arrayBuffer())
            .then(buffer => {
                const decoder = new TextDecoder('iso-8859-2');
                const htmlText = decoder.decode(buffer);

                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');

                let subTable = null;
                const allTables = doc.querySelectorAll('table');

                allTables.forEach(tbl => {
                    const txt = tbl.textContent;
                    if (txt.includes('Típus') && txt.includes('Név') && txt.includes('Méret') && txt.includes('Seed')) {
                        subTable = tbl;
                    }
                });

                if (subTable) {
                    container.innerHTML = '';
                    processSubTable(subTable, parentCatId);
                    container.appendChild(subTable);
                    applyBadgeVisibility();
                } else {
                    container.innerHTML = '<div style="color: #d9534f; padding: 4px;">Nem találhatók további verziók ezen a linken.</div>';
                }
            })
            .catch(err => {
                console.error('Sub-releases load error:', err);
                container.innerHTML = '<div style="color: #d9534f; padding: 4px;">Hiba történt a verziók betöltése közben.</div>';
            });
    }

    // 7. TÁBLÁZAT ÉS BADGE-EK FELDOLGOZÁSA
    function processTable() {
        const table = document.querySelector('#torrenttable');
        if (!table) return;

        const headerRow = table.querySelector('tr');
        if (headerRow && !headerRow.querySelector('.bh-action-th')) {
            const colhead = headerRow.querySelector('td.colhead');
            if (colhead) {
                const actionTh = document.createElement('td');
                actionTh.className = 'colhead bh-action-th';
                actionTh.textContent = 'DL';
                actionTh.title = 'Torrent letöltése/hozzáadás saját RSS-hez';

                const cells = headerRow.querySelectorAll('td');
                if (cells.length > 2) {
                    headerRow.insertBefore(actionTh, cells[2]);
                } else {
                    headerRow.appendChild(actionTh);
                }
            }
        }

        const rows = table.querySelectorAll('tr');

        rows.forEach(row => {
            if (row.querySelector('td.colhead') || row.classList.contains('bh-subreleases-row')) return;

            const nameCell = row.querySelector('td[align="left"]');
            const nameLink = nameCell ? nameCell.querySelector('a[href^="details.php"]') : null;

            if (nameLink) {
                let torrentId = null;
                const idMatch = nameLink.href.match(/id=(\d+)/);
                if (idMatch) torrentId = idMatch[1];

                const catId = getCategoryIdFromRow(row);
                const isVideoCategory = catId ? VIDEO_CATS.includes(catId) : true;

                // --- 7/A: MŰVELETEK CELLA (DL / RSS) ---
                let actionCell = row.querySelector('.bh-action-cell');
                if (!actionCell) {
                    actionCell = document.createElement('td');
                    actionCell.className = 'bh-action-cell';

                    const actionContainer = document.createElement('div');
                    actionContainer.className = 'bh-action-container';
                    actionCell.appendChild(actionContainer);

                    const rowCells = row.querySelectorAll('td');
                    if (rowCells.length > 2) {
                        row.insertBefore(actionCell, rowCells[2]);
                    } else {
                        row.appendChild(actionCell);
                    }
                }

                const actionContainer = actionCell.querySelector('.bh-action-container');
                const allLinks = nameCell.querySelectorAll('a');

                allLinks.forEach(a => {
                    const href = a.getAttribute('href') || '';
                    const img = a.querySelector('img');

                    if (href.includes('download.php')) {
                        if (!actionContainer.querySelector('.dl-badge')) {
                            const dlBadge = document.createElement('a');
                            dlBadge.href = href;
                            dlBadge.className = 'bh-badge dl-badge';
                            dlBadge.textContent = 'DL';
                            dlBadge.title = 'Let&#246;lt&#233;s';
                            actionContainer.appendChild(dlBadge);
                        }
                        a.classList.add('bh-hide-original');
                    }

                    if (href.includes('torrentmark.php') || href.includes('personalrss') || (img && img.alt && img.alt.toLowerCase().includes('rss'))) {
                        if (!actionContainer.querySelector('.rss-badge') && torrentId) {
                            const rssBadge = document.createElement('span');
                            rssBadge.className = 'bh-badge rss-badge';
                            rssBadge.innerHTML = 'RSS+';
                            rssBadge.title = 'Egyéni RSS-hez adás';
                            rssBadge.setAttribute('data-state', 'initial');

                            rssBadge.addEventListener('click', function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRSSToggle(this, torrentId);
                            });

                            actionContainer.appendChild(rssBadge);
                        }
                        a.classList.add('bh-hide-original');
                    }
                });

                // --- 7/B: ÚJ BADGE JOBBRA IGAZÍTÁSA ---
                if (!nameCell.querySelector('.new-tag')) {
                    let hasNewFlag = false;

                    if (/\(&#218;j\)/i.test(nameLink.textContent) || /\(Új\)/i.test(nameLink.textContent)) {
                        nameLink.textContent = nameLink.textContent.replace(/\s*\((&#218;j|Új)\)/i, '');
                        hasNewFlag = true;
                    }

                    nameCell.childNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE && (/\(Új\)/i.test(node.textContent) || /\(&#218;j\)/i.test(node.textContent))) {
                            node.textContent = node.textContent.replace(/\s*\((&#218;j|Új)\)/i, '');
                            hasNewFlag = true;
                        } else if (node.nodeType === Node.ELEMENT_NODE && (/\(Új\)/i.test(node.textContent) || /\(&#218;j\)/i.test(node.textContent)) && !node.classList.contains('bh-badges-bottom-row')) {
                            node.textContent = node.textContent.replace(/\s*\((&#218;j|Új)\)/i, '');
                            hasNewFlag = true;
                        }
                    });

                    // Cím sor átalakítása flex konténerré
                    if (!nameLink.parentNode.classList.contains('bh-title-container')) {
                        const titleWrapper = document.createElement('div');
                        titleWrapper.className = 'bh-title-container';
                        nameLink.parentNode.insertBefore(titleWrapper, nameLink);
                        titleWrapper.appendChild(nameLink);

                        if (hasNewFlag) {
                            const newBadge = document.createElement('span');
                            newBadge.className = 'bh-badge new-tag';
                            newBadge.innerHTML = '&#218;J';
                            titleWrapper.appendChild(newBadge);
                        }
                    }
                }

                // --- 7/C: MÁSODIK SOR BADGE-ELÉSE & KÖZÉPRE IGAZÍTÁSA ---
                const secondRowDiv = nameCell.querySelector('div:not(.bh-badges-bottom-row):not(.bh-title-container)');
                if (secondRowDiv && !secondRowDiv.getAttribute('data-bh-badged')) {
                    secondRowDiv.setAttribute('data-bh-badged', 'true');
                    secondRowDiv.classList.add('bh-second-row');

                    // 1. Info (i) gomb
                    const infoLink = secondRowDiv.querySelector('a img.Sblue-cover_icon')?.closest('a');
                    if (infoLink) {
                        infoLink.className = 'bh-badge bh-info-badge';
                        infoLink.innerHTML = 'i';
                        infoLink.title = infoLink.title || 'Információ / Borító';
                    }

                    // 2. Trailer gomb 🎬
                    const trailerLink = secondRowDiv.querySelector('a img.Sblue-movie_icon')?.closest('a');
                    if (trailerLink) {
                        trailerLink.className = 'bh-badge bh-trailer-badge';
                        trailerLink.innerHTML = '🎬';
                        trailerLink.title = 'Előzetes megtekintése';
                    }

                    // 3. IMDb link
                    const imdbLink = secondRowDiv.querySelector('a[href*="imdb.com"]');
                    if (imdbLink) {
                        const match = imdbLink.textContent.match(/imdb:\s*([\d\.]+)/i);
                        const rating = match ? match[1] : '';
                        imdbLink.className = 'bh-badge bh-imdb-badge';
                        imdbLink.innerHTML = rating ? `IMDb ${rating}` : 'IMDb';
                    }

                    // 4. Műfajok
                    const genreSpan = secondRowDiv.querySelector('span');
                    if (genreSpan) {
                        const genreLinks = genreSpan.querySelectorAll('a');
                        genreLinks.forEach(gLink => {
                            gLink.className = 'bh-badge bh-genre-badge';
                        });

                        genreSpan.innerHTML = '';
                        genreLinks.forEach(gLink => genreSpan.appendChild(gLink));
                    }

                    // 5. További verziók gomb (+🠇)
                    const othersLink = secondRowDiv.querySelector('a img.Sblue-group_icon')?.closest('a') || secondRowDiv.querySelector('a[href*="others=1"]');

                    if (othersLink) {
                        othersLink.className = 'bh-badge bh-others-badge';
                        othersLink.innerHTML = '+🠇';

                        othersLink.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleSubReleases(this, row);
                        });
                    }

                    // Tisztítás
                    secondRowDiv.childNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            node.textContent = node.textContent.replace(/[()\[\]]/g, '').trim();
                        }
                    });
                }

                // --- 7/D: ALSÓ BADGE CSOPORT (Kategóriafüggő) ---
                if (!nameCell.querySelector('.bh-badges-bottom-row')) {
                    const text = nameLink.textContent;
                    const badgesContainer = document.createElement('div');
                    badgesContainer.className = 'bh-badges-bottom-row';

                    const group1 = document.createElement('div'); group1.className = 'bh-badge-group bh-badge-group-1';
                    const group2 = document.createElement('div'); group2.className = 'bh-badge-group bh-badge-group-2';
                    const group3 = document.createElement('div'); group3.className = 'bh-badge-group bh-badge-group-3';
                    const group4 = document.createElement('div'); group4.className = 'bh-badge-group bh-badge-group-4';
                    const group5 = document.createElement('div'); group5.className = 'bh-badge-group bh-badge-group-5';

                    if (isVideoCategory) {
                        // CSOPORT 1 (QTY)
                        const has2160p = text.includes('2160p') || text.includes('UHD') || text.includes('4K');
                        const has1080p = text.includes('1080p') || text.includes('1080i');
                        const has720p  = text.includes('720p');

                        if (has2160p) addBadge(group1, '4K', 'bh-badge res-2160p');
                        else if (has1080p) addBadge(group1, '1080p', 'bh-badge res-1080p');
                        else if (has720p) addBadge(group1, 'HD', 'bh-badge res-720p');
                        else addBadge(group1, 'SD', 'bh-badge res-sd');

                        if (text.includes('HDR')) addBadge(group1, 'HDR', 'bh-badge tech-hdr');
                        if (text.includes('DV.') || text.includes('DoVi') || text.includes('Dolby.Vision')) addBadge(group1, 'DoVi', 'bh-badge tech-dovi');
                        if (text.includes('Open.Matte') || text.includes('OpenMatte')) addBadge(group1, 'OpenMatte', 'bh-badge tech-codec');

                        // CSOPORT 2 (SND)
                        if (text.includes('Atmos')) addBadge(group2, 'Atmos', 'bh-badge tech-atmos');
                        else if (text.includes('DDP') || text.includes('DD+')) addBadge(group2, '5.1', 'bh-badge tech-audio');
                        else if (text.includes('DD2')) addBadge(group2, 'STEREO', 'bh-badge tech-audio');
                        else if (text.includes('DTS')) addBadge(group2, 'DTS', 'bh-badge tech-audio');
                        else if (text.includes('AAC')) addBadge(group2, 'AAC', 'bh-badge tech-audio');

                        if (text.includes('REMUX')) addBadge(group2, 'REMUX', 'bh-badge tech-remux');
                        if (text.includes('BluRay') || text.includes('Bluray') || text.includes('BDRip') || text.includes('BD-Rip')) addBadge(group2, 'BR', 'bh-badge src-bluray');
                        else if (text.includes('WEB-DL') || text.includes('WEBDL') || text.includes('WEB')) addBadge(group2, 'WEB-DL', 'bh-badge src-webdl');
                        else if (text.includes('DVDR') || text.includes('DVD9') || text.includes('DVD5') || text.includes('DVD-R')) addBadge(group2, 'DVD', 'bh-badge tech-dvd');

                        if (text.includes('x265') || text.includes('H.265') || text.includes('HEVC') || text.includes('H265')) addBadge(group2, 'x265', 'bh-badge tech-codec');
                        else if (text.includes('x264') || text.includes('H.264') || text.includes('H264')) addBadge(group2, 'x264', 'bh-badge tech-codec');

                        // CSOPORT 3 (LNG)
                        const isHun = text.includes('HUN') || text.includes('HuN') || text.includes('Hun') || text.includes('.HU.');
                        const isEng = text.includes('ENG') || text.includes('Eng') || text.includes('.EN.') || text.includes('English') || !isHun;

                        if (isHun) addBadge(group3, 'HUN', 'bh-badge lang-hun');
                        if (isEng) addBadge(group3, 'ENG', 'bh-badge lang-eng');

                        // CSOPORT 5 (SER)
                        const isSeriesMatch = text.match(/\b(?:S\d+(?:E\d+)?|E\d+)\b/i);
                        if (isSeriesMatch) {
                            addBadge(group5, 'SERIES', 'bh-badge series-tag');
                        }
                    }

                    // CSOPORT 4 (RLS - Minden kategóriánál)
                    const groupMatch = text.match(/-([A-Za-z0-9]+)$/);
                    if (groupMatch && groupMatch[1]) {
                        const grpBadge = addBadge(group4, groupMatch[1], 'bh-badge grp-tag');
                        grpBadge.title = `Kattints a(z) "${groupMatch[1]}" sz&#251;r&#233;s&#233;hez`;
                        grpBadge.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();

                            const searchInput = document.querySelector('#bh-search-input');
                            const clearBtn = document.querySelector('#bh-search-clear');
                            if (searchInput) {
                                searchInput.value = groupMatch[1];
                                searchQuery = groupMatch[1].toLowerCase().trim();
                                if (clearBtn) clearBtn.style.display = 'inline';
                                applyRowFiltering();
                                searchInput.focus();
                            }
                        });
                    }

                    if (group1.children.length > 0) badgesContainer.appendChild(group1);
                    if (group2.children.length > 0) badgesContainer.appendChild(group2);
                    if (group3.children.length > 0) badgesContainer.appendChild(group3);
                    if (group4.children.length > 0) badgesContainer.appendChild(group4);
                    if (group5.children.length > 0) badgesContainer.appendChild(group5);

                    if (badgesContainer.children.length > 0) {
                        nameCell.appendChild(badgesContainer);
                    }
                }
            }
        });
    }

    function addBadge(parent, label, className) {
        const span = document.createElement('span');
        span.className = className;
        span.innerHTML = label;
        parent.appendChild(span);
        return span;
    }

    function init() {
        const logoElem = document.getElementById('logoholderdiv');
        if (logoElem) {
            logoElem.style.display = 'none';
        }

        createFilterPanel();
        processTable();
        applyRowFiltering();
        applyBadgeVisibility();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();