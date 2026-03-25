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

      var icon = document.createElement("div");
      icon.style.cssText =
        "width:56px;height:56px;margin:0 auto 24px;border-radius:16px;display:flex;align-items:center;" +
        "justify-content:center;background:" + (data.mode === "maintenance" ? "#fef3c7" : "#eef2ff") + ";";
      icon.innerHTML =
        data.mode === "maintenance"
          ? '<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#d97706" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.048.58.024 1.194-.14 1.743"></path></svg>'
          : '<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#6366f1" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>';

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
