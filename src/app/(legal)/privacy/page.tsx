import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Switchyy",
};

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl mb-4">Privacy Policy</h1>
      <p className="text-sm text-zinc-500 mb-8 border-b border-zinc-100 pb-8">Last Updated: March {new Date().getFullYear()}</p>
      
      <div className="space-y-8 text-zinc-600 leading-relaxed text-base">
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3 mt-8">Introduction</h2>
          <p>
            At Switchyy, we take your privacy seriously. This Privacy Policy details the types of personal 
            information we collect, how we use it, and the steps we take to ensure your data is secure 
            when you use our dashboard and API products.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3 mt-8">Information We Collect</h2>
          <p className="mb-4">
            To provide our real-time infrastructure, we collect technical and account information:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-600">
            <li><strong>Account Data:</strong> Email addresses and authentication tokens when you register for the Switchyy dashboard.</li>
            <li><strong>Telemetry Data:</strong> Request metadata (e.g., API hit counts, latency, and origin IP address) solely to enforce rate limits and analyze system health.</li>
            <li><strong>Project Data:</strong> The names, flags, and configurations of your Switchyy projects.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3 mt-8">How We Use Your Data</h2>
          <p>
            We process your information strictly to maintain and improve the Service. We do not sell 
            your personal information, project data, or user telemetry to third parties. Your data is 
            used to authorize API requests, deploy features across our edge network, process subscriptions, 
            and send service-critical notifications.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3 mt-8">Cookies and Tracking</h2>
          <p>
            Our web dashboard uses strictly necessary cookies to maintain your authenticated session. We 
            do not use third-party marketing trackers or ad-retargeting scripts on our dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3 mt-8">Security</h2>
          <p>
            We implement industry-standard encryption in transit (HTTPS/TLS) and at rest to protect your 
            information. However, no electronic transmission or storage is entirely secure. We encourage you 
            to regularly rotate your API keys via our dashboard if you suspect any compromise.
          </p>
        </section>
      </div>
    </>
  );
}
