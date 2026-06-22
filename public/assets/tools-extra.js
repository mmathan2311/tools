/* =========================================================
   tools-extra.js — logic for the newer tools.
   Each block is guarded by an element check so the file is
   safe to include on any page.
   ========================================================= */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function fmtIN(v) { return Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function copy(text, statusEl, label) {
    if (!text) { if (statusEl) statusEl.textContent = "Nothing to copy"; return; }
    navigator.clipboard.writeText(text).then(function () {
      if (statusEl) { statusEl.textContent = label || "✓ Copied"; setTimeout(function () { statusEl.textContent = ""; }, 1800); }
    });
  }

  /* ---------------- Password Generator ---------------- */
  if ($("pw-generate")) {
    var SETS = {
      lower: "abcdefghijklmnopqrstuvwxyz",
      upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      number: "0123456789",
      symbol: "!@#$%^&*()-_=+[]{};:,.<>?/"
    };
    function gen() {
      var len = parseInt($("pw-length").value, 10) || 16;
      var pool = "", req = [];
      [["pw-lower", "lower"], ["pw-upper", "upper"], ["pw-number", "number"], ["pw-symbol", "symbol"]].forEach(function (p) {
        if ($(p[0]).checked) { pool += SETS[p[1]]; req.push(SETS[p[1]]); }
      });
      if (!pool) { $("pw-output").value = ""; $("pw-status").textContent = "Select at least one character set"; return; }
      var arr = new Uint32Array(len), out = [];
      crypto.getRandomValues(arr);
      for (var i = 0; i < len; i++) out.push(pool[arr[i] % pool.length]);
      // guarantee at least one from each chosen set
      req.forEach(function (set, idx) {
        var r = new Uint32Array(1); crypto.getRandomValues(r);
        out[idx % len] = set[r[0] % set.length];
      });
      var pw = out.join("");
      $("pw-output").value = pw;
      $("pw-status").textContent = "";
      strength(pw);
    }
    function strength(pw) {
      var score = 0;
      if (pw.length >= 12) score++; if (pw.length >= 16) score++;
      if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
      if (/\d/.test(pw)) score++; if (/[^A-Za-z0-9]/.test(pw)) score++;
      var labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Very strong"];
      var colors = ["#e0464b", "#e0464b", "#f59e0b", "#f59e0b", "#0f9d58", "#0f9d58"];
      var bar = $("pw-meter-bar"), lbl = $("pw-meter-label");
      bar.style.width = (score / 5 * 100) + "%";
      bar.style.background = colors[score];
      lbl.textContent = labels[score];
    }
    $("pw-length").addEventListener("input", function () { $("pw-length-val").textContent = $("pw-length").value; gen(); });
    ["pw-lower", "pw-upper", "pw-number", "pw-symbol"].forEach(function (id) { $(id).addEventListener("change", gen); });
    $("pw-generate").addEventListener("click", gen);
    $("pw-copy").addEventListener("click", function () { copy($("pw-output").value, $("pw-status")); });
    $("pw-length-val").textContent = $("pw-length").value;
    gen();
  }

  /* ---------------- Case Converter ---------------- */
  if ($("case-input")) {
    var inp = $("case-input");
    function setOut(v) { $("case-output").value = v; update(); }
    function update() {
      var t = inp.value;
      var words = t.trim() ? t.trim().split(/\s+/).length : 0;
      $("case-stats").textContent = t.length + " characters · " + words + " words";
    }
    var ops = {
      upper: function (t) { return t.toUpperCase(); },
      lower: function (t) { return t.toLowerCase(); },
      title: function (t) { return t.replace(/\w\S*/g, function (w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }); },
      sentence: function (t) { return t.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, function (c) { return c.toUpperCase(); }); },
      camel: function (t) { return t.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, function (_, c) { return c.toUpperCase(); }).replace(/^[A-Z]/, function (c) { return c.toLowerCase(); }); },
      pascal: function (t) { var s = t.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, function (_, c) { return c.toUpperCase(); }); return s.charAt(0).toUpperCase() + s.slice(1); },
      snake: function (t) { return t.trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, ""); },
      kebab: function (t) { return t.trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, ""); },
      toggle: function (t) { return t.replace(/[a-z]/gi, function (c) { return c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase(); }); }
    };
    document.querySelectorAll("[data-case]").forEach(function (b) {
      b.addEventListener("click", function () { setOut(ops[b.getAttribute("data-case")](inp.value)); });
    });
    inp.addEventListener("input", update);
    $("case-copy").addEventListener("click", function () { copy($("case-output").value, $("case-stats"), "✓ Copied to clipboard"); });
    $("case-clear").addEventListener("click", function () { inp.value = ""; $("case-output").value = ""; update(); });
    update();
  }

  /* ---------------- Lorem Ipsum Generator ---------------- */
  if ($("lorem-generate")) {
    var WORDS = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum").split(" ");
    function rand(n) { return Math.floor(Math.random() * n); }
    function sentence() {
      var len = 8 + rand(10), s = [];
      for (var i = 0; i < len; i++) s.push(WORDS[rand(WORDS.length)]);
      var str = s.join(" ");
      return str.charAt(0).toUpperCase() + str.slice(1) + ".";
    }
    function paragraph() {
      var n = 3 + rand(4), p = [];
      for (var i = 0; i < n; i++) p.push(sentence());
      return p.join(" ");
    }
    $("lorem-generate").addEventListener("click", function () {
      var count = Math.max(1, Math.min(50, parseInt($("lorem-count").value, 10) || 3));
      var type = $("lorem-type").value, out = [];
      if (type === "paragraphs") { for (var i = 0; i < count; i++) out.push(paragraph()); $("lorem-output").value = out.join("\n\n"); }
      else if (type === "sentences") { for (var j = 0; j < count; j++) out.push(sentence()); $("lorem-output").value = out.join(" "); }
      else { var w = []; for (var k = 0; k < count; k++) w.push(WORDS[rand(WORDS.length)]); var s = w.join(" "); $("lorem-output").value = s.charAt(0).toUpperCase() + s.slice(1) + "."; }
      $("lorem-status").textContent = "";
    });
    $("lorem-copy").addEventListener("click", function () { copy($("lorem-output").value, $("lorem-status")); });
    $("lorem-generate").click();
  }

  /* ---------------- Color Converter ---------------- */
  if ($("color-picker")) {
    function hexToRgb(h) {
      h = h.replace("#", "");
      if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
      var n = parseInt(h, 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
    function rgbToHex(r, g, b) {
      return "#" + [r, g, b].map(function (x) { return ("0" + Math.round(x).toString(16)).slice(-2); }).join("");
    }
    function rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b), h, s, l = (max + min) / 2;
      if (max === min) { h = s = 0; }
      else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h /= 6;
      }
      return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }
    function render(hex) {
      var rgb = hexToRgb(hex), hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      $("color-swatch").style.background = hex;
      $("color-picker").value = hex;
      $("color-hex").value = hex.toUpperCase();
      $("color-rgb").value = "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")";
      $("color-hsl").value = "hsl(" + hsl.h + ", " + hsl.s + "%, " + hsl.l + "%)";
    }
    $("color-picker").addEventListener("input", function () { render(this.value); });
    $("color-hex").addEventListener("change", function () {
      var v = this.value.trim();
      if (/^#?[0-9a-fA-F]{3}$|^#?[0-9a-fA-F]{6}$/.test(v)) render(v[0] === "#" ? v : "#" + v);
    });
    document.querySelectorAll("[data-copy-target]").forEach(function (b) {
      b.addEventListener("click", function () { copy($(b.getAttribute("data-copy-target")).value, $("color-status")); });
    });
    render("#4f46e5");
  }

  /* ---------------- QR Code Generator ---------------- */
  if ($("qr-generate")) {
    function draw() {
      var text = $("qr-text").value.trim();
      var box = $("qr-output");
      box.innerHTML = "";
      if (!text) { $("qr-status").textContent = "Enter text or a URL"; $("qr-download").classList.add("hidden"); return; }
      if (typeof QRCode === "undefined") { $("qr-status").textContent = "QR library still loading — try again"; return; }
      var size = parseInt($("qr-size").value, 10) || 240;
      new QRCode(box, { text: text, width: size, height: size, correctLevel: QRCode.CorrectLevel.M });
      $("qr-status").textContent = "";
      setTimeout(function () {
        var img = box.querySelector("img") || box.querySelector("canvas");
        if (img) { $("qr-download").classList.remove("hidden"); $("qr-download").href = (img.tagName === "IMG" ? img.src : img.toDataURL("image/png")); }
      }, 120);
    }
    $("qr-generate").addEventListener("click", draw);
    $("qr-text").addEventListener("input", function () { /* debounce */ clearTimeout(window.__qr); window.__qr = setTimeout(draw, 350); });
    $("qr-download").setAttribute("download", "qr-code.png");
    draw();
  }

  /* ---------------- Compound Interest Calculator ---------------- */
  if ($("ci-calc")) {
    var ciChart = null;
    $("ci-calc").addEventListener("click", function () {
      var P = parseFloat($("ci-principal").value) || 0;
      var rate = parseFloat($("ci-rate").value) || 0;
      var years = parseFloat($("ci-years").value) || 0;
      var n = parseInt($("ci-freq").value, 10) || 1;
      var contrib = parseFloat($("ci-contrib").value) || 0;
      if (!P && !contrib) { alert("Enter a principal or monthly contribution"); return; }
      var r = rate / 100 / n;
      var totalPeriods = years * n;
      var labels = [], series = [];
      var bal = P;
      var monthlyToPeriod = contrib * (12 / n); // contribution per compounding period
      for (var i = 1; i <= totalPeriods; i++) {
        bal = bal * (1 + r) + monthlyToPeriod;
        if (i % n === 0 || i === totalPeriods) { labels.push((i / n).toFixed(1)); series.push(bal); }
      }
      var invested = P + contrib * 12 * years;
      var interest = bal - invested;
      $("ci-result").style.display = "block";
      $("ci-result").innerHTML =
        "<div><strong>Maturity Value:</strong> ₹" + fmtIN(bal) + "</div>" +
        '<div class="small">Total Invested: ₹' + fmtIN(invested) + " • Interest Earned: ₹" + fmtIN(interest) + "</div>";
      var ctx = $("ci-chart").getContext("2d");
      if (ciChart) ciChart.destroy();
      ciChart = new Chart(ctx, { type: "line", data: { labels: labels, datasets: [{ label: "Balance (₹)", data: series, borderColor: "#4f46e5", backgroundColor: "rgba(79,70,229,.12)", fill: true, tension: .25 }] }, options: { responsive: true, maintainAspectRatio: false } });
    });
    $("ci-calc").click();
  }

  /* ---------------- Discount Calculator ---------------- */
  if ($("disc-calc")) {
    function run() {
      var price = parseFloat($("disc-price").value) || 0;
      var pct = parseFloat($("disc-percent").value) || 0;
      var tax = parseFloat($("disc-tax").value) || 0;
      var saved = price * pct / 100;
      var afterDisc = price - saved;
      var taxAmt = afterDisc * tax / 100;
      var final = afterDisc + taxAmt;
      $("disc-result").style.display = "block";
      $("disc-result").innerHTML =
        "<div><strong>Final Price:</strong> ₹" + fmtIN(final) + "</div>" +
        '<div class="small">You save ₹' + fmtIN(saved) + " (" + pct + "%) · Price after discount ₹" + fmtIN(afterDisc) + (tax ? " · Tax ₹" + fmtIN(taxAmt) : "") + "</div>";
    }
    $("disc-calc").addEventListener("click", run);
    ["disc-price", "disc-percent", "disc-tax"].forEach(function (id) { $(id).addEventListener("input", run); });
    run();
  }

  /* ---------------- Hash Generator ---------------- */
  if ($("hash-generate")) {
    async function digest(algo, text) {
      var data = new TextEncoder().encode(text);
      var buf = await crypto.subtle.digest(algo, data);
      return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    }
    async function run() {
      var text = $("hash-input").value;
      if (!text) { $("hash-output").innerHTML = '<p class="small">Enter text above to see its hashes.</p>'; return; }
      var algos = [["SHA-1", "SHA-1"], ["SHA-256", "SHA-256"], ["SHA-384", "SHA-384"], ["SHA-512", "SHA-512"]];
      var rows = "";
      for (var i = 0; i < algos.length; i++) {
        var h = await digest(algos[i][1], text);
        rows += '<div class="form-row"><label>' + algos[i][0] + '</label>' +
                '<div class="copy-row"><input type="text" readonly value="' + h + '">' +
                '<button class="btn alt" data-hash="' + h + '">Copy</button></div></div>';
      }
      $("hash-output").innerHTML = rows;
      $("hash-output").querySelectorAll("[data-hash]").forEach(function (b) {
        b.addEventListener("click", function () { copy(b.getAttribute("data-hash"), $("hash-status")); });
      });
    }
    $("hash-generate").addEventListener("click", run);
    $("hash-input").addEventListener("input", function () { clearTimeout(window.__h); window.__h = setTimeout(run, 300); });
  }
})();
