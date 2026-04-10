(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i];
      if (s.src && s.src.indexOf("switchy.js") !== -1 && s.src.indexOf("project=") !== -1) {
        script = s;
        break;
      }
    }
  }
  if (!script) return;

  var src = script.getAttribute("src") || "";
  var params = new URL(src, window.location.origin).searchParams;
  var key = params.get("key");
  var projectId = params.get("project");

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
  var _visibilityConfig = null; // cached resolved visibility settings

  // ── Debug mode ─────────────────────────────────────────────────────────────
  var DEBUG = false;
  try { DEBUG = localStorage.getItem('switchy_debug') === 'true'; } catch (e) { }

  function log() {
    if (DEBUG) console.log.apply(console, ['[Switchyy]'].concat([].slice.call(arguments)));
  }

  // ── Environment detection ──────────────────────────────────────────────────
  function isDevEnvironment(hostname) {
    return hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^192\.168\.\d+\.\d+$/.test(hostname) ||
      /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname) ||
      hostname.indexOf('.local') === hostname.length - 6 ||
      hostname.indexOf('.localhost') === hostname.length - 10;
  }

  function matchDomain(hostname, pattern) {
    if (pattern.indexOf('*.') === 0) {
      var suffix = pattern.slice(1); // .example.com
      return hostname.indexOf(suffix) === hostname.length - suffix.length ||
        hostname === pattern.slice(2);
    }
    return hostname === pattern;
  }

  // ── Dev URL matching ───────────────────────────────────────────────────────
  // Entries can be "localhost", "localhost:3000", "staging.example.com", "*.staging.example.com"
  function matchDevUrl(hostname, portStr, pattern) {
    var lastColon = pattern.lastIndexOf(':');
    if (lastColon > 0) {
      var tail = pattern.slice(lastColon + 1);
      if (/^\d+$/.test(tail)) {
        // Pattern includes an explicit port — match both hostname AND port
        var patternHost = pattern.slice(0, lastColon);
        return matchDomain(hostname, patternHost) && portStr === tail;
      }
    }
    // No port in pattern — match hostname at any port
    return matchDomain(hostname, pattern);
  }

  // ── Centralized visibility decision ────────────────────────────────────────
  //
  // Dev overlay behavior contract:
  //   1. On dev/localhost: overlay is SHOWN by default (no configuration needed)
  //   2. devBlocklist entries suppress it on specific hostname[:port] patterns — granular opt-out
  //   3. devEnabled === false → disable overlay globally for all dev/localhost URLs
  //   4. Production domains: subject to allowlist/blocklist rules; devBlocklist has no effect
  //
  function shouldRenderOverlay(config) {
    var hostname = window.location.hostname;

    // Always show the "Integration Detected" setup success overlay
    if (config && config.pending) {
      log('ALLOWED: pending overlay always allowed for setup verification');
      return true;
    }

    var isDev = isDevEnvironment(hostname);
    var visibility = (config && config.visibility) || _visibilityConfig || {};
    var devEnabled = visibility.devOverlayEnabled;
    var devBlocklist = visibility.devBlocklist || [];
    var allowlist = visibility.domainAllowlist || [];
    var blocklist = visibility.domainBlocklist || [];
    var port = window.location.port; // may be "" for default ports

    log('hostname:', hostname, 'port:', port, 'isDev:', isDev,
        'devEnabled:', devEnabled, 'devBlocklist:', devBlocklist,
        'allowlist:', allowlist, 'blocklist:', blocklist);

    if (isDev) {
      // Step 1: Check dev suppression list (most granular — checked first)
      if (devBlocklist.length > 0) {
        for (var i = 0; i < devBlocklist.length; i++) {
          if (matchDevUrl(hostname, port, devBlocklist[i])) {
            log('BLOCKED: dev URL matched in devBlocklist:', devBlocklist[i]);
            return false;
          }
        }
      }

      // Step 2: Check global dev disable toggle
      if (devEnabled === false) {
        log('BLOCKED: dev overlay globally disabled (devEnabled=false)');
        return false;
      }

      // Step 3: Default — show overlay on dev/localhost
      log('ALLOWED: dev environment, overlay shown by default');
      return true;
    }

    // Production domain rules ─────────────────────────────────────────────────

    // Blocklist (takes priority over allowlist)
    if (blocklist.length > 0) {
      for (var i = 0; i < blocklist.length; i++) {
        if (matchDomain(hostname, blocklist[i])) {
          log('BLOCKED: hostname in blocklist');
          return false;
        }
      }
    }

    // Allowlist (if non-empty, hostname must match to show)
    if (allowlist.length > 0) {
      var matched = false;
      for (var i = 0; i < allowlist.length; i++) {
        if (matchDomain(hostname, allowlist[i])) {
          matched = true;
          break;
        }
      }
      if (!matched) {
        log('BLOCKED: hostname not in allowlist');
        return false;
      }
    }

    log('ALLOWED: overlay will render');
    return true;
  }

  // ── Session cache ──────────────────────────────────────────────────────────
  var CACHE_KEY = 'switchy_config_' + projectId;
  var CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  function getCachedConfig() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var cached = JSON.parse(raw);
      if (Date.now() - cached.ts > CACHE_TTL) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }
      log('Using cached config (age:', Math.round((Date.now() - cached.ts) / 1000) + 's)');
      return cached.data;
    } catch (e) { return null; }
  }

  function setCachedConfig(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data }));
      log('Config cached');
    } catch (e) { }
  }

  function clearCachedConfig() {
    try { sessionStorage.removeItem(CACHE_KEY); } catch (e) { }
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
      ".switchy-lock{overflow:hidden!important;touch-action:none!important;overscroll-behavior:none!important;}" +
      "#switchy-overlay{transition:opacity 0.3s cubic-bezier(0.16,1,0.3,1)}" +
      "#switchy-debug-badge{position:fixed;bottom:12px;left:12px;z-index:2147483647;" +
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
      if (document.documentElement) document.documentElement.classList.remove("switchy-lock");
      if (document.body) document.body.classList.remove("switchy-lock");
    }, 220);
  }

  function showOverlay(el) {
    if (!el) return;
    el.style.opacity = "0";
    
    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      if (document.documentElement) document.documentElement.classList.add("switchy-lock");
      if (document.body) document.body.classList.add("switchy-lock");
    }
    
    el.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });
    el.addEventListener('wheel', function(e) { e.preventDefault(); }, { passive: false });

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

  // ── applyMode — idempotent, mode-first, server-driven ────────────────────
  function applyMode(data) {
    if (!data) return;

    var effectiveVersion =
      (typeof data.version === "number" ? data.version : 0) ||
      (typeof data.timestamp === "number" ? data.timestamp : 0);

    // Mode-first deduplication: always apply if mode changed, else check version
    var modeChanged = data.mode !== currentMode || data.pending !== (currentMode === "pending");
    if (!modeChanged && effectiveVersion > 0 && effectiveVersion <= lastVersion) return;
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
      "position:fixed;inset:0;width:100%;height:100%;z-index:2147483647;overflow:hidden;touch-action:none;overscroll-behavior:none;";

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
        .then(function (json) {
          if (json.data) {
            setCachedConfig(json.data);
            applyModeIfAllowed(json.data);
          }
        })
        .catch(function () { /* silent */ });
    }, 15000);
  }

  // ── Re-evaluate current overlay when visibility settings change ────────────
  // Called when a `settings` SSE event arrives with updated domain/dev rules.
  function reEvaluateVisibility() {
    var existing = document.getElementById("switchy-overlay");
    var allowed = shouldRenderOverlay({ mode: currentMode, visibility: _visibilityConfig });

    if (!allowed && existing) {
      // Newly blocked — fade out the overlay
      log('Re-eval: overlay now blocked, fading out');
      fadeOutOverlay(existing);
    } else if (allowed && !existing && currentMode && currentMode !== 'live' && currentMode !== null) {
      // Newly allowed — re-fetch to get fresh data and show overlay
      log('Re-eval: overlay now allowed, re-fetching decide');
      clearCachedConfig();
      fetch(decideEndpoint, { cache: "no-store" })
        .then(function (res) { return res.json(); })
        .then(function (json) {
          if (json.data) {
            setCachedConfig(json.data);
            applyModeIfAllowed(json.data);
          }
        })
        .catch(function () { /* silent */ });
    }
  }

  // ── SSE connection ─────────────────────────────────────────────────────────
  function connectSSE() {
    if (evtSource) { evtSource.close(); evtSource = null; }

    evtSource = new EventSource(eventsEndpoint);

    evtSource.addEventListener("mode", function (e) {
      try {
        var data = JSON.parse(e.data);
        // If the mode event carries visibility, update our cached config
        if (data.visibility) {
          _visibilityConfig = data.visibility;
        } else if (_visibilityConfig) {
          data.visibility = _visibilityConfig;
        }
        // Update session cache with new mode + any new visibility
        var cached = getCachedConfig();
        if (cached) {
          cached.mode = data.mode;
          cached.message = data.message;
          cached.buttonText = data.buttonText;
          cached.redirect = data.redirect;
          cached.timestamp = data.timestamp || data.version;
          if (data.visibility) cached.visibility = data.visibility;
          setCachedConfig(cached);
        }
        applyModeIfAllowed(data);
      } catch (err) {
        console.error("[Switchyy] SSE parse error:", err);
      }
    });

    // Handle settings-only changes — domain rules / Testing Mode toggled in dashboard
    evtSource.addEventListener("settings", function (e) {
      try {
        var data = JSON.parse(e.data);
        if (!data.visibility) return;

        log('Settings SSE received:', data.visibility);

        // Update cached visibility
        _visibilityConfig = data.visibility;

        // Clear sessionStorage so next decide fetch gets fresh data
        clearCachedConfig();

        // Update the cached session config visibility if present
        var cached = getCachedConfig();
        if (cached) {
          cached.visibility = data.visibility;
          setCachedConfig(cached);
        }

        // Re-evaluate whether current overlay should still be shown
        reEvaluateVisibility();
      } catch (err) {
        console.error("[Switchyy] SSE settings parse error:", err);
      }
    });

    evtSource.onopen = function () {
      // Reset stale state on reconnect — server is source of truth
      lastVersion = 0;
      sseFailStart = null;
      inFallback = false;
      stopPollingFallback();
      // Signal SSE ready for tests
      if (window.__SWITCHY_TEST__) {
        window.__SWITCHY_SSE_READY__ = true;
      }
      // Always re-sync with server on reconnect to get fresh config including visibility
      fetch(decideEndpoint, { cache: "no-store" })
        .then(function (res) { return res.json(); })
        .then(function (json) {
          if (json.data) {
            setCachedConfig(json.data);
            applyModeIfAllowed(json.data);
          }
        })
        .catch(function () { /* silent — next SSE event will correct */ });
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

  // ── Guarded applyMode — respects visibility ────────────────────────────────
  function applyModeIfAllowed(data) {
    if (!data) return;

    // Store visibility config for SSE updates that don't carry it
    if (data.visibility) {
      _visibilityConfig = data.visibility;
    }

    // Check visibility rules
    if (!shouldRenderOverlay(data)) {
      // Still update mode tracking but don't render
      if (data.mode === 'live') {
        currentMode = 'live';
        var existing = document.getElementById('switchy-overlay');
        if (existing) fadeOutOverlay(existing);
      }
      return;
    }

    applyMode(data);
  }

  // ── Startup — instant pre-check, then cache/fetch ──────────────────────────
  function init() {
    var hostname = window.location.hostname;
    var isDev = isDevEnvironment(hostname);

    log('Init — hostname:', hostname, 'isDev:', isDev);

    // Real-time connections and basic fetch happen for ALL environments uniformly.
    // Overlay visibility is exclusively controlled by shouldRenderOverlay().

    injectStyles();

    // Try session cache first
    var cached = getCachedConfig();
    if (cached) {
      log('Applying cached mode:', cached.mode);
      applyModeIfAllowed(cached);
      connectSSE(); // still connect for real-time updates
      return;
    }

    // Fetch fresh decision
    loadLayout(DEFAULT_LAYOUT, function () {
      fetch(decideEndpoint, { cache: "no-store" })
        .then(function (res) {
          if (!res.ok) throw new Error("Switchyy: HTTP " + res.status);
          return res.json();
        })
        .then(function (json) {
          if (json.data) {
            setCachedConfig(json.data);
            applyModeIfAllowed(json.data);
          }
        })
        .catch(function (err) {
          console.error("[Switchyy]", err.message);
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
