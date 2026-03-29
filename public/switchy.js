(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var src = script.getAttribute("src") || "";
  var params = new URL(src, window.location.origin).searchParams;
  var key = params.get("key");
  var projectId = params.get("project");
  var blocking = params.get("blocking") !== "false"; // Default: true (block until decision)

  // ── ULTRA-AGGRESSIVE: Use document.write to inject hiding style BEFORE anything else ──
  if (blocking && document.readyState === "loading") {
    document.write('<style id="switchy-hide">html{visibility:hidden!important;background:#fff}</style>');
  }

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
  var _hideStyle = null;

  // ── Fallback: If document.write didn't work, use DOM approach ───────────────
  if (blocking && !document.getElementById("switchy-hide")) {
    _hideStyle = document.createElement("style");
    _hideStyle.id = "switchy-hide";
    _hideStyle.textContent = "html{visibility:hidden!important;background:#fff}";
    document.documentElement.appendChild(_hideStyle);
  }
  // Also set directly on html element for extra safety
  if (blocking) {
    document.documentElement.style.visibility = "hidden";
    document.documentElement.style.background = "#fff";
  }

  // ── Blocking overlay — shows immediately before API response ───────────────
  var blockerHTML = 
    '<div id="switchy-blocker" style="position:fixed;inset:0;z-index:2147483646;' +
    'display:flex;align-items:center;justify-content:center;visibility:visible!important;' +
    'background:rgba(255,255,255,0.9);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);">' +
    '<svg width="56" height="56" viewBox="0 0 32 32" fill="none" style="flex-shrink:0;animation:sw-spin 1.5s linear infinite">' +
    '<defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">' +
    '<stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#8b5cf6"/>' +
    '</linearGradient></defs>' +
    '<rect width="32" height="32" rx="6" fill="url(#sg)"/>' +
    '<rect x="7" y="12" width="18" height="8" rx="4" fill="rgba(255,255,255,0.3)"/>' +
    '<circle cx="21" cy="16" r="3" fill="#fff"/>' +
    '<path d="M14 7L12 13h2l-1.5 6 4-5.5h-2L16 7z" fill="#fff"/>' +
    '</svg>' +
    '<style>@keyframes sw-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>' +
    '</div>';

  // Inject blocker immediately via document.write if possible
  if (blocking && document.readyState === "loading") {
    document.write(blockerHTML);
    _initialBlocker = document.getElementById("switchy-blocker");
  }

  function showInitialBlocker() {
    if (!blocking || _initialBlocker) return;
    // Fallback: create via DOM if document.write didn't work
    var temp = document.createElement("div");
    temp.innerHTML = blockerHTML;
    _initialBlocker = temp.firstChild;
    (document.body || document.documentElement).appendChild(_initialBlocker);
  }

  function removeInitialBlocker() {
    // Restore html visibility
    document.documentElement.style.visibility = "";
    document.documentElement.style.background = "";
    // Remove hide style (could be from document.write or DOM)
    var hideEl = document.getElementById("switchy-hide");
    if (hideEl && hideEl.parentNode) {
      hideEl.parentNode.removeChild(hideEl);
    }
    _hideStyle = null;
    // Fade out blocker
    if (_initialBlocker && _initialBlocker.parentNode) {
      _initialBlocker.style.opacity = "0";
      _initialBlocker.style.transition = "opacity 0.15s ease-out";
      setTimeout(function() {
        if (_initialBlocker && _initialBlocker.parentNode) {
          _initialBlocker.parentNode.removeChild(_initialBlocker);
        }
        _initialBlocker = null;
      }, 150);
    }
  }

  // Show blocker as soon as body exists
  if (blocking) {
    if (document.body) {
      showInitialBlocker();
    } else {
      document.addEventListener("DOMContentLoaded", showInitialBlocker);
    }
    // Failsafe: remove blocker after 5s if API doesn't respond
    setTimeout(removeInitialBlocker, 5000);
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

  // ── Inject transition + debug-badge styles ────────────────────────────────
  (function () {
    var s = document.createElement("style");
    s.id = "switchy-styles";
    s.textContent =
      "#switchy-overlay{transition:opacity 0.3s cubic-bezier(0.16,1,0.3,1);}" +
      "#switchy-debug-badge{position:fixed;bottom:12px;left:12px;z-index:9999999;" +
      "background:rgba(15,15,15,0.88);color:#e2e8f0;" +
      "font-family:ui-monospace,Menlo,monospace;font-size:11px;" +
      "padding:5px 10px;border-radius:6px;pointer-events:none;line-height:1.5;" +
      "border:1px solid rgba(255,255,255,0.1);}";
    (document.head || document.documentElement).appendChild(s);
  })();

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

    loadLayout(layoutName, function (layout) {
      if (layout && layout.renderMode) {
        showOverlay(layout.renderMode(data, ctx));
      }
    });

    updateDebugBadge(data.mode, effectiveVersion);
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

  // ── Startup — preload default layout, then fetch decision ─────────────────
  loadLayout(DEFAULT_LAYOUT, function () {
    fetch(decideEndpoint, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("Switchyy: HTTP " + res.status);
        return res.json();
      })
      .then(function (json) { if (json.data) applyMode(json.data); })
      .catch(function (err) { console.error("[Switchyy]", err.message); });

    connectSSE();
  });
})();
