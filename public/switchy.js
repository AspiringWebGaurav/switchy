(function () {
  "use strict";

  var script = document.currentScript;
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
  var endpoint =
    origin + "/api/v1/decide?projectId=" + encodeURIComponent(projectId) + "&key=" + encodeURIComponent(key);

  fetch(endpoint)
    .then(function (res) {
      if (!res.ok) throw new Error("Switchyy: HTTP " + res.status);
      return res.json();
    })
    .then(function (json) {
      if (!json.data) return;
      var data = json.data;

      // Not yet activated — show setup-pending overlay
      if (data.pending) {
        var pendingOverlay = document.createElement("div");
        pendingOverlay.id = "switchy-overlay";
        pendingOverlay.style.cssText =
          "position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;" +
          "background:rgba(250,250,249,0.97);font-family:system-ui,-apple-system,sans-serif;";

        var pendingCard = document.createElement("div");
        pendingCard.style.cssText =
          "max-width:420px;width:90%;text-align:center;padding:48px 32px;";

        var pendingIcon = document.createElement("div");
        pendingIcon.style.cssText =
          "width:56px;height:56px;margin:0 auto 24px;border-radius:16px;display:flex;align-items:center;" +
          "justify-content:center;background:#eef2ff;";
        pendingIcon.innerHTML =
          '<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#6366f1" stroke-width="1.5">' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />' +
          "</svg>";

        var pendingH1 = document.createElement("h1");
        pendingH1.style.cssText =
          "margin:0 0 10px;font-size:20px;font-weight:600;color:#1c1917;line-height:1.3;";
        pendingH1.textContent = "Integration Detected";

        var pendingP = document.createElement("p");
        pendingP.style.cssText = "margin:0 0 8px;font-size:14px;color:#57534e;line-height:1.5;";
        pendingP.textContent =
          "Your script is running but this project has not been activated yet.";

        var pendingSub = document.createElement("p");
        pendingSub.style.cssText = "margin:0;font-size:13px;color:#a8a29e;";
        pendingSub.textContent = "Visit your Switchyy dashboard to activate it.";

        pendingCard.appendChild(pendingIcon);
        pendingCard.appendChild(pendingH1);
        pendingCard.appendChild(pendingP);
        pendingCard.appendChild(pendingSub);
        pendingOverlay.appendChild(pendingCard);
        document.body.appendChild(pendingOverlay);
        return;
      }

      if (data.mode === "live") return;

      var message = data.message || "This site is currently unavailable.";
      var buttonText = data.buttonText || null;
      var redirect = data.redirect || null;

      var overlay = document.createElement("div");
      overlay.id = "switchy-overlay";
      overlay.style.cssText =
        "position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;" +
        "background:rgba(250,250,249,0.97);font-family:system-ui,-apple-system,sans-serif;";

      var card = document.createElement("div");
      card.style.cssText =
        "max-width:420px;width:90%;text-align:center;padding:48px 32px;";

      var modeStyles = {
        maintenance:  { bg: "#fef3c7", stroke: "#d97706" },
        custom:       { bg: "#eef2ff", stroke: "#6366f1" },
        preview:      { bg: "#fdf4ff", stroke: "#c026d3" },
        medical:      { bg: "#fff1f2", stroke: "#e11d48" },
        brb:          { bg: "#e0f2fe", stroke: "#0284c7" },
        vacation:     { bg: "#ecfeff", stroke: "#0891b2" },
        focus:        { bg: "#f1f5f9", stroke: "#475569" },
        working:      { bg: "#fff7ed", stroke: "#ea580c" },
        launching:    { bg: "#eef2ff", stroke: "#4f46e5" },
        migrating:    { bg: "#faf5ff", stroke: "#9333ea" },
        deploying:    { bg: "#dbeafe", stroke: "#1d4ed8" },
        incident:     { bg: "#fef2f2", stroke: "#dc2626" },
        degraded:     { bg: "#fefce8", stroke: "#ca8a04" },
        outage:       { bg: "#fee2e2", stroke: "#991b1b" },
        closed:       { bg: "#f5f5f4", stroke: "#78716c" },
        "coming-soon":{ bg: "#f0fdfa", stroke: "#0d9488" },
        paused:       { bg: "#f8fafc", stroke: "#475569" },
        moved:        { bg: "#eff6ff", stroke: "#2563eb" },
        beta:         { bg: "#f7fee7", stroke: "#4d7c0f" },
        holiday:      { bg: "#fdf2f8", stroke: "#db2777" },
        offline:      { bg: "#fafafa", stroke: "#71717a" },
      };
      var ms = modeStyles[data.mode] || modeStyles.custom;

      var modeIcons = {
        maintenance: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.048.58.024 1.194-.14 1.743"></path>',
        custom: '<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>',
        medical: '<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path>',
        brb: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
        working: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25h-13.5A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25h-13.5A2.25 2.25 0 013 12V5.25"></path>',
        vacation: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"></path>',
        launching: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>',
        incident: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path>',
        degraded: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181"></path>',
        closed: '<path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>',
        "coming-soon": '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
        paused: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5"></path>',
        moved: '<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"></path>',
        migrating: '<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z"></path>',
        preview: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>',
        focus: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"></path>',
        deploying: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"></path>',
        outage: '<path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>',
        beta: '<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"></path>',
        holiday: '<path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"></path>',
        offline: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 3l8.735 8.735m0 0a.374.374 0 11.53.53m-.53-.53l.53.53m0 0L21 21M1.5 7.5c2.321-2.321 5.478-3.432 8.548-3.334m6.452 1.584A9.718 9.718 0 0121 7.5m-3.9 3.9a5.25 5.25 0 00-7.2 0"></path>',
      };
      var svgPath = modeIcons[data.mode] || modeIcons.custom;

      var icon = document.createElement("div");
      icon.style.cssText =
        "width:56px;height:56px;margin:0 auto 24px;border-radius:16px;display:flex;align-items:center;" +
        "justify-content:center;background:" + ms.bg + ";";
      icon.innerHTML =
        '<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="' + ms.stroke + '" stroke-width="1.5">' + svgPath + '</svg>';

      var h1 = document.createElement("h1");
      h1.style.cssText =
        "margin:0 0 12px;font-size:22px;font-weight:600;color:#1c1917;line-height:1.3;";
      h1.textContent = message;

      var sub = document.createElement("p");
      sub.style.cssText = "margin:0;font-size:13px;color:#a8a29e;";
      sub.textContent = "Powered by Switchyy";

      card.appendChild(icon);
      card.appendChild(h1);
      card.appendChild(sub);

      if (buttonText && redirect) {
        var btn = document.createElement("a");
        btn.href = redirect;
        btn.textContent = buttonText;
        btn.style.cssText =
          "display:inline-block;margin-top:24px;padding:10px 24px;border-radius:12px;font-size:14px;" +
          "font-weight:500;color:#fff;background:#6366f1;text-decoration:none;transition:background 0.2s;";
        btn.onmouseover = function () { btn.style.background = "#4f46e5"; };
        btn.onmouseout = function () { btn.style.background = "#6366f1"; };
        card.appendChild(btn);
      }

      overlay.appendChild(card);
      document.body.appendChild(overlay);
    })
    .catch(function (err) {
      console.error("[Switchyy]", err.message);
    });
})();
