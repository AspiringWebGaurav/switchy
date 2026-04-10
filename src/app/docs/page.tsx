"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Layers,
  Rocket,
  Code2,
  ToggleLeft,
  Lightbulb,
  Shield,
  ChevronRight,
  Wifi,
  Radio,
  Bookmark,
  Settings,
} from "lucide-react";
import { APP_NAME } from "@/config/constants";

const sections = [
  { id: "what-is-switchy", label: `What is ${APP_NAME}`, icon: Zap },
  { id: "how-it-works", label: "How It Works", icon: Layers },
  { id: "getting-started", label: "Getting Started", icon: Rocket },
  { id: "integration", label: "Integration", icon: Code2 },
  { id: "modes", label: "Modes", icon: ToggleLeft },
  { id: "real-time", label: "Real-Time Updates", icon: Radio },
  { id: "presets", label: "Custom Presets", icon: Bookmark },
  { id: "security-settings", label: "Security & Settings", icon: Settings },
  { id: "examples", label: "Examples", icon: Lightbulb },
  { id: "best-practices", label: "Best Practices", icon: Shield },
];

export default function DocsPage() {
  const [active, setActive] = useState("what-is-switchy");
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const sectionElements = sections
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -70% 0px", threshold: 0 }
    );

    sectionElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [mounted]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(id);
    }
  }

  return (
    <div className="relative flex flex-1 bg-white">
      {/* Sidebar - GitHub style */}
      <aside className="relative z-10 sticky top-14 hidden lg:flex h-[calc(100vh-3.5rem)] w-72 shrink-0 flex-col border-r border-stone-200 bg-stone-50 overflow-y-auto">
        <div className="px-6 pt-8 pb-3">
          <h2 className="text-sm font-semibold text-stone-900">
            Documentation
          </h2>
          <p className="text-xs text-stone-500 mt-1">Learn how to integrate {APP_NAME}</p>
        </div>
        <nav className="flex-1 px-4 pb-8 space-y-0.5">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active === id
                  ? "bg-white text-stone-900 font-medium shadow-sm border border-stone-200"
                  : "text-stone-600 hover:bg-white/60 hover:text-stone-900"
              }`}
            >
              <Icon size={16} className={active === id ? "text-indigo-600" : "text-stone-400"} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main ref={contentRef} className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 py-10 lg:py-14">
          {/* Mobile nav */}
          <div className="lg:hidden mb-8 flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
            {sections.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  active === id
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Section 1: What is Switchyy */}
          <section id="what-is-switchy" className="scroll-mt-20 mb-14">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-bold text-stone-900 mb-4 pb-3 border-b border-stone-200">What is {APP_NAME}</h1>
              <p className="text-base text-stone-700 leading-7 mb-4">
                {APP_NAME} is a <strong>real-time mode control platform</strong> for your websites and applications. It lets you instantly switch your app between different states — like <code className="px-1.5 py-0.5 rounded bg-stone-100 text-sm font-mono text-stone-800">live</code>, <code className="px-1.5 py-0.5 rounded bg-stone-100 text-sm font-mono text-stone-800">maintenance</code>, or <code className="px-1.5 py-0.5 rounded bg-stone-100 text-sm font-mono text-stone-800">custom</code> — without writing code, redeploying, or touching your server.
              </p>
              <p className="text-base text-stone-700 leading-7 mb-6">
                {`Think of it as a remote control for your app's behavior. One click in the ${APP_NAME} dashboard, and every user visiting your app sees the updated state immediately.`}
              </p>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Zap size={14} />
                  Why {APP_NAME}?
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>No redeployments needed to change app behavior</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Works with any tech stack — React, Vue, plain HTML, mobile apps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Sub-100ms response time for mode decisions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Secure, rate-limited, and built for production</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </section>

          {/* Section 2: How It Works */}
          <section id="how-it-works" className="scroll-mt-20 mb-14">
            <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-3 border-b border-stone-200">How It Works</h2>
            <p className="text-base text-stone-700 leading-7 mb-6">
              {`${APP_NAME} follows a simple flow: you create a project, set a mode, and your app checks with ${APP_NAME} to know how to behave. Here's the full picture:`}
            </p>
            <div className="space-y-4">
              {[
                {
                  step: "1",
                  title: "Create a Project",
                  desc: "Each project represents one of your applications. You get a unique public key instantly.",
                },
                {
                  step: "2",
                  title: "Set the Mode",
                  desc: "Choose between Live, Maintenance, or Custom. Each mode can carry a message, button text, and redirect URL.",
                },
                {
                  step: "3",
                  title: "Integrate",
                  desc: `Add a script tag to your HTML or call the decision API directly. Your app now checks with ${APP_NAME} on every load.`,
                },
                {
                  step: "4",
                  title: "Control in Real-Time",
                  desc: "Change the mode from the dashboard. Your app updates instantly — no deploy, no restart, no code change.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex gap-4 rounded-xl border border-stone-200 bg-stone-50 p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-white text-sm font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900">{item.title}</h4>
                    <p className="text-sm text-stone-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Getting Started */}
          <section id="getting-started" className="scroll-mt-20 mb-14">
            <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-3 border-b border-stone-200">Getting Started</h2>

            <h3 className="text-lg font-semibold text-stone-900 mt-6 mb-2">1. Sign In</h3>
            <p className="text-stone-600 leading-relaxed mb-4">
              {`Click `}<strong>Login</strong>{` in the top-right corner and sign in with your Google account. That's it — no email verification, no forms. One click and you're in.`}
            </p>

            <h3 className="text-base font-semibold text-stone-900 mt-6 mb-2">2. Create a Project</h3>
            <p className="text-stone-600 leading-relaxed mb-4">
              {`From the dashboard, click `}<strong>New Project</strong>{` and enter a name. Your project is created instantly with a unique public key. The default mode is set to `}<strong>Live</strong>{`.`}
            </p>

            <h3 className="text-base font-semibold text-stone-900 mt-6 mb-2">3. Get Your Keys</h3>
            <p className="text-stone-600 leading-relaxed mb-2">
              {`Click on any project to open its control center. You'll find your:`}
            </p>
            <ul className="space-y-1.5 text-sm text-stone-600 ml-4 mb-4">
              <li className="flex items-start gap-2">
                <ChevronRight size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                <span><strong>Public Key</strong> — used to identify your project in API calls</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                <span><strong>Project ID</strong> — shown in the project header</span>
              </li>
            </ul>
            <p className="text-stone-600 leading-relaxed">
              Both are needed to integrate {APP_NAME} into your app.
            </p>
          </section>

          {/* Section 4: Integration */}
          <section id="integration" className="scroll-mt-20 mb-14">
            <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-3 border-b border-stone-200">Integration</h2>
            <p className="text-base text-stone-700 leading-7 mb-6">
              There are two ways to connect your app to {APP_NAME}. Choose the one that fits your stack.
            </p>

            <h3 className="text-lg font-semibold text-stone-900 mt-6 mb-3">HTML / React / Vue (Easiest)</h3>
            <p className="text-stone-600 leading-relaxed mb-3">
              {`Paste this snippet in your `}<code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-mono text-stone-700">index.html</code>{` `}<code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-mono text-stone-700">&lt;head&gt;</code>{`:`}
            </p>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 mb-2">
              <pre className="text-xs font-mono text-stone-600 whitespace-pre-wrap break-all leading-relaxed">
{`<!-- Switchyy: Add to <head> -->
<script src="https://your-domain.com/switchy.js?key=YOUR_KEY&project=YOUR_ID"></script>`}
              </pre>
            </div>
            <p className="text-sm text-stone-500 mb-6">
              {`Works for plain HTML, React (CRA/Vite), Vue, Angular, Svelte.`}
            </p>

            <h3 className="text-base font-semibold text-stone-900 mt-6 mb-3">Next.js</h3>
            <p className="text-stone-600 leading-relaxed mb-3">
              {`Add to your `}<code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-mono text-stone-700">app/layout.tsx</code>{`:`}
            </p>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 mb-6">
              <pre className="text-xs font-mono text-stone-600 whitespace-pre-wrap break-all leading-relaxed">
{`import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script src="https://your-domain.com/switchy.js?key=YOUR_KEY&project=YOUR_ID" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}`}
              </pre>
            </div>

            <h3 className="text-base font-semibold text-stone-900 mt-6 mb-3">API (Full Control)</h3>
            <p className="text-stone-600 leading-relaxed mb-3">
              For more control, call the decision API directly from your frontend or backend:
            </p>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 mb-2">
              <pre className="text-xs font-mono text-stone-600 whitespace-pre-wrap break-all leading-relaxed">
{`GET /api/v1/decide?projectId=YOUR_PROJECT_ID&key=YOUR_PUBLIC_KEY`}
              </pre>
            </div>
            <p className="text-sm text-stone-500 mb-4">
              The response includes the current mode, message, button text, and redirect URL:
            </p>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <pre className="text-xs font-mono text-stone-600 whitespace-pre-wrap leading-relaxed">
{`{
  "status": "ok",
  "data": {
    "mode": "maintenance",
    "message": "We're updating things. Back soon!",
    "buttonText": "Go Home",
    "redirect": "https://example.com",
    "timestamp": 1711234567890
  }
}`}
              </pre>
            </div>
          </section>

          {/* Section 5: Modes */}
          <section id="modes" className="scroll-mt-20 mb-14">
            <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-3 border-b border-stone-200">Modes</h2>
            <p className="text-base text-stone-700 leading-7 mb-6">
              {APP_NAME} offers <strong>22 built-in modes</strong> organized into categories. Switch between them instantly from the dashboard.
            </p>

            {/* Mode Categories */}
            <div className="space-y-6">
              {/* Status Modes */}
              <div>
                <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: "Live", color: "bg-emerald-500", desc: "App runs normally, no overlay" },
                    { name: "Maintenance", color: "bg-amber-500", desc: "Scheduled maintenance screen" },
                    { name: "Custom", color: "bg-violet-500", desc: "Custom message & redirect" },
                    { name: "Offline", color: "bg-stone-500", desc: "Intentionally offline" },
                    { name: "Preview", color: "bg-fuchsia-500", desc: "Staging environment" },
                  ].map((mode) => (
                    <div key={mode.name} className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${mode.color}`} />
                      <div>
                        <p className="text-sm font-medium text-stone-900">{mode.name}</p>
                        <p className="text-xs text-stone-500">{mode.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Away Modes */}
              <div>
                <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Away & Leave</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["On Leave", "Be Right Back", "Vacation", "Focus Mode"].map((mode) => (
                    <div key={mode} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-center">
                      <p className="text-xs font-medium text-stone-700">{mode}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Modes */}
              <div>
                <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Work</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["Working", "Launching Soon", "Migrating", "Deploying"].map((mode) => (
                    <div key={mode} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-center">
                      <p className="text-xs font-medium text-stone-700">{mode}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incident Modes */}
              <div>
                <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Incidents</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "Incident", color: "text-red-600" },
                    { name: "Degraded", color: "text-yellow-600" },
                    { name: "Outage", color: "text-red-800" },
                  ].map((mode) => (
                    <div key={mode.name} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-center">
                      <p className={`text-xs font-medium ${mode.color}`}>{mode.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business Modes */}
              <div>
                <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Business</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["Closed", "Coming Soon", "Paused", "Moved", "Beta", "Holiday"].map((mode) => (
                    <div key={mode} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-center">
                      <p className="text-xs font-medium text-stone-700">{mode}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Real-Time Updates */}
          <section id="real-time" className="scroll-mt-20 mb-14">
            <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-3 border-b border-stone-200">Real-Time Updates</h2>
            <p className="text-base text-stone-700 leading-7 mb-6">
              When you change a mode in the dashboard, your app updates <strong>instantly</strong> — no page refresh needed. This is powered by Server-Sent Events (SSE).
            </p>

            <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-rose-50 to-pink-50 p-5 mb-6">
              <h4 className="text-sm font-semibold text-stone-900 mb-2">How it works</h4>
              <ol className="space-y-2 text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold">1</span>
                  <span>Your app connects to {APP_NAME} via SSE when the page loads</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold">2</span>
                  <span>You change the mode in the dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold">3</span>
                  <span>{APP_NAME} pushes the update to all connected clients</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold">4</span>
                  <span>Your app shows/hides the overlay immediately</span>
                </li>
              </ol>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-medium text-stone-500 mb-2">SSE Endpoint</p>
              <pre className="text-xs font-mono text-stone-600">
{`GET /api/v1/events/{projectId}?key={publicKey}`}
              </pre>
            </div>
          </section>

          {/* Section 7: Custom Presets */}
          <section id="presets" className="scroll-mt-20 mb-14">
            <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-3 border-b border-stone-200">Custom Presets</h2>
            <p className="text-base text-stone-700 leading-7 mb-6">
              Save your frequently used custom mode configurations as presets. Switch between them with one click instead of re-entering the message, button text, and URL each time.
            </p>

            <div className="space-y-4">
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <h4 className="text-sm font-semibold text-stone-900 mb-2">Default Templates</h4>
                <p className="text-sm text-stone-600 mb-3">
                  {APP_NAME} comes with ready-to-use templates for common scenarios:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {["Under Construction", "Coming Soon", "Maintenance Break", "Temporarily Closed"].map((preset) => (
                    <div key={preset} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
                      <p className="text-xs font-medium text-indigo-700">{preset}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <h4 className="text-sm font-semibold text-stone-900 mb-2">Your Saved Presets</h4>
                <p className="text-sm text-stone-600">
                  Create your own presets with custom messages and save them for quick access. Each preset stores:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-stone-600 ml-4">
                  <li className="flex items-start gap-2">
                    <ChevronRight size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                    <span>Preset name</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                    <span>Custom message</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                    <span>Button text</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                    <span>Redirect URL</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 8: Security & Settings */}
          <section id="security-settings" className="scroll-mt-20 mb-14">
            <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-3 border-b border-stone-200">Security & Settings</h2>
            <p className="text-base text-stone-700 leading-7 mb-6">
              Control exactly where and how your overlays appear using local development testing and suppression features.
            </p>

            <div className="space-y-4">
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <h4 className="text-sm font-semibold text-stone-900 mb-2">Custom Settings & Inheritance</h4>
                <p className="text-sm text-stone-600">
                  By default, any new project inherits its settings globally. Toggling "Custom Settings" to ON within a project unlocks independent granular controls so your development environments act exactly how you want per-project.
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <h4 className="text-sm font-semibold text-stone-900 mb-2">Development Overlay Behavior</h4>
                <p className="text-sm text-stone-600">
                  Switchyy is designed to show overlays on local development environments (like <code>localhost</code>) by <strong>default</strong>, so you can easily adapt your app's frontend to our CSS layout during development. If you don't want to see this while coding, simply toggle the <strong>Hide Overlay on Dev Sites</strong> setting to ON to blanket-hide banners across all dev environments.
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <h4 className="text-sm font-semibold text-stone-900 mb-2">Hide Overlay on Specific Links</h4>
                <p className="text-sm text-stone-600">
                  Need granular control? Instead of hiding the overlay on ALL development sites, you can define specific links (like <code>localhost:3000</code> or <code>staging.myapp.com</code>) where the banner should not appear. This guarantees the overlay is suppressed exactly where you need it, without affecting production links or other local servers.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Examples */}
          <section id="examples" className="scroll-mt-20 mb-14">
            <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-3 border-b border-stone-200">Examples</h2>
            <p className="text-base text-stone-700 leading-7 mb-6">
              Here are real-world scenarios where {APP_NAME} fits perfectly.
            </p>

            <div className="space-y-4">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Scheduled Maintenance</h4>
                <p className="text-sm text-stone-600">
                  {`You're pushing a database migration at 2 AM. Switch to `}<strong>Maintenance</strong>{` mode before you start, run your migration, verify everything works, then switch back to `}<strong>Live</strong>{`. No code changes. No deploy.`}
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Emergency Kill Switch</h4>
                <p className="text-sm text-stone-600">
                  {`Your app has a critical bug in production. Switch to `}<strong>Maintenance</strong>{` instantly while your team works on a fix. Users see a clean message instead of broken pages.`}
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Launch Countdown</h4>
                <p className="text-sm text-stone-600">
                  {`Use `}<strong>Custom</strong>{` mode to show a "Coming Soon" page with a redirect to your waitlist. When you're ready to launch, flip to `}<strong>Live</strong>{`.`}
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Multi-App Control</h4>
                <p className="text-sm text-stone-600">
                  {`Managing multiple services? Create a project for each one. Control your marketing site, API docs, and admin panel independently from a single dashboard.`}
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Best Practices */}
          <section id="best-practices" className="scroll-mt-20 mb-14">
            <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-3 border-b border-stone-200">Best Practices</h2>

            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Keep your public key safe</h4>
                <p className="text-sm text-stone-600">
                  {`Your public key is meant for client-side use, but avoid exposing it unnecessarily. It identifies your project and is tied to rate limiting.`}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Use maintenance mode proactively</h4>
                <p className="text-sm text-stone-600">
                  {`Don't wait for things to break. Before every deploy or migration, switch to maintenance mode. It takes one click and saves you from showing broken states.`}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Test your integration</h4>
                <p className="text-sm text-stone-600">
                  {`After adding the script tag or API call, switch modes from the dashboard and verify your app responds correctly. Test all three modes before going live.`}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-stone-900 mb-1">One project per app</h4>
                <p className="text-sm text-stone-600">
                  {`Create separate projects for each application or service. This gives you independent mode control and cleaner organization.`}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Handle API errors gracefully</h4>
                <p className="text-sm text-stone-600">
                  {`If using the API directly, always handle the case where ${APP_NAME} is unreachable. Default to showing your app normally (fail open) rather than blocking users.`}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Rate limits</h4>
                <p className="text-sm text-stone-600">
                  {`The decision API allows 60 requests per minute per IP per project. This is more than enough for normal usage. If you exceed this, responses return a 429 status.`}
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-stone-200 pt-8 mt-8">
            <p className="text-sm text-stone-400 text-center">
              {`${APP_NAME} Documentation · Built for developers who ship fast`}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
