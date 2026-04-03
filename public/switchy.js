(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var src = script.getAttribute("src") || "";
  var params = new URL(src, window.location.origin).searchParams;
  var key = params.get("key");
  var projectId = params.get("project");
  var blocking = params.get("blocking") !== "false";

  if (!key || !projectId) {
    console.error("[Switchyy] Missing key or project parameter in script tag.");
    return;
  }

  var origin = new URL(src, window.location.origin).origin;
  var decideEndpoint =
    origin + "/api/v1/decide?projectId=" + encodeURIComponent(projectId) + "&key=" + encodeURIComponent(key);
  var eventsEndpoint =
    origin + "/api/v1/events/" + encodeURIComponent(projectId) + "?key=" + encodeURIComponent(key);

  // ── State ──────────────────────────────────────────────────────────────────
  var lastVersion = 0;
  var currentMode = null;
  var sseFailStart = null;
  var pollTimer = null;
  var evtSource = null;
  var inFallback = false;
  var _removeTimer = null;
  var _debugBadge = null;
  var _initialBlocker = null;
  var _blockingReady = false;

  // ── Blocking overlay — glass pending state (no spinner) ────────────────────
  function createBlocker() {
    var el = document.createElement("div");
    el.id = "switchy-blocker";

    // Radial glow 1 — top-left indigo
    var g1 = document.createElement("div");
    g1.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;" +
      "background:radial-gradient(ellipse 80% 60% at 15% 20%,rgba(99,102,241,0.15) 0%,transparent 70%);";
    el.appendChild(g1);

    // Radial glow 2 — bottom-right blue
    var g2 = document.createElement("div");
    g2.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;" +
      "background:radial-gradient(ellipse 70% 50% at 85% 80%,rgba(59,130,246,0.12) 0%,transparent 70%);";
    el.appendChild(g2);

    // Center content
    var center = document.createElement("div");
    center.style.cssText =
      "position:relative;z-index:1;display:flex;flex-direction:column;" +
      "align-items:center;gap:0;text-align:center;";

    // Logo
    var logoWrap = document.createElement("div");
    logoWrap.style.cssText = "margin-bottom:20px;opacity:0.5;";
    logoWrap.innerHTML =
      '<svg width="52" height="52" viewBox="0 0 32 32" fill="none">' +
      '<defs><linearGradient id="swpg" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" stop-color="rgba(99,102,241,0.7)"/>' +
      '<stop offset="100%" stop-color="rgba(139,92,246,0.7)"/>' +
      '</linearGradient></defs>' +
      '<rect width="32" height="32" rx="8" fill="url(#swpg)"/>' +
      '<rect x="7" y="12" width="18" height="8" rx="4" fill="rgba(255,255,255,0.3)"/>' +
      '<circle cx="21" cy="16" r="3" fill="rgba(255,255,255,0.6)"/>' +
      '<path d="M14 7L12 13h2l-1.5 6 4-5.5h-2L16 7z" fill="rgba(255,255,255,0.6)"/>' +
      '</svg>';
    center.appendChild(logoWrap);

    // Wordmark
    var wordmark = document.createElement("div");
    wordmark.style.cssText =
      "font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;" +
      "font-size:30px;font-weight:700;color:rgba(255,255,255,0.55);" +
      "letter-spacing:-0.02em;margin-bottom:6px;";
    wordmark.innerHTML = 'Switchyy<sup style="font-size:0.4em;vertical-align:super;opacity:0.6;">TM</sup>';
    center.appendChild(wordmark);

    // Tagline
    var tagline = document.createElement("div");
    tagline.style.cssText =
      "font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;" +
      "font-size:11px;font-weight:500;color:rgba(255,255,255,0.25);" +
      "letter-spacing:0.2em;text-transform:uppercase;margin-bottom:32px;";
    tagline.textContent = "Enterprise Mode Control";
    center.appendChild(tagline);

    // Status line
    var status = document.createElement("div");
    status.style.cssText =
      "display:flex;align-items:center;gap:8px;" +
      "font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;" +
      "font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:0;";
    var dot = document.createElement("span");
    dot.id = "sw-pending-dot";
    status.appendChild(dot);
    status.appendChild(document.createTextNode("Connecting to control plane\u2026"));
    center.appendChild(status);

    el.appendChild(center);

    // Copyright — absolute bottom
    var copy = document.createElement("div");
    copy.style.cssText =
      "position:absolute;bottom:28px;left:0;width:100%;text-align:center;" +
      "font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;" +
      "font-size:11px;color:rgba(255,255,255,0.18);letter-spacing:0.04em;";
    copy.textContent = "\u00a9 " + new Date().getFullYear() + " Switchyy\u2122. All rights reserved.";
    el.appendChild(copy);

    return el;
  }

  function showInitialBlocker() {
    if (!blocking || _initialBlocker || _blockingReady) return;
    _initialBlocker = createBlocker();
    (document.body || document.documentElement).appendChild(_initialBlocker);
  }

  function removeInitialBlocker() {
    _blockingReady = true;
    if (_initialBlocker && _initialBlocker.parentNode) {
      _initialBlocker.style.opacity = "0";
      setTimeout(function() {
        if (_initialBlocker && _initialBlocker.parentNode) {
          _initialBlocker.parentNode.removeChild(_initialBlocker);
        }
        _initialBlocker = null;
      }, 150);
    }
  }

  // ── Layout system ─────────────────────────────────────────────────────────
  var layoutCache = {};
  var DEFAULT_LAYOUT = "glass";

  function loadLayout(name, callback) {
    if (layoutCache[name]) {
      callback(layoutCache[name]);
      return;
    }

    // Check if already loaded globally
    if (window.SwitchyLayouts && window.SwitchyLayouts[name]) {
      layoutCache[name] = window.SwitchyLayouts[name];
      callback(layoutCache[name]);
      return;
    }

    var script = document.createElement("script");
    script.src = origin + "/switchy_layouts/" + name + ".js";
    script.onload = function () {
      if (window.SwitchyLayouts && window.SwitchyLayouts[name]) {
        layoutCache[name] = window.SwitchyLayouts[name];
        callback(layoutCache[name]);
      } else {
        console.error("[Switchyy] Layout '" + name + "' not found after loading.");
        callback(null);
      }
    };
    script.onerror = function () {
      console.error("[Switchyy] Failed to load layout: " + name);
      callback(null);
    };
    document.head.appendChild(script);
  }

  // ── Inject styles once DOM is ready ─────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById("switchy-styles")) return;
    var s = document.createElement("style");
    s.id = "switchy-styles";
    s.textContent =
      "#switchy-blocker{position:fixed;inset:0;width:100vw;height:100vh;" +
      "z-index:2147483646;overflow:hidden;display:flex;" +
      "align-items:center;justify-content:center;" +
      "background:rgba(10,20,40,0.35);" +
      "backdrop-filter:blur(35px);-webkit-backdrop-filter:blur(35px);" +
      "transition:opacity 0.2s ease-out}" +
      "#sw-pending-dot{width:6px;height:6px;border-radius:50%;display:inline-block;" +
      "background:rgba(99,102,241,0.6);animation:sw-dot-pulse 2s ease-in-out infinite}" +
      "@keyframes sw-dot-pulse{0%,100%{opacity:0.4}50%{opacity:1}}" +
      "#switchy-overlay{transition:opacity 0.3s cubic-bezier(0.16,1,0.3,1)}" +
      "#switchy-debug-badge{position:fixed;bottom:12px;left:12px;z-index:9999999;" +
      "background:rgba(15,15,15,0.88);color:#e2e8f0;" +
      "font-family:ui-monospace,Menlo,monospace;font-size:11px;" +
      "padding:5px 10px;border-radius:6px;pointer-events:none;line-height:1.5;" +
      "border:1px solid rgba(255,255,255,0.1)}";
    (document.head || document.documentElement).appendChild(s);
  }

  // ── Transition helpers ─────────────────────────────────────────────────────
  function cancelPendingFadeOut() {
    if (!_removeTimer) return;
    clearTimeout(_removeTimer);
    _removeTimer = null;
    var el = document.getElementById("switchy-overlay");
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function fadeOutOverlay(el) {
    if (!el) return;
    el.style.opacity = "0";
    _removeTimer = setTimeout(function () {
      _removeTimer = null;
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 220);
  }

  function showOverlay(el) {
    if (!el) return;
    el.style.opacity = "0";
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.style.opacity = "1"; });
    });
  }

  // ── Debug badge — active only when window.__SWITCHY_TEST__ === true ────────
  function updateDebugBadge(mode, version) {
    if (!window.__SWITCHY_TEST__) { removeDebugBadge(); return; }
    if (!_debugBadge) {
      _debugBadge = document.createElement("div");
      _debugBadge.id = "switchy-debug-badge";
      document.body.appendChild(_debugBadge);
    }
    _debugBadge.textContent = "\u25b6 " + mode + "  v" + version;
    console.log("[Switchyy:TEST] \u2192 " + mode + " (v" + version + ")");
  }

  function removeDebugBadge() {
    if (_debugBadge && _debugBadge.parentNode) _debugBadge.parentNode.removeChild(_debugBadge);
    _debugBadge = null;
  }

  // ── Context for layouts ───────────────────────────────────────────────────
  var ctx = { origin: origin };

  // ── applyMode — idempotent, version-safe, transition-aware ────────────────
  function applyMode(data) {
    if (!data) return;

    // Always remove the initial blocker once we have a decision
    removeInitialBlocker();

    var effectiveVersion =
      (typeof data.version === "number" ? data.version : 0) ||
      (typeof data.timestamp === "number" ? data.timestamp : 0);

    if (effectiveVersion > 0 && effectiveVersion <= lastVersion) return;
    if (effectiveVersion > lastVersion) lastVersion = effectiveVersion;

    cancelPendingFadeOut();

    var existing = document.getElementById("switchy-overlay");
    var layoutName = data.layout || DEFAULT_LAYOUT;

    if (data.pending) {
      if (currentMode === "pending") { updateDebugBadge("pending", effectiveVersion); return; }
      currentMode = "pending";
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

      loadLayout(layoutName, function (layout) {
        if (layout && layout.renderPending) {
          showOverlay(layout.renderPending(ctx));
        }
      });

      updateDebugBadge("pending", effectiveVersion);
      return;
    }

    if (data.mode === "live") {
      currentMode = "live";
      if (existing) fadeOutOverlay(existing); else removeDebugBadge();
      updateDebugBadge("live", effectiveVersion);
      return;
    }

    currentMode = data.mode;
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    // If custom template HTML/CSS is provided, render it directly
    if (data.template && data.template.html && data.template.css) {
      var overlay = renderCustomTemplate(data);
      if (overlay) {
        showOverlay(overlay);
        updateDebugBadge(data.mode + " (custom)", effectiveVersion);
        return;
      }
    }

    // Otherwise use the standard layout system
    loadLayout(layoutName, function (layout) {
      if (layout && layout.renderMode) {
        showOverlay(layout.renderMode(data, ctx));
      }
    });

    updateDebugBadge(data.mode, effectiveVersion);
  }

  // ── Custom template renderer ────────────────────────────────────────────────
  function renderCustomTemplate(data) {
    var template = data.template;
    if (!template || !template.html || !template.css) return null;

    // Create overlay container
    var overlay = document.createElement("div");
    overlay.id = "switchy-overlay";
    overlay.style.cssText =
      "position:fixed;inset:0;width:100vw;height:100vh;z-index:999999;overflow:hidden;";

    // Process HTML - replace placeholders
    var html = template.html
      .replace(/\{\{ICON\}\}/g, getIconForMode(data.mode))
      .replace(/\{\{MESSAGE\}\}/g, data.message || "")
      .replace(/\{\{TITLE\}\}/g, getTitleForMode(data.mode))
      .replace(/\{\{MODE_LABEL\}\}/g, data.mode.replace(/-/g, " "));

    // Handle button conditional
    if (data.buttonText && data.redirect) {
      html = html
        .replace(/\{\{#BUTTON\}\}/g, "")
        .replace(/\{\{\/BUTTON\}\}/g, "")
        .replace(/\{\{BUTTON_TEXT\}\}/g, data.buttonText)
        .replace(/\{\{REDIRECT\}\}/g, data.redirect);
    } else {
      html = html.replace(/\{\{#BUTTON\}\}[\s\S]*?\{\{\/BUTTON\}\}/g, "");
    }

    // Inject CSS
    var style = document.createElement("style");
    style.textContent = template.css;
    overlay.appendChild(style);

    // Create content wrapper and set HTML
    var content = document.createElement("div");
    content.innerHTML = html;
    while (content.firstChild) {
      overlay.appendChild(content.firstChild);
    }

    return overlay;
  }

  function getIconForMode(mode) {
    var icons = {
      maintenance: '<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.048.58.024 1.194-.14 1.743"></path></svg>',
      offline: '<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18M8.111 8.111A5.97 5.97 0 006 12c0 .337.028.666.081.988M12.5 6.029A6 6 0 0118 12c0 .337-.028.666-.081.988M9 9a3 3 0 013-3 3 3 0 013 3M9 9l6 6M12 12v.01"></path></svg>',
      incident: '<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path></svg>',
    };
    return icons[mode] || icons.maintenance;
  }

  function getTitleForMode(mode) {
    var titles = {
      maintenance: "Scheduled Maintenance",
      offline: "Service Offline",
      incident: "Service Incident",
      preview: "Preview Environment",
      medical: "Team On Leave",
      custom: "Site Unavailable",
    };
    return titles[mode] || mode.charAt(0).toUpperCase() + mode.slice(1).replace(/-/g, " ");
  }

  // ── Polling fallback ───────────────────────────────────────────────────────
  function stopPollingFallback() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  function startPollingFallback() {
    if (pollTimer) return;
    inFallback = true;
    pollTimer = setInterval(function () {
      fetch(decideEndpoint, { cache: "no-store" })
        .then(function (res) { return res.json(); })
        .then(function (json) { if (json.data) applyMode(json.data); })
        .catch(function () { /* silent */ });
    }, 15000);
  }

  // ── SSE connection ─────────────────────────────────────────────────────────
  function connectSSE() {
    if (evtSource) { evtSource.close(); evtSource = null; }

    evtSource = new EventSource(eventsEndpoint);

    evtSource.addEventListener("mode", function (e) {
      try { applyMode(JSON.parse(e.data)); } catch (err) {
        console.error("[Switchyy] SSE parse error:", err);
      }
    });

    evtSource.onopen = function () {
      var wasFailing = sseFailStart !== null || inFallback;
      sseFailStart = null;
      inFallback = false;
      stopPollingFallback();
      if (wasFailing) {
        fetch(decideEndpoint, { cache: "no-store" })
          .then(function (res) { return res.json(); })
          .then(function (json) { if (json.data) applyMode(json.data); })
          .catch(function () { /* silent — next SSE event will correct */ });
      }
    };

    evtSource.onerror = function () {
      if (!sseFailStart) sseFailStart = Date.now();
      if (Date.now() - sseFailStart > 30000) {
        evtSource.close();
        evtSource = null;
        startPollingFallback();
      }
    };
  }

  // ── Visibility recovery — reconnect SSE when tab regains focus ─────────────
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && inFallback) {
      stopPollingFallback();
      inFallback = false;
      sseFailStart = null;
      connectSSE();
    }
  });

  // ── Startup — inject styles, show blocker, then fetch decision ─────────────
  function init() {
    injectStyles();
    if (blocking) {
      showInitialBlocker();
      setTimeout(removeInitialBlocker, 4000); // Failsafe: 4s max block
    }
    loadLayout(DEFAULT_LAYOUT, function () {
      fetch(decideEndpoint, { cache: "no-store" })
        .then(function (res) {
          if (!res.ok) throw new Error("Switchyy: HTTP " + res.status);
          return res.json();
        })
        .then(function (json) { if (json.data) applyMode(json.data); })
        .catch(function (err) {
          console.error("[Switchyy]", err.message);
          removeInitialBlocker(); // Unblock on error
        });
      connectSSE();
    });
  }

  // Start when DOM is minimally ready
  if (document.body) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
