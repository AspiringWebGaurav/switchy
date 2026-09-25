import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Radio, Zap, Globe, RefreshCw, Server, Rocket } from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/config/seo";

export const metadata: Metadata = {
  title: "Real-Time Mode Switching",
  description:
    "Switch your app between modes instantly with Switchyy's real-time SSE technology. No page refresh needed — changes propagate to all users in milliseconds.",
  keywords: [
    "real-time mode switching",
    "instant mode control",
    "server-sent events",
    "SSE",
    "live updates",
    "real-time config",
  ],
  alternates: {
    canonical: `${SITE_URL}/real-time-mode-switching`,
  },
  openGraph: {
    title: `Real-Time Mode Switching | ${SITE_NAME}`,
    description:
      "Switch your app between modes instantly with real-time SSE technology.",
    url: `${SITE_URL}/real-time-mode-switching`,
  },
};

export default function RealTimeModeSwitchingPage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-violet-50/50 to-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-medium text-violet-700 mb-6">
            <Radio size={16} />
            Real-Time Updates
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-6">
            Instant Mode Switching Across All Users
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
            Change your app&apos;s mode from the dashboard and watch it update everywhere instantly. 
            No page refresh. No polling. Just real-time Server-Sent Events magic.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-white font-medium hover:bg-violet-700 transition-colors"
            >
              Try It Now
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/docs/architecture"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-stone-700 font-medium hover:bg-stone-50 transition-colors"
            >
              Learn the Architecture
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 mb-6">
            How Real-Time Switching Works
          </h2>
          <p className="text-lg text-stone-600 mb-6">
            {SITE_NAME} uses Server-Sent Events (SSE) to maintain a persistent connection between 
            your app and our servers. When you change a mode in the dashboard, we push the update 
            to every connected client instantly.
          </p>
          <p className="text-lg text-stone-600 mb-8">
            This means your users see mode changes the moment they happen — no waiting for the 
            next API poll, no manual refresh required. It&apos;s the fastest way to control your 
            app&apos;s behavior.
          </p>

          <div className="space-y-4 mb-10">
            {[
              {
                step: "1",
                title: "User Visits Your App",
                desc: "Our script establishes an SSE connection to Switchyy servers.",
              },
              {
                step: "2",
                title: "You Change the Mode",
                desc: "From your dashboard, switch to maintenance, custom, or any other mode.",
              },
              {
                step: "3",
                title: "Instant Broadcast",
                desc: "Switchyy pushes the update to all connected clients in milliseconds.",
              },
              {
                step: "4",
                title: "App Updates Immediately",
                desc: "Your app receives the event and shows the new mode instantly.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-4 p-5 rounded-xl border border-stone-200 bg-white"
              >
                <div className="shrink-0 h-10 w-10 rounded-lg bg-violet-500 flex items-center justify-center text-white font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-stone-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Zap,
                title: "Sub-100ms Latency",
                desc: "Mode changes propagate faster than you can blink.",
              },
              {
                icon: Globe,
                title: "Works Everywhere",
                desc: "SSE is supported in all modern browsers and can be polyfilled for older ones.",
              },
              {
                icon: RefreshCw,
                title: "Auto-Reconnect",
                desc: "Lost connection? The client automatically reconnects and syncs the latest state.",
              },
              {
                icon: Server,
                title: "Edge-Optimized",
                desc: "Our infrastructure is globally distributed for minimal latency.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 p-5 rounded-xl border border-stone-200 bg-white"
              >
                <div className="shrink-0 h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <feature.icon size={20} className="text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-stone-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why SSE */}
      <section className="py-16 px-6 bg-stone-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 mb-8">
            Why Server-Sent Events?
          </h2>
          <div className="prose prose-stone max-w-none">
            <p className="text-lg text-stone-600 mb-6">
              We chose SSE over WebSockets for several reasons:
            </p>
            <ul className="space-y-3 text-stone-600">
              <li>
                <strong>Simpler protocol</strong> — SSE works over standard HTTP, making it 
                easier to deploy behind load balancers and proxies.
              </li>
              <li>
                <strong>Automatic reconnection</strong> — Built into the browser, no custom 
                retry logic needed.
              </li>
              <li>
                <strong>One-way is enough</strong> — For mode updates, we only need server → 
                client communication.
              </li>
              <li>
                <strong>Better compatibility</strong> — Works with HTTP/2, CDNs, and existing 
                infrastructure.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Rocket className="mx-auto text-violet-600 mb-4" size={40} />
          <h2 className="text-3xl font-bold text-stone-900 mb-4">
            Experience Real-Time Control
          </h2>
          <p className="text-lg text-stone-600 mb-8 max-w-xl mx-auto">
            See how fast mode switching can be. Set up in under 5 minutes.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-8 py-4 text-white font-medium hover:bg-violet-700 transition-colors"
          >
            Get Started Free
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Internal Links */}
      <section className="py-12 px-6 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
            Related Pages
          </h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/feature-flags"
              className="text-violet-600 hover:text-violet-800 font-medium"
            >
              Feature Flags →
            </Link>
            <Link
              href="/maintenance-mode"
              className="text-violet-600 hover:text-violet-800 font-medium"
            >
              Maintenance Mode →
            </Link>
            <Link
              href="/docs/architecture"
              className="text-violet-600 hover:text-violet-800 font-medium"
            >
              Architecture Documentation →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
