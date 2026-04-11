import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Server, Box } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works",
  description: "Learn how Switchyy's real-time architecture delivers instant updates without redeployments.",
};

export default function HowItWorksPage() {
  return (
    <>
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-gradient-to-r from-indigo-50 to-violet-50 px-3 py-1.5 text-sm text-indigo-700 shadow-sm shadow-indigo-100 mb-6 font-medium">
          Architecture & Flow
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl mb-6">How Switchyy Works</h1>
        <p className="text-lg text-zinc-600 leading-relaxed max-w-2xl">
          Switchyy is engineered to sit securely between your application and your users, allowing you 
          to toggle features, enforce maintenance modes, and manage configurations instantly—without 
          ever writing a line of code or waiting for a CI/CD pipeline.
        </p>
      </div>
      
      <div className="space-y-16 text-zinc-600 leading-relaxed text-base">
        
        {/* Step 1 */}
        <section className="relative">
          <div className="absolute top-0 left-6 bottom-0 w-px bg-indigo-100 hidden sm:block"></div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-6 sm:gap-10">
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-indigo-200 shadow-sm text-indigo-600">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">1. Connect Your Application</h2>
              <p className="mb-4">
                You begin by importing our ultra-lightweight SDK into your project (React, Next.js, Node, etc.). 
                With a single API key, your application creates a secure, persistent connection to the Switchyy 
                edge network.
              </p>
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-100 font-mono text-sm text-zinc-500">
                {`import { SwitchyyProvider } from '@switchyy/react';`}
              </div>
            </div>
          </div>
        </section>

        {/* Step 2 */}
        <section className="relative">
          <div className="absolute top-0 left-6 bottom-0 w-px bg-indigo-100 hidden sm:block"></div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-6 sm:gap-10">
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-indigo-200 shadow-sm text-indigo-600">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">2. Manage via Dashboard</h2>
              <p>
                Inside the Switchyy dashboard, you map out your application&apos;s features. You can create boolean 
                toggles (Feature Flags), configure master switches (Maintenance Mode), or set up granular 
                rules for specific user segments. Whenever you flip a switch, the dashboard commits the change 
                to our distributed state.
              </p>
            </div>
          </div>
        </section>

        {/* Step 3 */}
        <section className="relative">
          <div className="relative z-10 flex flex-col sm:flex-row gap-6 sm:gap-10">
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md text-white">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 mb-3">3. Real-Time Edge Synchronization</h2>
              <p className="mb-6">
                Our globally distributed edge network receives your state change instantly. Thanks to WebSockets 
                and Server-Sent Events (SSE), the Switchyy SDK in your application acts defensively. Sub-100ms 
                after you click &quot;Save&quot;, the new configuration is broadcasted to all active instances of your app.
                The UI adapts in real-time—no refresh required.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 transition-all"
                >
                  Try it for free
                  <ArrowRight size={16} />
                </Link>
                <Link 
                  href="/docs/architecture" 
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 transition-all"
                >
                  Read Advanced Architecture
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
