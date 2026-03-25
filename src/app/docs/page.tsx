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
} from "lucide-react";
import { APP_NAME } from "@/config/constants";

const sections = [
  { id: "what-is-switchy", label: `What is ${APP_NAME}`, icon: Zap },
  { id: "how-it-works", label: "How It Works", icon: Layers },
  { id: "getting-started", label: "Getting Started", icon: Rocket },
  { id: "integration", label: "Integration", icon: Code2 },
  { id: "modes", label: "Modes", icon: ToggleLeft },
  { id: "examples", label: "Examples", icon: Lightbulb },
  { id: "best-practices", label: "Best Practices", icon: Shield },
];

export default function DocsPage() {
  const [active, setActive] = useState("what-is-switchy");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible?.target.id) {
          setActive(visible.target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(id);
    }
  }

  return (
    <div className="flex flex-1 bg-white">
      {/* Sidebar */}
      <aside className="sticky top-14 hidden lg:flex h-[calc(100vh-3.5rem)] w-64 shrink-0 flex-col border-r border-stone-200 bg-stone-50/50 overflow-y-auto">
        <div className="px-5 pt-8 pb-4">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Documentation
          </h2>
        </div>
        <nav className="flex-1 px-3 pb-8 space-y-0.5">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all ${
                active === id
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <Icon size={15} className={active === id ? "text-indigo-500" : "text-stone-400"} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main ref={contentRef} className="flex-1 overflow-y-auto">
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
          <section id="what-is-switchy" className="scroll-mt-20 mb-16">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                  <Zap size={18} className="text-indigo-500" />
                </div>
                <h1 className="text-2xl font-bold text-stone-900">What is {APP_NAME}</h1>
              </div>
              <p className="text-stone-600 leading-relaxed mb-4">
                {APP_NAME} is a real-time mode control platform for your websites and applications.
                It lets you instantly switch your app between different states — like <strong>live</strong>,{" "}
                <strong>maintenance</strong>, or a <strong>custom mode</strong> — without writing code,
                redeploying, or touching your server.
              </p>
              <p className="text-stone-600 leading-relaxed mb-4">
                Think of it as a remote control for your app&apos;s behavior. One click in the {APP_NAME}
                {" "}dashboard, and every user visiting your app sees the updated state immediately.
              </p>
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 mt-6">
                <h3 className="text-sm font-semibold text-stone-900 mb-2">Why {APP_NAME}?</h3>
                <ul className="space-y-2 text-sm text-stone-600">
                  <li className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                    <span>No redeployments needed to change app behavior</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                    <span>Works with any tech stack — React, Vue, plain HTML, mobile apps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                    <span>Sub-100ms response time for mode decisions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                    <span>Secure, rate-limited, and built for production</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </section>

          {/* Section 2: How It Works */}
          <section id="how-it-works" className="scroll-mt-20 mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
                <Layers size={18} className="text-violet-500" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900">How It Works</h2>
            </div>
            <p className="text-stone-600 leading-relaxed mb-6">
              {APP_NAME} follows a simple flow: you create a project, set a mode, and your app checks
              with {APP_NAME} to know how to behave. Here&apos;s the full picture:
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
          <section id="getting-started" className="scroll-mt-20 mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                <Rocket size={18} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900">Getting Started</h2>
            </div>

            <h3 className="text-base font-semibold text-stone-900 mt-6 mb-2">1. Sign In</h3>
            <p className="text-stone-600 leading-relaxed mb-4">
              Click <strong>Login</strong> in the top-right corner and sign in with your Google account.
              That&apos;s it — no email verification, no forms. One click and you&apos;re in.
            </p>

            <h3 className="text-base font-semibold text-stone-900 mt-6 mb-2">2. Create a Project</h3>
            <p className="text-stone-600 leading-relaxed mb-4">
              From the dashboard, click <strong>New Project</strong> and enter a name. Your project is
              created instantly with a unique public key. The default mode is set to <strong>Live</strong>.
            </p>

            <h3 className="text-base font-semibold text-stone-900 mt-6 mb-2">3. Get Your Keys</h3>
            <p className="text-stone-600 leading-relaxed mb-2">
              Click on any project to open its control center. You&apos;ll find your:
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
          <section id="integration" className="scroll-mt-20 mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                <Code2 size={18} className="text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900">Integration</h2>
            </div>
            <p className="text-stone-600 leading-relaxed mb-6">
              There are two ways to connect your app to {APP_NAME}. Choose the one that fits your stack.
            </p>

            <h3 className="text-base font-semibold text-stone-900 mt-6 mb-3">Script Tag (Easiest)</h3>
            <p className="text-stone-600 leading-relaxed mb-3">
              Add this single line to your HTML <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-mono text-stone-700">&lt;head&gt;</code> or before the closing <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-mono text-stone-700">&lt;/body&gt;</code> tag:
            </p>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 mb-2">
              <pre className="text-xs font-mono text-stone-600 whitespace-pre-wrap break-all leading-relaxed">
{`<script
  src="https://your-domain.com/switchy.js?key=YOUR_PUBLIC_KEY&project=YOUR_PROJECT_ID"
></script>`}
              </pre>
            </div>
            <p className="text-sm text-stone-500 mb-6">
              The script automatically checks the current mode and shows an overlay for maintenance or custom modes.
              If the mode is <strong>live</strong>, nothing happens — your app runs normally.
            </p>

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
          <section id="modes" className="scroll-mt-20 mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                <ToggleLeft size={18} className="text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900">Modes</h2>
            </div>
            <p className="text-stone-600 leading-relaxed mb-6">
              Every project has a mode that defines how your app should behave. You can switch
              between modes instantly from the dashboard.
            </p>

            <div className="space-y-4">
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <h4 className="text-sm font-semibold text-stone-900">Live</h4>
                </div>
                <p className="text-sm text-stone-600">
                  Your app runs normally. No overlay, no interruptions. This is the default mode for
                  every new project. Use it when everything is working as expected.
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <h4 className="text-sm font-semibold text-stone-900">Maintenance</h4>
                </div>
                <p className="text-sm text-stone-600">
                  Shows a maintenance overlay to all visitors. Use it during deployments, database
                  migrations, or any time you need to temporarily take your app offline. The script
                  integration displays a clean, branded maintenance screen automatically.
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                  <h4 className="text-sm font-semibold text-stone-900">Custom</h4>
                </div>
                <p className="text-sm text-stone-600 mb-3">
                  Full control over the message, button text, and redirect URL. Use it for
                  announcements, beta access gates, A/B routing, or any custom behavior you need.
                </p>
                <div className="text-sm text-stone-600">
                  <p className="font-medium text-stone-700 mb-1">Configurable fields:</p>
                  <ul className="space-y-1 ml-4">
                    <li className="flex items-start gap-2">
                      <ChevronRight size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                      <span><strong>Message</strong> — text shown to users (up to 500 chars)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                      <span><strong>Button Text</strong> — label for the action button</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                      <span><strong>Redirect URL</strong> — where the button takes users</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Examples */}
          <section id="examples" className="scroll-mt-20 mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50">
                <Lightbulb size={18} className="text-cyan-500" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900">Examples</h2>
            </div>
            <p className="text-stone-600 leading-relaxed mb-6">
              Here are real-world scenarios where {APP_NAME} fits perfectly.
            </p>

            <div className="space-y-4">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Scheduled Maintenance</h4>
                <p className="text-sm text-stone-600">
                  You&apos;re pushing a database migration at 2 AM. Switch to <strong>Maintenance</strong> mode
                  before you start, run your migration, verify everything works, then switch back to{" "}
                  <strong>Live</strong>. No code changes. No deploy.
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Emergency Kill Switch</h4>
                <p className="text-sm text-stone-600">
                  Your app has a critical bug in production. Switch to <strong>Maintenance</strong> instantly
                  while your team works on a fix. Users see a clean message instead of broken pages.
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Launch Countdown</h4>
                <p className="text-sm text-stone-600">
                  Use <strong>Custom</strong> mode to show a &quot;Coming Soon&quot; page with a redirect to your
                  waitlist. When you&apos;re ready to launch, flip to <strong>Live</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Multi-App Control</h4>
                <p className="text-sm text-stone-600">
                  Managing multiple services? Create a project for each one. Control your marketing site,
                  API docs, and admin panel independently from a single dashboard.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Best Practices */}
          <section id="best-practices" className="scroll-mt-20 mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
                <Shield size={18} className="text-rose-500" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900">Best Practices</h2>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Keep your public key safe</h4>
                <p className="text-sm text-stone-600">
                  Your public key is meant for client-side use, but avoid exposing it unnecessarily.
                  It identifies your project and is tied to rate limiting.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Use maintenance mode proactively</h4>
                <p className="text-sm text-stone-600">
                  Don&apos;t wait for things to break. Before every deploy or migration, switch to
                  maintenance mode. It takes one click and saves you from showing broken states.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Test your integration</h4>
                <p className="text-sm text-stone-600">
                  After adding the script tag or API call, switch modes from the dashboard and verify
                  your app responds correctly. Test all three modes before going live.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-stone-900 mb-1">One project per app</h4>
                <p className="text-sm text-stone-600">
                  Create separate projects for each application or service. This gives you independent
                  mode control and cleaner organization.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Handle API errors gracefully</h4>
                <p className="text-sm text-stone-600">
                  If using the API directly, always handle the case where {APP_NAME} is unreachable.
                  Default to showing your app normally (fail open) rather than blocking users.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-stone-900 mb-1">Rate limits</h4>
                <p className="text-sm text-stone-600">
                  The decision API allows 60 requests per minute per IP per project. This is more than
                  enough for normal usage. If you exceed this, responses return a 429 status.
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-stone-200 pt-8 mt-8">
            <p className="text-sm text-stone-400 text-center">
              {APP_NAME} Documentation &middot; Built for developers who ship fast
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
