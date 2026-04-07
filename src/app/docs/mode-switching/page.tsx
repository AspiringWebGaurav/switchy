import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ToggleLeft, Info } from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/config/seo";

export const metadata: Metadata = {
  title: "Mode Switching",
  description: `Learn about the different modes in ${SITE_NAME}: Live, Maintenance, Custom, and 19 more. Understand when to use each mode and how to configure them.`,
  alternates: {
    canonical: `${SITE_URL}/docs/mode-switching`,
  },
};

export default function DocsModeSwitchingPage() {
  return (
    <div className="flex-1 bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-stone-500 mb-8">
          <Link href="/docs" className="hover:text-stone-700">
            Docs
          </Link>
          <span>/</span>
          <span className="text-stone-900 font-medium">Mode Switching</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
            <ToggleLeft className="text-violet-600" size={20} />
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Mode Switching Guide</h1>
        </div>

        <p className="text-lg text-stone-600 mb-8">
          {SITE_NAME} offers 22 built-in modes organized into categories. Learn what each 
          mode does and when to use it.
        </p>

        {/* Content */}
        <div className="prose prose-stone max-w-none">
          <h2 id="core-modes">Core Modes</h2>
          <p>
            These are the three primary modes you&apos;ll use most often:
          </p>

          <div className="not-prose grid gap-4 my-6">
            {[
              {
                name: "Live",
                color: "bg-emerald-500",
                desc: "Your app runs normally. No overlay or interruption. This is the default mode.",
              },
              {
                name: "Maintenance",
                color: "bg-amber-500",
                desc: "Shows a maintenance page overlay. Users see your custom message but can't access the app.",
              },
              {
                name: "Custom",
                color: "bg-violet-500",
                desc: "Display any message, button text, and redirect URL. Full flexibility for any scenario.",
              },
            ].map((mode) => (
              <div
                key={mode.name}
                className="flex items-start gap-4 p-4 rounded-lg border border-stone-200"
              >
                <span className={`h-3 w-3 rounded-full ${mode.color} mt-1.5`} />
                <div>
                  <h4 className="font-semibold text-stone-900">{mode.name}</h4>
                  <p className="text-sm text-stone-600 mt-1">{mode.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 id="mode-categories">All Mode Categories</h2>
          
          <h3>Status Modes</h3>
          <p>General status indicators for your app:</p>
          <ul>
            <li><strong>Offline</strong> — Intentionally taken offline</li>
            <li><strong>Preview</strong> — Staging/preview environment</li>
          </ul>

          <h3>Away & Leave Modes</h3>
          <p>Perfect for solo developers and small teams:</p>
          <ul>
            <li><strong>On Leave</strong> — Extended absence</li>
            <li><strong>Be Right Back</strong> — Short break</li>
            <li><strong>Vacation</strong> — Holiday period</li>
            <li><strong>Focus Mode</strong> — Deep work, no interruptions</li>
          </ul>

          <h3>Work Modes</h3>
          <p>Development and deployment states:</p>
          <ul>
            <li><strong>Working</strong> — Active development</li>
            <li><strong>Launching Soon</strong> — Pre-launch state</li>
            <li><strong>Migrating</strong> — Data migration in progress</li>
            <li><strong>Deploying</strong> — Deployment in progress</li>
          </ul>

          <h3>Incident Modes</h3>
          <p>For outages and issues:</p>
          <ul>
            <li><strong>Incident</strong> — Active incident being investigated</li>
            <li><strong>Degraded</strong> — Partial functionality available</li>
            <li><strong>Outage</strong> — Complete service outage</li>
          </ul>

          <h3>Business Modes</h3>
          <p>Business-related states:</p>
          <ul>
            <li><strong>Closed</strong> — Business closed</li>
            <li><strong>Coming Soon</strong> — Pre-launch landing</li>
            <li><strong>Paused</strong> — Temporarily paused</li>
            <li><strong>Moved</strong> — Redirecting to new location</li>
            <li><strong>Beta</strong> — Beta testing phase</li>
            <li><strong>Holiday</strong> — Holiday closure</li>
          </ul>

          <h2 id="switching-modes">How to Switch Modes</h2>
          <ol>
            <li>Go to your project dashboard</li>
            <li>Click on the &quot;Modes&quot; tab</li>
            <li>Select your desired mode from the grid</li>
            <li>Optionally customize the message, button text, and redirect URL</li>
            <li>Click &quot;Save&quot; — changes apply instantly</li>
          </ol>

          <div className="not-prose my-6 p-4 rounded-lg border border-blue-200 bg-blue-50">
            <div className="flex gap-3">
              <Info className="text-blue-600 shrink-0" size={20} />
              <div>
                <p className="font-medium text-blue-900">Real-Time Updates</p>
                <p className="text-sm text-blue-700 mt-1">
                  Mode changes propagate to all connected clients instantly via SSE. 
                  No page refresh required.
                </p>
              </div>
            </div>
          </div>

          <h2 id="custom-presets">Custom Presets</h2>
          <p>
            Save your frequently used configurations as presets. Each preset stores:
          </p>
          <ul>
            <li>Preset name</li>
            <li>Custom message</li>
            <li>Button text</li>
            <li>Redirect URL</li>
          </ul>
          <p>
            Switch between presets with one click instead of re-entering the same 
            information each time.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-stone-200">
          <Link
            href="/docs/feature-flags"
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft size={16} />
            Feature Flags
          </Link>
          <Link
            href="/docs/architecture"
            className="flex items-center gap-2 text-violet-600 hover:text-violet-800 font-medium"
          >
            Architecture
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Related Links */}
        <div className="mt-8 p-6 rounded-xl bg-stone-50 border border-stone-200">
          <h3 className="font-semibold text-stone-900 mb-3">Related Resources</h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/maintenance-mode"
              className="text-violet-600 hover:underline text-sm"
            >
              Maintenance Mode Overview →
            </Link>
            <Link
              href="/real-time-mode-switching"
              className="text-violet-600 hover:underline text-sm"
            >
              Real-Time Switching →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
