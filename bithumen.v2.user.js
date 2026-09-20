// ==UserScript==
// @name         bithumen.be [quality&info badges + advanced live filters]
// @namespace    http://bithumen.be/
// @version      11.0
// @description  bithumen add-on
// @author       norti + Gemini AI/Claude AI
// @match        https://bithumen.be/browse.php*
// @match        https://bithumen.be/watchlist.php*
// @match        https://bithumen.net/browse.php*
// @match        https://bithumen.net/watchlist.php*
// @icon         https://bithumen.be/favicon.ico
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  /* =========================================================
   * 1. KATEGÓRIÁK
   * =======================================================*/
  const ALL_CATEGORIES = {
    23: "Film/Hun/SD",
    24: "Film/Hun/DVD-R",
    25: "Film/Hun/720p",
    37: "Film/Hun/1080p",
    33: "Film/Hun/Blu-ray",
    30: "XXX/SD",
    19: "Film/Eng/SD",
    20: "Film/Eng/DVD-R",
    5: "Film/Eng/720p",
    39: "Film/Eng/1080p",
    40: "Film/Eng/Blu-ray",
    34: "XXX/HD",
    7: "Sorozat/Hun/SD",
    41: "Sorozat/Hun/HD",
    26: "Sorozat/Eng/SD",
    42: "Sorozat/Eng/HD",
    28: "eBook/Hun",
    29: "eBook/Eng",
    9: "Mp3/Hun",
    35: "Lossless/Hun",
    1: "Programok/ISO",
    4: "Játékok/ISO",
    31: "Játékok/PS",
    36: "Játékok/Wii",
    6: "Mp3/Eng",
    38: "Lossless/Eng",
    22: "Programok/egyéb",
    21: "Játékok/Rip/Dox",
    32: "Játékok/Xbox360",
    27: "Klipek",
  };

  // Set = O(1) lookup (korábban Array.includes)
  const VIDEO_CATS = new Set([
    23, 24, 25, 37, 33, 30, 19, 20, 5, 39, 40, 34, 7, 41, 26, 42,
  ]);

  /* =========================================================
   * 2. SZÍNPALETTA (CSS generáláshoz – badge és gomb közös)
   * =======================================================*/
  const HUN_GRADIENT =
    "linear-gradient(to bottom, #ce2939 33%, #ffffff 33%, #ffffff 66%, #477050 66%)";

  // badge osztály -> [háttér, szöveg]
  const BADGE_COLORS = {
    "res-2160p": ["#d9534f", "#fff"],
    "res-1080p": ["#0275d8", "#fff"],
    "res-720p": ["#5cb85c", "#fff"],
    "res-sd": ["#6c757d", "#fff"],
    "tech-hdr": ["#f0ad4e", "#000"],
    "tech-dovi": ["#8e44ad", "#fff"],
    "tech-atmos": ["#17a2b8", "#fff"],
    "tech-audio": ["#4a69bd", "#fff"],
    "tech-codec": ["#343a40", "#fff"],
    "tech-remux": ["#e84118", "#fff"],
    "tech-dvd": ["#e67e22", "#fff"],
    "src-bluray": ["#6f42c1", "#fff"],
    "src-webdl": ["#20c997", "#fff"],
    "lang-eng": ["#ffffff", "#000"],
    "series-tag": ["#e84393", "#fff"],
  };

  // szűrőgomb "active" állapot -> [háttér, szöveg]
  const BTN_COLORS = {
    "res-2160p": ["#d9534f", "#fff"],
    "res-1080p": ["#0275d8", "#fff"],
    "res-720p": ["#5cb85c", "#fff"],
    "res-sd": ["#6c757d", "#fff"],
    "lang-eng": ["#ffffff", "#000"],
    "type-movie": ["#6c757d", "#fff"],
    "type-series": ["#e84393", "#fff"],
    "show-info": ["#ffffff", "#000"],
    "show-trailer": ["#343a40", "#fff"],
    "show-imdb": ["#f5c518", "#000"],
    "show-genre": ["#383838", "#fff"],
    "show-others": ["#17a2b8", "#000"],
    "show-row1": ["#17a2b8", "#fff"],
    "show-row2": ["#17a2b8", "#fff"],
    "show-row3": ["#17a2b8", "#fff"],
    "show-row4": ["#17a2b8", "#fff"],
    "show-ser": ["#e84393", "#fff"],
  };

  const genRules = (map, tpl) =>
    Object.keys(map)
      .map((k) => tpl(k, map[k][0], map[k][1]))
      .join("\n");

  /* =========================================================
   * 3. STÍLUSOK
   * =======================================================*/
  const customCSS = `
#logoholderdiv { display: none !important; }
td.colhead { color: #fff !important; }
a:link, a:visited { color: #fff !important; }

#torrenttable td[align="left"] {
    padding-top: 8px !important; padding-bottom: 8px !important; line-height: 1.4 !important;
}

/* ---- Szűrő panel ---- */
#bh-filter-panel {
    background-color: #1a1a1a; border: 1px solid #333; border-radius: 6px;
    padding: 10px 15px; margin: 10px auto; max-width: 950px; color: #ccc;
    font-family: sans-serif; font-size: 12px; box-shadow: 0 2px 6px rgba(0,0,0,.4);
    text-align: left; display: flex; flex-direction: column; gap: 8px;
}
.bh-panel-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; width: 100%; }
.bh-panel-row strong { color: #fff; margin-right: 4px; min-width: 75px; }

.bh-filter-btn, #bh-reset-btn {
    border: 1px solid #444; color: #fff; padding: 3px 8px; border-radius: 3px;
    cursor: pointer; font-size: 11px; font-weight: bold; transition: all .2s ease; user-select: none;
}
.bh-filter-btn { opacity: .4; filter: grayscale(50%); background-color: #2a2a2a; }
.bh-filter-btn:hover { opacity: .8; filter: grayscale(0); border-color: #888; }
.bh-filter-btn.active {
    opacity: 1; filter: grayscale(0); border-color: rgba(255,255,255,.6);
    box-shadow: 0 1px 3px rgba(0,0,0,.4);
}
#bh-reset-btn { background-color: #d9534f; border-color: #be1400; margin-left: auto; }
#bh-reset-btn:hover { background-color: #be1400; }

${genRules(
  BTN_COLORS,
  (k, bg, c) =>
    `.btn-${k}.active { background-color: ${bg} !important; color: ${c} !important; }`,
)}
.btn-lang-hun.active {
    background: ${HUN_GRADIENT} !important; color: #000 !important; text-shadow: 0 0 2px #fff;
}

/* ---- Kereső ---- */
.bh-search-row {
    display: flex; align-items: center; gap: 8px; margin-top: 2px;
    padding-top: 6px; border-top: 1px solid #2a2a2a;
}
.bh-search-wrapper { position: relative; display: inline-flex; align-items: center; }
#bh-search-input {
    background-color: #111; border: 1px solid #444; color: #fff;
    padding: 3px 22px 3px 8px; border-radius: 3px; font-size: 11px; outline: none; width: 180px;
}
#bh-search-input:focus { border-color: #0275d8; }
#bh-search-clear {
    position: absolute; right: 5px; color: #888; cursor: pointer; font-weight: bold;
    font-size: 13px; line-height: 1; display: none; user-select: none;
}
#bh-search-clear:hover { color: #fff; }
#bh-count-display { font-size: 11px; color: #888; font-weight: bold; }

/* ---- Badge alap ---- */
.bh-badge {
    display: inline-flex !important; align-items: center !important; justify-content: center !important;
    padding: 1px 5px !important; font-size: 9px !important; font-weight: bold !important;
    color: #fff !important; border-radius: 3px !important; margin: 0 !important;
    vertical-align: middle !important; letter-spacing: .3px !important;
    box-shadow: 0 1px 2px rgba(0,0,0,.2) !important; line-height: 12px !important;
    text-transform: uppercase; text-decoration: none !important; box-sizing: border-box !important;
}
.bh-hide-original, .bh-badge.bh-hidden { display: none !important; }

/* ---- Sorok / konténerek ---- */
.bh-title-container {
    display: flex !important; align-items: center !important;
    justify-content: space-between !important; width: 100% !important; gap: 6px !important;
}
.bh-second-row {
    display: flex !important; align-items: center !important; flex-wrap: wrap !important;
    gap: 4px !important; width: 100% !important; margin-top: 3px !important;
}
.bh-badges-bottom-row {
    display: flex; flex-wrap: wrap; gap: 2px; width: 100%; margin-top: 4px; line-height: 1;
}
.bh-badge-group { display: inline-flex; gap: 2px; }
.bh-genre-badge-wrapper { display: inline-flex; gap: 4px; }

/* ---- Műveletek oszlop ---- */
.bh-action-cell {
    text-align: center !important; white-space: nowrap !important;
    vertical-align: middle !important; padding: 4px 6px !important;
}
.bh-action-container {
    display: inline-flex !important; align-items: center !important;
    justify-content: center !important; gap: 3px !important;
}

/* ---- Egyedi badge-ek ---- */
.new-tag { background-color: #be1400 !important; margin-left: auto !important; flex-shrink: 0 !important; }
.dl-badge { background-color: #0275d8 !important; cursor: pointer; }
.dl-badge:hover { background-color: #025aa5 !important; }
.rss-badge { background-color: #fd7e14 !important; cursor: pointer; user-select: none; }
.rss-badge:hover { background-color: #e36d0c !important; }
.rss-badge.rss-added { background-color: #28a745 !important; }
.rss-badge.rss-added:hover { background-color: #218838 !important; }
.rss-badge.rss-removed { background-color: #dc3545 !important; }
.rss-badge.rss-removed:hover { background-color: #c82333 !important; }

a.bh-info-badge, a.bh-info-badge:link, a.bh-info-badge:visited {
    background-color: #fff !important; color: #000 !important;
    font-family: Georgia, serif !important; font-style: italic !important;
    font-weight: bold !important; font-size: 11px !important;
    width: 16px !important; height: 16px !important; padding: 0 !important;
    text-transform: lowercase !important;
}
a.bh-info-badge:hover { background-color: #ddd !important; color: #000 !important; }

a.bh-trailer-badge, a.bh-trailer-badge:link, a.bh-trailer-badge:visited {
    background-color: #343a40 !important; color: #fff !important; font-size: 10px !important;
    width: 16px !important; height: 16px !important; padding: 0 !important;
}
a.bh-trailer-badge:hover { background-color: #495057 !important; }

a.bh-imdb-badge, a.bh-imdb-badge:link, a.bh-imdb-badge:visited {
    background-color: #f5c518 !important; color: #000 !important; font-weight: 900 !important;
    padding: 1px 5px !important; letter-spacing: 0 !important; height: 16px !important;
}
a.bh-imdb-badge:hover { background-color: #e2b616 !important; color: #000 !important; }

a.bh-genre-badge, a.bh-genre-badge:link, a.bh-genre-badge:visited {
    background-color: #383838 !important; color: #e0e0e0 !important; font-weight: normal !important;
    font-size: 8px !important; text-transform: lowercase !important;
    padding: 1px 4px !important; height: 14px !important;
}
a.bh-genre-badge:hover { background-color: #4a4a4a !important; color: #fff !important; }

a.bh-others-badge, a.bh-others-badge:link, a.bh-others-badge:visited {
    background-color: #17a2b8 !important; color: #000 !important; font-size: 10px !important;
    font-weight: bold !important; padding: 1px 6px !important; height: 16px !important;
    cursor: pointer; margin-left: auto !important; flex-shrink: 0 !important;
}
a.bh-others-badge:hover { background-color: #138496 !important; color: #000 !important; }

${genRules(
  BADGE_COLORS,
  (k, bg, c) =>
    `.${k} { background-color: ${bg} !important; color: ${c} !important; }`,
)}
.lang-hun {
    background: ${HUN_GRADIENT} !important; color: #111 !important;
    text-shadow: 0 0 2px #fff, 0 0 1px #fff !important;
}
.grp-tag { background-color: #495057 !important; cursor: pointer !important; transition: transform .1s ease; }
.grp-tag:hover { background-color: #6c757d !important; transform: scale(1.05); }

/* ---- További verziók doboz ---- */
.bh-subreleases-row { background-color: #121212 !important; }
.bh-subreleases-container {
    padding: 8px 12px !important; background-color: #181818 !important;
    border: 1px dashed #444 !important; border-radius: 4px !important;
    margin: 4px 10px 8px !important; overflow-x: auto;
}
.bh-subreleases-table { width: 100% !important; border-collapse: collapse !important; font-size: 11px !important; }
.bh-subreleases-table td, .bh-subreleases-table th {
    padding: 5px 8px !important; border-bottom: 1px solid #282828 !important; vertical-align: middle !important;
}
.bh-subreleases-loading { color: #17a2b8; font-weight: bold; font-size: 11px; padding: 6px; }
.bh-error { color: #d9534f; padding: 4px; }

/* ---- Badge láthatóság: 1 osztály a <html>-en, nem elemenkénti ciklus ---- */
.bh-hide-info    .bh-info-badge,
.bh-hide-trailer .bh-trailer-badge,
.bh-hide-imdb    .bh-imdb-badge,
.bh-hide-others  .bh-others-badge,
.bh-hide-genre   .bh-genre-badge-wrapper,
.bh-hide-row1    .bh-badge-group-1,
.bh-hide-row2    .bh-badge-group-2,
.bh-hide-row3    .bh-badge-group-3,
.bh-hide-row4    .bh-badge-group-4,
.bh-hide-ser     .bh-badge-group-5 { display: none !important; }
`;

  const styleNode = document.createElement("style");
  styleNode.textContent = customCSS;
  (document.head || document.documentElement).appendChild(styleNode);

  /* =========================================================
   * 4. ÁLLAPOT (localStorage)
   * =======================================================*/
  const STORAGE_KEY = "bh_quality_filters";
  const DEFAULT_FILTERS = {
    "res-2160p": true,
    "res-1080p": true,
    "res-720p": true,
    "res-sd": true,
    "lang-hun": true,
    "lang-eng": true,
    "type-movie": true,
    "type-series": true,
    "show-info": true,
    "show-trailer": true,
    "show-imdb": true,
    "show-genre": true,
    "show-others": true,
    "show-row1": true,
    "show-row2": true,
    "show-row3": true,
    "show-row4": true,
    "show-ser": true,
  };

  // Melyik "show-" kapcsoló melyik root-osztályt vezérli
  const VISIBILITY_CLASSES = {
    "show-info": "bh-hide-info",
    "show-trailer": "bh-hide-trailer",
    "show-imdb": "bh-hide-imdb",
    "show-genre": "bh-hide-genre",
    "show-others": "bh-hide-others",
    "show-row1": "bh-hide-row1",
    "show-row2": "bh-hide-row2",
    "show-row3": "bh-hide-row3",
    "show-row4": "bh-hide-row4",
    "show-ser": "bh-hide-ser",
  };

  function loadFilters() {
    try {
      return Object.assign(
        {},
        DEFAULT_FILTERS,
        JSON.parse(localStorage.getItem(STORAGE_KEY)) || {},
      );
    } catch (e) {
      return Object.assign({}, DEFAULT_FILTERS);
    }
  }

  let activeFilters = loadFilters();
  let searchQuery = "";

  const saveFilters = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeFilters));
    } catch (e) {
      /* ignore */
    }
  };

  /* =========================================================
   * 5. SEGÉDFÜGGVÉNYEK
   * =======================================================*/
  const RE_CAT = /cat=(\d+)/;
  const RE_ID = /id=(\d+)/;
  const RE_HUN = /(?:\.|\b)(?:HUN|HU)(?:\.|\b|-)/i;
  const RE_ENG = /(?:\.|\b)(?:ENG|EN|ENGLISH)(?:\.|\b|-)/i;
  const RE_SERIES = /\b(?:S\d+(?:E\d+)?|E\d+)\b/i;
  const RE_GROUP = /-([A-Za-z0-9]+)(?:\s|\(|$)/;
  const RE_IMDB = /imdb:\s*([\d.]+)/i;
  const RE_NEW = /\s*\(\s*(?:Új|&#218;j)\s*\)/i;
  const RE_BRACKETS = /[()[\]]/g;

  function getCategoryIdFromRow(row) {
    const catLink = row.querySelector('a[href*="cat="]');
    if (!catLink) return null;
    const m = RE_CAT.exec(catLink.href);
    return m ? parseInt(m[1], 10) : null;
  }

  function detectLanguage(text, catId) {
    let isHun = RE_HUN.test(text);
    let isEng = RE_ENG.test(text);
    if (!isHun && !isEng) {
      const catName = ALL_CATEGORIES[catId] || "";
      if (catName.includes("/Hun") || catName.includes("Hun/")) isHun = true;
      else if (catName.includes("/Eng") || catName.includes("Eng/"))
        isEng = true;
    }
    return { isHun, isEng };
  }

  function addBadge(parent, label, className) {
    const span = document.createElement("span");
    span.className = "bh-badge " + className;
    span.textContent = label;
    parent.appendChild(span);
    return span;
  }

  const has = (T, ...tokens) => tokens.some((t) => T.includes(t));

  /* =========================================================
   * 6. BADGE GENERÁLÁS (fő- és altáblázat közös motorja)
   * =======================================================*/
  function buildBadges(nameCell, text, catId, isVideoCategory) {
    const container = document.createElement("div");
    container.className = "bh-badges-bottom-row";
    const meta = { res: "res-sd", series: false, hun: false, eng: false };

    const mkGroup = (n) => {
      const d = document.createElement("div");
      d.className = "bh-badge-group bh-badge-group-" + n;
      return d;
    };
    const g1 = mkGroup(1),
      g2 = mkGroup(2),
      g3 = mkGroup(3),
      g4 = mkGroup(4),
      g5 = mkGroup(5);

    if (isVideoCategory) {
      const T = text.toUpperCase();

      /* --- 1. csoport: felbontás + képtechnológia --- */
      if (has(T, "2160P", "4K")) meta.res = "res-2160p";
      else if (has(T, "1080P", "1080I")) meta.res = "res-1080p";
      else if (T.includes("720P")) meta.res = "res-720p";
      addBadge(
        g1,
        {
          "res-2160p": "4K",
          "res-1080p": "1080p",
          "res-720p": "HD",
          "res-sd": "SD",
        }[meta.res],
        meta.res,
      );

      if (T.includes("HDR")) addBadge(g1, "HDR", "tech-hdr");
      if (has(T, "DV.", "DOVI", "DOLBY.VISION"))
        addBadge(g1, "DoVi", "tech-dovi");
      if (has(T, "OPEN.MATTE", "OPENMATTE"))
        addBadge(g1, "OpenMatte", "tech-codec");

      /* --- 2. csoport: hang, forrás, kodek --- */
      if (T.includes("ATMOS")) addBadge(g2, "Atmos", "tech-atmos");
      else if (has(T, "DDP", "DD+", "DD5")) addBadge(g2, "5.1", "tech-audio");
      else if (has(T, "DD2", "2.0")) addBadge(g2, "STEREO", "tech-audio");
      else if (T.includes("DTS")) addBadge(g2, "DTS", "tech-audio");
      else if (T.includes("AAC")) addBadge(g2, "AAC", "tech-audio");

      if (T.includes("REMUX")) addBadge(g2, "REMUX", "tech-remux");

      if (has(T, "BLURAY", "BDRIP", "BD-RIP")) addBadge(g2, "BR", "src-bluray");
      else if (has(T, "WEB-DL", "WEBDL", "WEB"))
        addBadge(g2, "WEB-DL", "src-webdl");
      else if (has(T, "DVDR", "DVD9", "DVD5", "DVD-R", "DVD"))
        addBadge(g2, "DVD", "tech-dvd");

      if (has(T, "X265", "H.265", "HEVC", "H265"))
        addBadge(g2, "x265", "tech-codec");
      else if (has(T, "X264", "H.264", "H264"))
        addBadge(g2, "x264", "tech-codec");

      /* --- 3. csoport: nyelv --- */
      const lang = detectLanguage(text, catId);
      meta.hun = lang.isHun;
      meta.eng = lang.isEng;
      if (lang.isHun) addBadge(g3, "HUN", "lang-hun");
      if (lang.isEng) addBadge(g3, "ENG", "lang-eng");

      /* --- 5. csoport: sorozat --- */
      if (RE_SERIES.test(text)) {
        meta.series = true;
        addBadge(g5, "SERIES", "series-tag");
      }
    }

    /* --- 4. csoport: release group (minden kategóriánál) --- */
    const grpMatch = RE_GROUP.exec(text);
    if (grpMatch && grpMatch[1]) {
      const b = addBadge(g4, grpMatch[1], "grp-tag");
      b.dataset.group = grpMatch[1];
      b.title = `Kattints a(z) "${grpMatch[1]}" szűréshez`;
    }

    [g1, g2, g3, g4, g5].forEach((g) => {
      if (g.children.length) container.appendChild(g);
    });
    if (container.children.length) nameCell.appendChild(container);

    return meta;
  }

  /* =========================================================
   * 7. SZŰRŐ PANEL
   * =======================================================*/
  const FILTER_BUTTONS = [
    [
      "Szűrés:",
      [
        ["res-2160p", "4K | 2160p", ""],
        ["res-1080p", "FHD | 1080p", ""],
        ["res-720p", "HD | 720p", ""],
        ["res-sd", "SD | 480p", ""],
        ["lang-hun", "HUN", ""],
        ["lang-eng", "ENG", ""],
        ["type-movie", "Film", ""],
        ["type-series", "Sorozat", ""],
      ],
      true,
    ],
    [
      "Infosáv:",
      [
        ["show-info", "i", "Info / Borító"],
        ["show-trailer", "🎬", "Trailer"],
        ["show-imdb", "IMDb", "IMDb értékelés"],
        ["show-genre", "Műfaj", "Műfajok"],
        ["show-others", "+", "További verziók"],
      ],
      false,
    ],
    [
      "Címkék:",
      [
        ["show-row1", "Felbontás", "Felbontás"],
        ["show-row2", "Info", "Audio+codec info"],
        ["show-row3", "Nyelv", "Nyelv"],
        ["show-row4", "RLSGRP", "Release Csoport"],
        ["show-ser", "Sorozat", "Series badge"],
      ],
      false,
    ],
  ];

  let searchInput = null,
    clearBtn = null,
    countDisplay = null;

  function createFilterPanel() {
    const target =
      document.querySelector("#lsForm") || document.querySelector("#maintd");
    if (!target || document.querySelector("#bh-filter-panel")) return;

    const rowsHtml = FILTER_BUTTONS.map(
      ([label, btns, withReset]) => `
            <div class="bh-panel-row">
                <strong>${label}</strong>
                ${btns
                  .map(
                    ([key, text, title]) =>
                      `<button class="bh-filter-btn btn-${key}${activeFilters[key] ? " active" : ""}" data-filter="${key}"${title ? ` title="${title}"` : ""}>${text}</button>`,
                  )
                  .join("")}
                ${withReset ? '<button id="bh-reset-btn" title="Szűrők alaphelyzetbe állítása">↺</button>' : ""}
            </div>`,
    ).join("");

    const panel = document.createElement("div");
    panel.id = "bh-filter-panel";
    panel.innerHTML =
      rowsHtml +
      `
            <div class="bh-search-row">
                <strong>Élő szűrés:</strong>
                <div class="bh-search-wrapper">
                    <input type="text" id="bh-search-input" placeholder="Keresés a találatok között..." />
                    <span id="bh-search-clear" title="Törlés (ESC)">&times;</span>
                </div>
                <span id="bh-count-display"></span>
            </div>`;

    target.parentNode.insertBefore(panel, target.nextSibling);

    searchInput = panel.querySelector("#bh-search-input");
    clearBtn = panel.querySelector("#bh-search-clear");
    countDisplay = panel.querySelector("#bh-count-display");

    // Egyetlen delegált listener az összes gombra
    panel.addEventListener("click", (e) => {
      const btn = e.target.closest(
        ".bh-filter-btn, #bh-reset-btn, #bh-search-clear",
      );
      if (!btn) return;

      if (btn.id === "bh-search-clear") {
        clearSearch();
        return;
      }

      if (btn.id === "bh-reset-btn") {
        activeFilters = Object.assign({}, DEFAULT_FILTERS);
        saveFilters();
        panel
          .querySelectorAll(".bh-filter-btn")
          .forEach((b) =>
            b.classList.toggle("active", !!activeFilters[b.dataset.filter]),
          );
        searchInput.value = "";
        searchQuery = "";
        clearBtn.style.display = "none";
        applyRowFiltering();
        applyBadgeVisibility();
        return;
      }

      const key = btn.dataset.filter;
      activeFilters[key] = !activeFilters[key];
      btn.classList.toggle("active", activeFilters[key]);
      saveFilters();
      if (key.startsWith("show-")) applyBadgeVisibility();
      else applyRowFiltering();
    });

    // Élő keresés – debounce-olva, hogy gépelés közben ne fusson minden karakterre
    let debounceId = 0;
    searchInput.addEventListener("input", function () {
      const val = this.value.toLowerCase().trim();
      clearBtn.style.display = val ? "inline" : "none";
      clearTimeout(debounceId);
      debounceId = setTimeout(() => {
        searchQuery = val;
        applyRowFiltering();
      }, 120);
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") clearSearch();
    });
  }

  function clearSearch() {
    if (!searchInput) return;
    searchInput.value = "";
    searchQuery = "";
    clearBtn.style.display = "none";
    applyRowFiltering();
    searchInput.focus();
  }

  function setSearch(value) {
    if (!searchInput) return;
    searchInput.value = value;
    searchQuery = value.toLowerCase().trim();
    clearBtn.style.display = "inline";
    applyRowFiltering();
    searchInput.focus();
  }

  /* =========================================================
   * 8. SORSZŰRÉS – előre kiszámolt metaadatokkal
   * =======================================================*/
  // { row, video, res, series, hun, eng, text } – egyszer épül fel, a processTable-ben
  let rowCache = [];

  function applyRowFiltering() {
    const f = activeFilters;
    const videoFilterActive =
      !f["res-2160p"] ||
      !f["res-1080p"] ||
      !f["res-720p"] ||
      !f["res-sd"] ||
      !f["type-movie"] ||
      !f["type-series"];
    const noLang = !f["lang-hun"] && !f["lang-eng"];
    let visible = 0;

    for (let i = 0; i < rowCache.length; i++) {
      const d = rowCache[i];
      let show = true;

      if (videoFilterActive && !d.video) show = false;

      if (show && d.video) {
        if (!f[d.res]) show = false;
        else if (!f["type-series"] && d.series) show = false;
        else if (!f["type-movie"] && !d.series) show = false;
      }

      if (show && d.badged) {
        if (noLang) show = false;
        else if (!f["lang-hun"] && d.hun && !d.eng) show = false;
        else if (!f["lang-eng"] && d.eng && !d.hun) show = false;
      }

      if (show && searchQuery && !d.text.includes(searchQuery)) show = false;

      const display = show ? "" : "none";
      if (d.row.style.display !== display) d.row.style.display = display;

      const next = d.row.nextElementSibling;
      if (next && next.classList.contains("bh-subreleases-row")) {
        // Bezárt altáblázat maradjon bezárva szűrés után is
        const subDisplay =
          show && next.dataset.bhCollapsed !== "1" ? "" : "none";
        if (next.style.display !== subDisplay) next.style.display = subDisplay;
      }

      if (show) visible++;
    }

    if (countDisplay)
      countDisplay.textContent = `(${visible} / ${rowCache.length})`;
  }

  /* =========================================================
   * 9. BADGE LÁTHATÓSÁG – osztályváltás a <html>-en
   * =======================================================*/
  function applyBadgeVisibility() {
    const root = document.documentElement;
    for (const key in VISIBILITY_CLASSES) {
      root.classList.toggle(VISIBILITY_CLASSES[key], !activeFilters[key]);
    }
  }

  /* =========================================================
   * 10. RSS TOGGLE
   * =======================================================*/
  function handleRSSToggle(badge, torrentId) {
    const action = badge.dataset.state === "added" ? "del" : "add";
    badge.textContent = "...";

    fetch(
      `/torrentmark.php?torrentid=${torrentId}&type=personalrss&json=1&action=${action}`,
      {
        method: "GET",
        headers: { Accept: "application/json, text/javascript, */*; q=0.01" },
      },
    )
      .then((r) => r.text())
      .then((text) => {
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = text;
        }

        const ok =
          (Array.isArray(data) && data[0] == 1) ||
          (typeof data === "string" && data.length > 0);
        if (!ok) {
          badge.textContent = "Hiba!";
          return;
        }

        const added = action === "add";
        badge.dataset.state = added ? "added" : "removed";
        badge.className =
          "bh-badge rss-badge " + (added ? "rss-added" : "rss-removed");
        badge.innerHTML = added ? "RSS &#10003;" : "RSS-";
        badge.title =
          Array.isArray(data) && data[1]
            ? data[1]
            : added
              ? "RSS-hez hozzáadva"
              : "RSS-ből eltávolítva";
      })
      .catch((err) => {
        console.error("RSS error:", err);
        badge.textContent = "Hiba!";
      });
  }

  function makeRssBadge(torrentId) {
    const b = document.createElement("span");
    b.className = "bh-badge rss-badge";
    b.textContent = "RSS+";
    b.title = "Egyéni RSS-hez adás";
    b.dataset.state = "initial";
    b.dataset.torrentId = torrentId;
    return b;
  }

  /* =========================================================
   * 11. TOVÁBBI VERZIÓK (altáblázat)
   * =======================================================*/
  function processSubTable(subTable, parentCatId) {
    subTable.className = "bh-subreleases-table";

    subTable.querySelectorAll("tr").forEach((row) => {
      const nameCell = row.querySelector('td[align="left"]') || row.children[1];
      if (!nameCell) return;

      const nameLink = nameCell.querySelector('a[href^="details.php"]');
      if (!nameLink) return;

      const catId = getCategoryIdFromRow(row) || parentCatId;
      const isVideo = catId ? VIDEO_CATS.has(catId) : true;
      const idMatch = RE_ID.exec(nameLink.href);
      const torrentId = idMatch ? idMatch[1] : null;

      nameCell.querySelectorAll("a").forEach((a) => {
        const href = a.getAttribute("href") || "";
        const img = a.querySelector("img");

        if (href.includes("download.php")) {
          a.className = "bh-badge dl-badge";
          a.textContent = "DL";
          a.title = "Letöltés";
        } else if (
          torrentId &&
          (href.includes("torrentmark.php") ||
            href.includes("personalrss") ||
            (img && img.alt && img.alt.toLowerCase().includes("rss")))
        ) {
          a.parentNode.replaceChild(makeRssBadge(torrentId), a);
        }
      });

      if (!nameCell.querySelector(".bh-badges-bottom-row")) {
        buildBadges(nameCell, nameLink.textContent, catId, isVideo);
      }
    });
  }

  function toggleSubReleases(othersLink, parentRow) {
    let subRow = parentRow.nextElementSibling;

    if (subRow && subRow.classList.contains("bh-subreleases-row")) {
      // A nyitott/zárt állapotot dataset tartja számon, nem a style.display,
      // mert azt a sorszűrés is átírhatja.
      const collapsed = subRow.dataset.bhCollapsed === "1";
      if (collapsed) delete subRow.dataset.bhCollapsed;
      else subRow.dataset.bhCollapsed = "1";
      subRow.style.display = collapsed ? "" : "none";
      othersLink.textContent = collapsed ? "-" : "+";
      return;
    }

    subRow = document.createElement("tr");
    subRow.className = "bh-subreleases-row";

    const subTd = document.createElement("td");
    subTd.colSpan = parentRow.children.length;
    subTd.className = "clear";

    const container = document.createElement("div");
    container.className = "bh-subreleases-container";
    container.innerHTML =
      '<div class="bh-subreleases-loading">További verziók betöltése...</div>';

    subTd.appendChild(container);
    subRow.appendChild(subTd);
    parentRow.parentNode.insertBefore(subRow, parentRow.nextSibling);

    othersLink.textContent = "-";
    const parentCatId = getCategoryIdFromRow(parentRow);

    fetch(othersLink.href)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const doc = new DOMParser().parseFromString(
          new TextDecoder("iso-8859-2").decode(buffer),
          "text/html",
        );

        let subTable = null;
        const tables = doc.querySelectorAll("table");
        for (let i = tables.length - 1; i >= 0; i--) {
          const txt = tables[i].textContent;
          if (
            txt.includes("Típus") &&
            txt.includes("Név") &&
            txt.includes("Méret") &&
            txt.includes("Seed")
          ) {
            subTable = tables[i];
            break;
          }
        }

        if (subTable) {
          processSubTable(subTable, parentCatId);
          container.textContent = "";
          container.appendChild(subTable);
        } else {
          container.innerHTML =
            '<div class="bh-error">Nem találhatók további verziók ezen a linken.</div>';
        }
      })
      .catch((err) => {
        console.error("Sub-releases load error:", err);
        container.innerHTML =
          '<div class="bh-error">Hiba történt a verziók betöltése közben.</div>';
      });
  }

  /* =========================================================
   * 12. TÁBLÁZAT FELDOLGOZÁSA
   * =======================================================*/
  function stripNewFlag(cell) {
    // A "(Új)" jelölés több szövegcsomóra is széteshet – pl. "(<font>Új</font>)" –,
    // ezért a cella teljes szövegén keresünk, és az illeszkedő tartományt
    // vágjuk ki a érintett csomókból.
    const nodes = [];
    let full = "";
    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      nodes.push({ node: n, start: full.length });
      full += n.textContent;
    }

    const m = RE_NEW.exec(full);
    if (!m) return false;

    const from = m.index,
      to = m.index + m[0].length;
    const parents = new Set();

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i].node,
        start = nodes[i].start;
      const txt = node.textContent;
      const end = start + txt.length;
      if (end <= from || start >= to) continue;

      const a = Math.max(from - start, 0);
      const b = Math.min(to - start, txt.length);
      node.textContent = txt.slice(0, a) + txt.slice(b);
      if (node.parentNode && node.parentNode !== cell)
        parents.add(node.parentNode);
    }

    // Üresen maradt segédelemek (pl. <font color=red>) eltávolítása
    parents.forEach((p) => {
      if (p !== cell && !p.querySelector("*") && !p.textContent.trim())
        p.remove();
    });

    return true;
  }

  function processTable() {
    const table = document.querySelector("#torrenttable");
    if (!table) return;

    /* --- Fejléc: Letöltés oszlop --- */
    const headerRow = table.querySelector("tr");
    if (
      headerRow &&
      !headerRow.querySelector(".bh-action-th") &&
      headerRow.querySelector("td.colhead")
    ) {
      const th = document.createElement("td");
      th.className = "colhead bh-action-th";
      th.textContent = "Letöltés";
      th.title = "Torrent letöltése/hozzáadás saját RSS-hez";
      const cells = headerRow.querySelectorAll("td");
      if (cells.length > 2) headerRow.insertBefore(th, cells[2]);
      else headerRow.appendChild(th);
    }

    rowCache = [];

    // table.rows = csak a saját sorai (a beágyazott altáblázatok sorai nélkül)
    Array.prototype.forEach.call(table.rows, (row) => {
      if (
        row.querySelector("td.colhead") ||
        row.classList.contains("bh-subreleases-row")
      )
        return;

      const nameCell = row.querySelector('td[align="left"]');
      const nameLink =
        nameCell && nameCell.querySelector('a[href^="details.php"]');
      if (!nameLink) return;

      const idMatch = RE_ID.exec(nameLink.href);
      const torrentId = idMatch ? idMatch[1] : null;
      const catId = getCategoryIdFromRow(row);
      const isVideo = catId ? VIDEO_CATS.has(catId) : true;

      /* --- A: Műveletek cella (DL / RSS) --- */
      let actionCell = row.querySelector(".bh-action-cell");
      if (!actionCell) {
        actionCell = document.createElement("td");
        actionCell.className = "bh-action-cell";
        const box = document.createElement("div");
        box.className = "bh-action-container";
        actionCell.appendChild(box);

        const cells = row.querySelectorAll("td");
        if (cells.length > 2) row.insertBefore(actionCell, cells[2]);
        else row.appendChild(actionCell);
      }

      const box = actionCell.firstElementChild;
      nameCell.querySelectorAll("a").forEach((a) => {
        const href = a.getAttribute("href") || "";
        const img = a.querySelector("img");

        if (href.includes("download.php")) {
          if (!box.querySelector(".dl-badge")) {
            const dl = document.createElement("a");
            dl.href = href;
            dl.className = "bh-badge dl-badge";
            dl.textContent = "DL";
            dl.title = "Letöltés";
            box.appendChild(dl);
          }
          a.classList.add("bh-hide-original");
        } else if (
          href.includes("torrentmark.php") ||
          href.includes("personalrss") ||
          (img && img.alt && img.alt.toLowerCase().includes("rss"))
        ) {
          if (torrentId && !box.querySelector(".rss-badge"))
            box.appendChild(makeRssBadge(torrentId));
          a.classList.add("bh-hide-original");
        }
      });

      /* --- B: ÚJ badge jobbra igazítva --- */
      if (!nameCell.querySelector(".new-tag")) {
        const hasNew = stripNewFlag(nameCell);
        if (!nameLink.parentNode.classList.contains("bh-title-container")) {
          const wrap = document.createElement("div");
          wrap.className = "bh-title-container";
          nameLink.parentNode.insertBefore(wrap, nameLink);
          wrap.appendChild(nameLink);
          if (hasNew) {
            const nb = document.createElement("span");
            nb.className = "bh-badge new-tag";
            nb.textContent = "ÚJ";
            wrap.appendChild(nb);
          }
        }
      }

      /* --- C: Infosáv (második sor) --- */
      const secondRow = nameCell.querySelector(
        "div:not(.bh-badges-bottom-row):not(.bh-title-container)",
      );
      if (secondRow && !secondRow.dataset.bhBadged) {
        secondRow.dataset.bhBadged = "1";
        secondRow.classList.add("bh-second-row");

        secondRow.querySelectorAll("a").forEach((link) => {
          const href = link.href || "";
          const img = link.querySelector("img");
          const src = img ? img.src : "";
          const cls = img ? img.className : "";

          if (
            href.includes("port.hu") ||
            href.includes("themoviedb.org") ||
            src.includes("cover") ||
            cls.includes("Sblue-cover_icon")
          ) {
            link.classList.add("bh-badge", "bh-info-badge");
            link.textContent = "i";
            link.title = link.title || "Információ / Borító";
          } else if (
            href.includes("youtube.com") ||
            href.includes("youtu.be") ||
            src.includes("movie") ||
            cls.includes("Sblue-movie_icon")
          ) {
            link.classList.add("bh-badge", "bh-trailer-badge");
            link.textContent = "🎬";
            link.title = "Előzetes megtekintése";
          } else if (href.includes("imdb.com")) {
            const m = RE_IMDB.exec(link.textContent);
            link.classList.add("bh-badge", "bh-imdb-badge");
            link.textContent = m ? `IMDb ${m[1]}` : "IMDb";
          } else if (
            href.includes("others=1") ||
            src.includes("group") ||
            cls.includes("Sblue-group_icon")
          ) {
            link.classList.add("bh-badge", "bh-others-badge");
            link.textContent = "+";
          }
        });

        const genreSpan = secondRow.querySelector("span");
        if (genreSpan) {
          genreSpan.classList.add("bh-genre-badge-wrapper");
          const gLinks = genreSpan.querySelectorAll("a");
          gLinks.forEach((a) => a.classList.add("bh-badge", "bh-genre-badge"));
          // csak a linkek maradnak (vesszők / szóközök törlése)
          genreSpan.textContent = "";
          gLinks.forEach((a) => genreSpan.appendChild(a));
        }

        secondRow.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = node.textContent.replace(RE_BRACKETS, "").trim();
          }
        });
      }

      /* --- D: Alsó badge csoportok --- */
      let meta;
      if (!nameCell.querySelector(".bh-badges-bottom-row")) {
        meta = buildBadges(nameCell, nameLink.textContent, catId, isVideo);
      } else {
        meta = { res: "res-sd", series: false, hun: false, eng: false };
      }

      /* --- Szűréshez szükséges adatok gyorsítótárazása --- */
      rowCache.push({
        row,
        video: isVideo,
        res: meta.res,
        series: meta.series,
        hun: meta.hun,
        eng: meta.eng,
        badged: !!nameCell.querySelector(".bh-badges-bottom-row"),
        text: row.textContent.toLowerCase(),
      });
    });
  }

  /* =========================================================
   * 13. DELEGÁLT KATTINTÁSKEZELÉS (soronkénti listenerek helyett)
   * =======================================================*/
  function bindTableEvents(table) {
    table.addEventListener("click", (e) => {
      const target = e.target.closest(".bh-others-badge, .grp-tag, .rss-badge");
      if (!target) return;

      if (target.classList.contains("bh-others-badge")) {
        e.preventDefault();
        e.stopPropagation();
        const row = target.closest("tr");
        if (row) toggleSubReleases(target, row);
      } else if (target.classList.contains("grp-tag")) {
        e.preventDefault();
        e.stopPropagation();
        setSearch(target.dataset.group || target.textContent);
      } else if (target.classList.contains("rss-badge")) {
        e.preventDefault();
        e.stopPropagation();
        if (target.dataset.torrentId)
          handleRSSToggle(target, target.dataset.torrentId);
      }
    });
  }

  /* =========================================================
   * 14. INDÍTÁS
   * =======================================================*/
  function init() {
    applyBadgeVisibility(); // még a rajzolás előtt, hogy ne villanjon
    createFilterPanel();
    processTable();
    applyRowFiltering();

    const table = document.querySelector("#torrenttable");
    if (table) bindTableEvents(table);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
