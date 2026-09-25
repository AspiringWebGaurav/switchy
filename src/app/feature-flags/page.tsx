import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Clock, Code2, ToggleLeft, Rocket } from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/config/seo";

export const metadata: Metadata = {
  title: "Feature Flags",
  description:
    "Implement feature flags in your app with Switchyy. Control feature rollouts, A/B tests, and app behavior in real-time without redeploying.",
  keywords: [
    "feature flags",
    "feature flag service",
    "feature toggles",
    "feature management",
    "remote config",
    "feature rollout",
  ],
  alternates: {
    canonical: `${SITE_URL}/feature-flags`,
  },
  openGraph: {
    title: `Feature Flags | ${SITE_NAME}`,
    description:
      "Implement feature flags in your app with Switchyy. Control feature rollouts in real-time.",
    url: `${SITE_URL}/feature-flags`,
  },
};

export default function FeatureFlagsPage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-indigo-50/50 to-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
            <ToggleLeft size={16} />
            Feature Flags
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-6">
            Feature Flags for Modern Apps
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
            Control which features are visible to your users in real-time. No code changes, 
            no redeployments. Just flip a switch and your app responds instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Get Started Free
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/docs/feature-flags"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-stone-700 font-medium hover:bg-stone-50 transition-colors"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      </section>

      {/* What are Feature Flags */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 mb-6">
            What Are Feature Flags?
          </h2>
          <p className="text-lg text-stone-600 mb-6">
            Feature flags (also known as feature toggles) are a software development technique 
            that allows you to enable or disable features in your application without deploying 
            new code. They give you control over what users see and when they see it.
          </p>
          <p className="text-lg text-stone-600 mb-8">
            With {SITE_NAME}, implementing feature flags is simple. Create a project, set your 
            modes, and your app automatically responds to changes in real-time via our SSE 
            (Server-Sent Events) connection.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Zap,
                title: "Instant Updates",
                desc: "Changes propagate to all connected clients in milliseconds via SSE.",
              },
              {
                icon: Shield,
                title: "Safe Rollouts",
                desc: "Test features with specific users before rolling out to everyone.",
              },
              {
                icon: Clock,
                title: "Kill Switch Ready",
                desc: "Instantly disable problematic features without emergency deploys.",
              },
              {
                icon: Code2,
                title: "Any Tech Stack",
                desc: "Works with React, Vue, Angular, plain HTML, and mobile apps.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 p-5 rounded-xl border border-stone-200 bg-white"
              >
                <div className="shrink-0 h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <feature.icon size={20} className="text-indigo-600" />
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

      {/* Use Cases */}
      <section className="py-16 px-6 bg-stone-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 mb-8">
            Common Use Cases
          </h2>
          <div className="space-y-6">
            {[
              {
                title: "Gradual Feature Rollout",
                desc: "Release new features to a small percentage of users first, then gradually increase as you gain confidence.",
              },
              {
                title: "A/B Testing",
                desc: "Show different versions of a feature to different user groups and measure which performs better.",
              },
              {
                title: "Emergency Kill Switch",
                desc: "Instantly disable a feature that's causing issues without rolling back your entire deployment.",
              },
              {
                title: "Beta Programs",
                desc: "Give early access to new features for beta testers while keeping them hidden from regular users.",
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
          <Rocket className="mx-auto text-indigo-600 mb-4" size={40} />
          <h2 className="text-3xl font-bold text-stone-900 mb-4">
            Ready to Implement Feature Flags?
          </h2>
          <p className="text-lg text-stone-600 mb-8 max-w-xl mx-auto">
            Get started in under 5 minutes. No credit card required.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Start Using Feature Flags
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
              href="/maintenance-mode"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Maintenance Mode →
            </Link>
            <Link
              href="/real-time-mode-switching"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Real-Time Mode Switching →
            </Link>
            <Link
              href="/docs/feature-flags"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Feature Flags Documentation →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
