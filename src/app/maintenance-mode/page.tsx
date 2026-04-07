import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Wrench, Clock, Bell, Shield, Palette, Rocket } from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/config/seo";

export const metadata: Metadata = {
  title: "Maintenance Mode",
  description:
    "Add a professional maintenance mode page to your website instantly. Show custom messages, estimated return times, and redirect users — all without code changes.",
  keywords: [
    "maintenance mode",
    "maintenance page",
    "website maintenance",
    "under maintenance",
    "maintenance mode for websites",
    "scheduled maintenance",
  ],
  alternates: {
    canonical: `${SITE_URL}/maintenance-mode`,
  },
  openGraph: {
    title: `Maintenance Mode | ${SITE_NAME}`,
    description:
      "Add a professional maintenance mode page to your website instantly.",
    url: `${SITE_URL}/maintenance-mode`,
  },
};

export default function MaintenanceModePage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-amber-50/50 to-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-700 mb-6">
            <Wrench size={16} />
            Maintenance Mode
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-6">
            Professional Maintenance Pages in Seconds
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
            Switch your entire site to maintenance mode with one click. Show custom messages, 
            estimated return times, and keep users informed — no code changes required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-white font-medium hover:bg-amber-700 transition-colors"
            >
              Get Started Free
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/docs/mode-switching"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-stone-700 font-medium hover:bg-stone-50 transition-colors"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* What is Maintenance Mode */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 mb-6">
            What Is Maintenance Mode?
          </h2>
          <p className="text-lg text-stone-600 mb-6">
            Maintenance mode is a feature that lets you temporarily take your website offline 
            and show visitors a friendly message instead of your regular content. It&apos;s essential 
            for scheduled updates, emergency fixes, or major deployments.
          </p>
          <p className="text-lg text-stone-600 mb-8">
            With {SITE_NAME}, you can activate maintenance mode instantly from your dashboard. 
            Your site displays a professional maintenance page while you work on updates, and 
            goes back live the moment you&apos;re ready — all in real-time.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Clock,
                title: "Instant Activation",
                desc: "One click to enable. No waiting for deployments or cache clearing.",
              },
              {
                icon: Bell,
                title: "Custom Messages",
                desc: "Show your own message, estimated return time, and contact info.",
              },
              {
                icon: Palette,
                title: "Beautiful Design",
                desc: "Professional maintenance pages that match your brand automatically.",
              },
              {
                icon: Shield,
                title: "Zero Risk",
                desc: "Your actual code stays untouched. Just the overlay changes.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 p-5 rounded-xl border border-stone-200 bg-white"
              >
                <div className="shrink-0 h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <feature.icon size={20} className="text-amber-600" />
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

      {/* When to Use */}
      <section className="py-16 px-6 bg-stone-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 mb-8">
            When to Use Maintenance Mode
          </h2>
          <div className="space-y-6">
            {[
              {
                title: "Scheduled Updates",
                desc: "Deploying a major update? Put your site in maintenance mode first to avoid showing broken pages during the transition.",
              },
              {
                title: "Database Migrations",
                desc: "Running migrations that might cause temporary data inconsistencies? Keep users out until it's safe.",
              },
              {
                title: "Emergency Fixes",
                desc: "Found a critical bug in production? Switch to maintenance mode instantly while your team works on a fix.",
              },
              {
                title: "Third-Party Outages",
                desc: "When a critical service your app depends on goes down, show a maintenance page instead of error messages.",
              },
            ].map((useCase) => (
              <div
                key={useCase.title}
                className="p-6 rounded-xl border border-stone-200 bg-white"
              >
                <h3 className="font-semibold text-stone-900 mb-2">{useCase.title}</h3>
                <p className="text-stone-600">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Rocket className="mx-auto text-amber-600 mb-4" size={40} />
          <h2 className="text-3xl font-bold text-stone-900 mb-4">
            Never Show Broken Pages Again
          </h2>
          <p className="text-lg text-stone-600 mb-8 max-w-xl mx-auto">
            Set up maintenance mode in under 5 minutes. Free to start.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-8 py-4 text-white font-medium hover:bg-amber-700 transition-colors"
          >
            Add Maintenance Mode
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
              className="text-amber-600 hover:text-amber-800 font-medium"
            >
              Feature Flags →
            </Link>
            <Link
              href="/real-time-mode-switching"
              className="text-amber-600 hover:text-amber-800 font-medium"
            >
              Real-Time Mode Switching →
            </Link>
            <Link
              href="/docs/mode-switching"
              className="text-amber-600 hover:text-amber-800 font-medium"
            >
              Mode Switching Documentation →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
