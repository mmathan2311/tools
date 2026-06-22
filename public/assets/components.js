/* =========================================================
   components.js — shared header, footer, nav, theme, search
   Injected on every page. Single source of truth for the
   tool registry so nav, footer and homepage stay in sync.
   ========================================================= */
(function () {
  "use strict";

  var SITE = {
    name: "ToolKit",
    domain: "tools.ifscpincode.in",
    tagline: "Free online tools & calculators"
  };

  // ---- Tool registry (single source of truth) ----
  var CATS = {
    finance: { label: "Finance", icon: "₹", cls: "cat-finance" },
    health:  { label: "Health", icon: "❤", cls: "cat-health" },
    text:    { label: "Text Tools", icon: "✎", cls: "cat-text" },
    dev:     { label: "Developer", icon: "{ }", cls: "cat-dev" },
    util:    { label: "Utilities", icon: "⚙", cls: "cat-util" }
  };

  var TOOLS = [
    // Finance
    { id:"emi-calculator", cat:"finance", icon:"🏦", name:"EMI Calculator", desc:"Monthly EMI, total interest and amortization schedule with chart and CSV export." },
    { id:"gst-calculator", cat:"finance", icon:"🧾", name:"GST Calculator", desc:"Add or remove GST with CGST/SGST or IGST split. Reverse calculation supported." },
    { id:"sip-calculator", cat:"finance", icon:"📈", name:"SIP Calculator", desc:"Project mutual-fund SIP returns and visualise wealth growth over time." },
    { id:"compound-interest-calculator", cat:"finance", icon:"💹", name:"Compound Interest", desc:"Grow your savings with compound interest across any frequency.", tag:"New" },
    { id:"discount-calculator", cat:"finance", icon:"🏷️", name:"Discount Calculator", desc:"Find sale price, savings and final amount after discount and tax.", tag:"New" },
    { id:"percentage-calculator", cat:"finance", icon:"％", name:"Percentage Calculator", desc:"Percentage of a number, increase/decrease and what-percent-of math." },
    // Health
    { id:"bmi-calculator", cat:"health", icon:"⚖️", name:"BMI Calculator", desc:"Body Mass Index with WHO category guidance for adults." },
    { id:"age-calculator", cat:"health", icon:"🎂", name:"Age Calculator", desc:"Exact age in years, months and days between any two dates." },
    // Text
    { id:"word-counter", cat:"text", icon:"📝", name:"Word Counter", desc:"Words, characters, sentences, paragraphs and reading time in real time." },
    { id:"character-counter", cat:"text", icon:"🔤", name:"Character Counter", desc:"Character counts plus frequency analysis for letters and digits." },
    { id:"case-converter", cat:"text", icon:"Aa", name:"Case Converter", desc:"Convert text to UPPER, lower, Title, Sentence, camelCase and more.", tag:"New" },
    { id:"lorem-ipsum", cat:"text", icon:"¶", name:"Lorem Ipsum Generator", desc:"Generate placeholder paragraphs, sentences or words instantly.", tag:"New" },
    // Developer
    { id:"json-formatter", cat:"dev", icon:"{ }", name:"JSON Formatter", desc:"Format, validate and explore JSON with a collapsible tree view." },
    { id:"xml-formatter", cat:"dev", icon:"</>", name:"XML Formatter", desc:"Beautify, minify and validate XML documents in the browser." },
    { id:"html-beautifier", cat:"dev", icon:"🖋️", name:"HTML Beautifier", desc:"Indent and tidy HTML, or minify it to shrink file size." },
    { id:"base64-encoder", cat:"dev", icon:"🔐", name:"Base64 Encoder", desc:"Encode text to Base64 and decode Base64 back to text safely." },
    { id:"url-encoder", cat:"dev", icon:"🔗", name:"URL Encoder", desc:"Percent-encode and decode URLs and query parameters." },
    { id:"uuid-generator", cat:"dev", icon:"🆔", name:"UUID Generator", desc:"Generate RFC-4122 v4 UUIDs singly or in batches up to 100." },
    { id:"hash-generator", cat:"dev", icon:"#️⃣", name:"Hash Generator", desc:"SHA-1, SHA-256, SHA-384 and SHA-512 hashes of any text.", tag:"New" },
    { id:"color-converter", cat:"dev", icon:"🎨", name:"Color Converter", desc:"Convert and preview colours across HEX, RGB and HSL.", tag:"New" },
    // Utilities
    { id:"stopwatch-timer", cat:"util", icon:"⏱️", name:"Stopwatch & Timer", desc:"Precise stopwatch and countdown timer with alerts." },
    { id:"password-generator", cat:"util", icon:"🔑", name:"Password Generator", desc:"Create strong, random passwords with full control over characters.", tag:"New" },
    { id:"qr-code-generator", cat:"util", icon:"🔳", name:"QR Code Generator", desc:"Turn any text, link or contact into a downloadable QR code.", tag:"New" }
  ];

  // expose for homepage
  window.SiteTools = { tools: TOOLS, cats: CATS, site: SITE };

  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }
  function path() { return location.pathname.replace(/\/index\.html$/, "/"); }

  // ---- Brand (SVG logo + wordmark) ----
  var LOGO_SVG =
    '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">' +
      '<rect x="3" y="3" width="7.4" height="7.4" rx="2.2" fill="#fff"/>' +
      '<rect x="13.6" y="3" width="7.4" height="7.4" rx="2.2" fill="#fff" opacity=".82"/>' +
      '<rect x="3" y="13.6" width="7.4" height="7.4" rx="2.2" fill="#fff" opacity=".82"/>' +
      '<rect x="13.6" y="13.6" width="7.4" height="7.4" rx="2.2" fill="#fff"/>' +
    "</svg>";
  function brandHTML(extraStyle) {
    return '<a class="brand" href="/"' + (extraStyle ? ' style="' + extraStyle + '"' : "") + ">" +
      '<span class="logo">' + LOGO_SVG + "</span>" +
      '<span class="wordmark">tools<span class="brand-sub">.ifscpincode</span></span></a>';
  }

  // ---- Theme ----
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("theme", t); } catch (e) {}
    var btn = document.querySelector(".theme-toggle");
    if (btn) btn.textContent = t === "dark" ? "☀️" : "🌙";
  }
  function initTheme() {
    var saved;
    try { saved = localStorage.getItem("theme"); } catch (e) {}
    if (!saved) saved = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(saved);
  }

  // ---- Header ----
  function buildHeader() {
    if (document.querySelector(".site-header.app-header")) return;
    var p = path();
    function navlink(href, label) {
      var active = (href === "/" ? p === "/" : p.indexOf(href) === 0) ? " active" : "";
      return '<a href="' + href + '" class="' + active.trim() + '">' + label + '</a>';
    }
    var header = el(
      '<header class="site-header app-header">' +
        '<nav class="nav" aria-label="Primary">' +
          brandHTML() +
          '<div class="nav-links">' +
            navlink("/", "Home") +
            navlink("/#tools", "All Tools") +
            navlink("/blog/", "Blog") +
            navlink("/about/", "About") +
            navlink("/contact/", "Contact") +
          '</div>' +
          '<button class="theme-toggle" aria-label="Toggle dark mode" title="Toggle theme">🌙</button>' +
          '<button class="nav-burger" aria-label="Open menu" aria-expanded="false">☰</button>' +
        '</nav>' +
      '</header>'
    );
    document.body.insertBefore(header, document.body.firstChild);

    // mobile drawer
    var groups = "";
    Object.keys(CATS).forEach(function (k) {
      groups += "<h4>" + CATS[k].label + "</h4>";
      TOOLS.filter(function (t) { return t.cat === k; }).forEach(function (t) {
        groups += '<a href="/' + t.id + '">' + t.name + "</a>";
      });
    });
    var drawer = el(
      '<aside class="mobile-drawer" aria-label="Menu">' +
        '<div class="drawer-head"><strong>Menu</strong><button class="drawer-close" aria-label="Close">×</button></div>' +
        '<a href="/">Home</a><a href="/blog/">Blog</a><a href="/about/">About</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a>' +
        groups +
      "</aside>"
    );
    var overlay = el('<div class="drawer-overlay"></div>');
    document.body.appendChild(drawer);
    document.body.appendChild(overlay);

    function openDrawer() { drawer.classList.add("open"); overlay.classList.add("open"); }
    function closeDrawer() { drawer.classList.remove("open"); overlay.classList.remove("open"); }
    header.querySelector(".nav-burger").addEventListener("click", openDrawer);
    drawer.querySelector(".drawer-close").addEventListener("click", closeDrawer);
    overlay.addEventListener("click", closeDrawer);
    drawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeDrawer); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

    header.querySelector(".theme-toggle").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      applyTheme(cur === "dark" ? "light" : "dark");
    });
  }

  // ---- Footer ----
  function buildFooter() {
    if (document.querySelector(".site-footer.app-footer")) return;
    function col(cat) {
      var items = TOOLS.filter(function (t) { return t.cat === cat; }).slice(0, 6)
        .map(function (t) { return '<a href="/' + t.id + '">' + t.name + "</a>"; }).join("");
      return "<div><h4>" + CATS[cat].label + "</h4>" + items + "</div>";
    }
    var footer = el(
      '<footer class="site-footer app-footer">' +
        '<div class="footer-grid">' +
          '<div>' +
            brandHTML("margin-bottom:12px") +
            '<p class="footer-about">Fast, free and privacy-friendly online tools and calculators. Everything runs in your browser — no signup, no data sent to any server.</p>' +
          '</div>' +
          col("finance") +
          col("dev") +
          '<div><h4>Company</h4>' +
            '<a href="/about/">About</a><a href="/blog/">Blog</a><a href="/contact/">Contact</a>' +
            '<a href="/privacy/">Privacy Policy</a><a href="/terms/">Terms of Use</a>' +
          "</div>" +
        "</div>" +
        '<div class="footer-bottom">© ' + new Date().getFullYear() + ' tools.ifscpincode.in · Built for speed and privacy · <a href="https://ifscpincode.in">ifscpincode.in</a></div>' +
      "</footer>"
    );
    document.body.appendChild(footer);
  }

  // ---- Homepage rendering (if placeholders exist) ----
  function renderHome() {
    var grid = document.getElementById("tool-grid");
    if (!grid) return;

    function card(t) {
      var tag = t.tag ? '<span class="tag">' + t.tag + "</span>" : "";
      return '<a class="card tool-item" href="/' + t.id + '" data-name="' + (t.name + " " + t.desc).toLowerCase() + '" data-cat="' + t.cat + '">' +
        tag +
        '<div class="card-ico">' + t.icon + "</div>" +
        "<h3>" + t.name + "</h3><p>" + t.desc + "</p>" +
        '<span class="go">Open tool →</span>' +
      "</a>";
    }

    var html = "";
    Object.keys(CATS).forEach(function (k) {
      var list = TOOLS.filter(function (t) { return t.cat === k; });
      if (!list.length) return;
      html += '<div class="section-head"><span class="ico ' + CATS[k].cls + '">' + CATS[k].icon + '</span><h2>' + CATS[k].label + "</h2></div>";
      html += '<section class="cards" data-group="' + k + '">' + list.map(card).join("") + "</section>";
    });
    grid.innerHTML = html;

    // search
    var input = document.getElementById("tool-search-input");
    if (input) {
      input.addEventListener("input", function () {
        var q = input.value.trim().toLowerCase();
        var anyShown = false;
        document.querySelectorAll(".section-head, section.cards[data-group]").forEach(function () {});
        document.querySelectorAll("section.cards[data-group]").forEach(function (sec) {
          var heading = sec.previousElementSibling;
          var visible = 0;
          sec.querySelectorAll(".tool-item").forEach(function (c) {
            var match = !q || c.getAttribute("data-name").indexOf(q) !== -1;
            c.style.display = match ? "" : "none";
            if (match) visible++;
          });
          sec.style.display = visible ? "" : "none";
          if (heading && heading.classList.contains("section-head")) heading.style.display = visible ? "" : "none";
          if (visible) anyShown = true;
        });
        var nr = document.getElementById("no-results");
        if (nr) nr.style.display = anyShown ? "none" : "block";
      });
    }
  }

  // ---- Breadcrumb on tool pages ----
  function buildBreadcrumb() {
    var card = document.querySelector(".tool-card");
    if (!card) return;
    var h1 = card.querySelector("h1");
    if (!h1 || card.querySelector(".breadcrumb")) return;
    var id = path().replace(/^\//, "").replace(/\/$/, "");
    var tool = TOOLS.filter(function (t) { return t.id === id; })[0];
    var name = tool ? tool.name : (h1.textContent || "Tool");
    var bc = el('<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> › <span>' + name + "</span></nav>");
    card.insertBefore(bc, h1);
  }

  function init() {
    initTheme();
    buildHeader();
    buildFooter();
    renderHome();
    buildBreadcrumb();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
