import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Code2, Zap, ToggleLeft } from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/config/seo";

export const metadata: Metadata = {
  title: "Feature Flags",
  description: `Complete guide to implementing feature flags with ${SITE_NAME}. Learn how to control feature visibility, rollouts, and A/B tests in real-time.`,
  alternates: {
    canonical: `${SITE_URL}/docs/feature-flags`,
  },
};

export default function DocsFeatureFlagsPage() {
  return (
    <div className="flex-1 bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-stone-500 mb-8">
          <Link href="/docs" className="hover:text-stone-700">
            Docs
          </Link>
          <span>/</span>
          <span className="text-stone-900 font-medium">Feature Flags</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <ToggleLeft className="text-indigo-600" size={20} />
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Feature Flags Guide</h1>
        </div>

        <p className="text-lg text-stone-600 mb-8">
          Learn how to use {SITE_NAME} as a feature flag system for your applications. 
          Control what features users see without deploying new code.
        </p>

        {/* Content */}
        <div className="prose prose-stone max-w-none">
          <h2 id="overview">Overview</h2>
          <p>
            Feature flags in {SITE_NAME} work through our mode system. While traditional 
            feature flag services give you boolean toggles, {SITE_NAME} provides mode-based 
            control that&apos;s perfect for common use cases like maintenance windows, staged 
            rollouts, and emergency shutdowns.
          </p>

          <h2 id="how-it-works">How Feature Flags Work</h2>
          <p>
            When your app loads, it connects to {SITE_NAME} and receives the current mode 
            for your project. Based on this mode, you can:
          </p>
          <ul>
            <li>Show or hide entire features</li>
            <li>Display maintenance pages</li>
            <li>Redirect users to different URLs</li>
            <li>Show custom messages</li>
          </ul>

          <h2 id="implementation">Implementation</h2>
          <h3>Option 1: Script Tag (Easiest)</h3>
          <p>
            Add our script to your HTML and we&apos;ll handle everything automatically:
          </p>
          <pre className="bg-stone-900 text-stone-100 p-4 rounded-lg overflow-x-auto">
            <code>{`<script 
  src="https://switchyy.vercel.app/switchy.js?key=YOUR_KEY&project=YOUR_ID"
></script>`}</code>
          </pre>

          <h3>Option 2: API Integration</h3>
          <p>
            For more control, call our decision API directly:
          </p>
          <pre className="bg-stone-900 text-stone-100 p-4 rounded-lg overflow-x-auto">
            <code>{`const response = await fetch(
  'https://switchyy.vercel.app/api/v1/decide?projectId=YOUR_ID&key=YOUR_KEY'
);
const { data } = await response.json();

if (data.mode === 'maintenance') {
  // Show maintenance page
} else if (data.mode === 'custom') {
  // Handle custom mode with data.message, data.redirect
} else {
  // Normal operation (live mode)
}`}</code>
          </pre>

          <h2 id="real-time-updates">Real-Time Updates</h2>
          <p>
            When you change a mode in the dashboard, all connected clients receive the 
            update instantly via Server-Sent Events. No polling required.
          </p>
          <div className="not-prose my-6 p-4 rounded-lg border border-blue-200 bg-blue-50">
            <div className="flex gap-3">
              <Zap className="text-blue-600 shrink-0" size={20} />
              <div>
                <p className="font-medium text-blue-900">Pro Tip</p>
                <p className="text-sm text-blue-700 mt-1">
                  Our script handles SSE connections automatically. If you&apos;re using the API 
                  directly, connect to <code>/api/v1/events/[projectId]</code> for real-time updates.
                </p>
              </div>
            </div>
          </div>

          <h2 id="best-practices">Best Practices</h2>
          <ul>
            <li>
              <strong>Fail open:</strong> If {SITE_NAME} is unreachable, default to showing 
              your app normally.
            </li>
            <li>
              <strong>Cache decisions:</strong> Our API responses include cache headers. 
              Respect them to reduce latency.
            </li>
            <li>
              <strong>Test all modes:</strong> Before going live, test how your app behaves 
              in each mode.
            </li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-stone-200">
          <Link
            href="/docs"
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft size={16} />
            Back to Docs
          </Link>
          <Link
            href="/docs/mode-switching"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Mode Switching
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Related Links */}
        <div className="mt-8 p-6 rounded-xl bg-stone-50 border border-stone-200">
          <h3 className="font-semibold text-stone-900 mb-3">Related Resources</h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/feature-flags"
              className="text-indigo-600 hover:underline text-sm"
            >
              Feature Flags Overview →
            </Link>
            <Link
              href="/docs/architecture"
              className="text-indigo-600 hover:underline text-sm"
            >
              Architecture Deep Dive →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
