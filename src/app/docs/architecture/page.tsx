import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Server, Database, Radio, Shield } from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/config/seo";

export const metadata: Metadata = {
  title: "Architecture",
  description: `Deep dive into ${SITE_NAME}'s architecture. Learn about our SSE infrastructure, caching strategy, and how we achieve sub-100ms response times.`,
  alternates: {
    canonical: `${SITE_URL}/docs/architecture`,
  },
};

export default function DocsArchitecturePage() {
  return (
    <div className="flex-1 bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-stone-500 mb-8">
          <Link href="/docs" className="hover:text-stone-700">
            Docs
          </Link>
          <span>/</span>
          <span className="text-stone-900 font-medium">Architecture</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
            <Server className="text-rose-600" size={20} />
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Architecture Overview</h1>
        </div>

        <p className="text-lg text-stone-600 mb-8">
          A deep dive into how {SITE_NAME} achieves real-time updates, low latency, 
          and high reliability.
        </p>

        {/* Content */}
        <div className="prose prose-stone max-w-none">
          <h2 id="overview">System Overview</h2>
          <p>
            {SITE_NAME} is built on a modern serverless architecture designed for 
            speed, reliability, and scalability. Here&apos;s how the pieces fit together:
          </p>

          <div className="not-prose grid sm:grid-cols-2 gap-4 my-6">
            {[
              {
                icon: Server,
                title: "Edge Functions",
                desc: "API routes run on Vercel Edge for global low-latency responses.",
                color: "bg-blue-100 text-blue-600",
              },
              {
                icon: Database,
                title: "Firestore + Redis",
                desc: "Firestore for persistence, Redis for caching and real-time events.",
                color: "bg-green-100 text-green-600",
              },
              {
                icon: Radio,
                title: "SSE Broadcasting",
                desc: "Server-Sent Events push updates to all connected clients instantly.",
                color: "bg-violet-100 text-violet-600",
              },
              {
                icon: Shield,
                title: "Rate Limiting",
                desc: "Redis-backed rate limiting protects against abuse (60 req/min/IP).",
                color: "bg-amber-100 text-amber-600",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 p-4 rounded-lg border border-stone-200"
              >
                <div className={`h-10 w-10 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                  <item.icon size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-stone-900">{item.title}</h4>
                  <p className="text-sm text-stone-600 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 id="request-flow">Request Flow</h2>
          <p>
            When your app makes a decision request, here&apos;s what happens:
          </p>
          <ol>
            <li>
              <strong>Request hits edge</strong> — Your request arrives at the nearest 
              Vercel edge location.
            </li>
            <li>
              <strong>Cache check</strong> — We first check Redis for a cached decision 
              (30-second TTL).
            </li>
            <li>
              <strong>Database fallback</strong> — On cache miss, we fetch from Firestore 
              and cache the result.
            </li>
            <li>
              <strong>Response</strong> — The decision is returned with appropriate 
              cache headers.
            </li>
          </ol>
          <p>
            Average response time: <strong>&lt;100ms</strong> globally, often &lt;50ms 
            with cache hits.
          </p>

          <h2 id="sse-architecture">Real-Time Updates (SSE)</h2>
          <p>
            Our real-time update system uses Server-Sent Events for efficient one-way 
            communication:
          </p>
          <ol>
            <li>
              <strong>Client connects</strong> — Your app opens an SSE connection to 
              <code>/api/v1/events/[projectId]</code>.
            </li>
            <li>
              <strong>Mode change</strong> — When you update a mode in the dashboard, 
              we write to both Firestore and Redis.
            </li>
            <li>
              <strong>Event broadcast</strong> — An in-memory event bus notifies all 
              SSE connections for that project.
            </li>
            <li>
              <strong>Client receives</strong> — Your app receives the update and 
              reacts immediately.
            </li>
          </ol>

          <h3>Why SSE over WebSockets?</h3>
          <ul>
            <li>
              <strong>Simpler</strong> — Works over standard HTTP, easier to deploy 
              and debug.
            </li>
            <li>
              <strong>Auto-reconnect</strong> — Built into the browser specification.
            </li>
            <li>
              <strong>Sufficient</strong> — We only need server → client updates.
            </li>
            <li>
              <strong>Compatible</strong> — Works with HTTP/2, proxies, and CDNs.
            </li>
          </ul>

          <h2 id="caching-strategy">Caching Strategy</h2>
          <p>
            We use a multi-layer caching approach:
          </p>
          <table>
            <thead>
              <tr>
                <th>Layer</th>
                <th>TTL</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Redis (decision cache)</td>
                <td>30 seconds</td>
                <td>Reduce Firestore reads for hot paths</td>
              </tr>
              <tr>
                <td>Redis (event store)</td>
                <td>300 seconds</td>
                <td>SSE replay for reconnecting clients</td>
              </tr>
              <tr>
                <td>Redis (blocked cache)</td>
                <td>5 seconds</td>
                <td>Brief cache for paused projects</td>
              </tr>
            </tbody>
          </table>

          <h2 id="rate-limiting">Rate Limiting</h2>
          <p>
            To protect the service and ensure fair usage, we implement rate limiting:
          </p>
          <ul>
            <li><strong>Limit:</strong> 60 requests per minute per IP per project</li>
            <li><strong>Implementation:</strong> Redis-backed sliding window</li>
            <li><strong>Response:</strong> 429 Too Many Requests when exceeded</li>
          </ul>

          <h2 id="security">Security</h2>
          <ul>
            <li>
              <strong>Public keys</strong> — Safe to expose in client-side code, 
              scoped to specific projects.
            </li>
            <li>
              <strong>HTTPS only</strong> — All API endpoints require TLS.
            </li>
            <li>
              <strong>No sensitive data</strong> — Mode decisions contain only public 
              information.
            </li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-stone-200">
          <Link
            href="/docs/mode-switching"
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft size={16} />
            Mode Switching
          </Link>
          <Link
            href="/docs"
            className="flex items-center gap-2 text-rose-600 hover:text-rose-800 font-medium"
          >
            Back to Docs
          </Link>
        </div>

        {/* Related Links */}
        <div className="mt-8 p-6 rounded-xl bg-stone-50 border border-stone-200">
          <h3 className="font-semibold text-stone-900 mb-3">Related Resources</h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/real-time-mode-switching"
              className="text-rose-600 hover:underline text-sm"
            >
              Real-Time Mode Switching →
            </Link>
            <Link
              href="/docs/feature-flags"
              className="text-rose-600 hover:underline text-sm"
            >
              Feature Flags Guide →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
