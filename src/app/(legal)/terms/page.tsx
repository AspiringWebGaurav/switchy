import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Switchyy",
};

export default function TermsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl mb-4">Terms of Service</h1>
      <p className="text-sm text-zinc-500 mb-8 border-b border-zinc-100 pb-8">Last Updated: March {new Date().getFullYear()}</p>
      
      <div className="space-y-8 text-zinc-600 leading-relaxed text-base">
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3 mt-8">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Switchyy API, dashboard, and associated services (the &quot;Service&quot;), 
            you agree to be bound by these Terms of Service. If you disagree with any part of the terms, 
            you may not access the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3 mt-8">2. Description of Service</h2>
          <p>
            Switchyy provides real-time feature flagging, mode switching (e.g., maintenance mode), 
            and remote configuration infrastructure for software applications. The Service includes 
            APIs, SDKs, and a web-based management dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3 mt-8">3. API Usage and Fair Use</h2>
          <p className="mb-4">
            You agree to use the Switchyy API responsibly. While we strive to provide real-time updates 
            with minimal latency, the Service is subject to rate limiting and fair usage policies based 
            on your subscription plan.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-600">
            <li>You may not systematically bypass API rate limits or quota boundaries.</li>
            <li>Applications sending abusive or malformed requests may have their API keys temporarily or permanently disabled.</li>
            <li>Automated scraping of the dashboard is strictly prohibited.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3 mt-8">4. Service Level and Availability</h2>
          <p>
            We utilize edge networks to ensure sub-100ms response times globally. However, Switchyy is 
            provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Only customers on select Enterprise Service Level 
            Agreements (SLAs) are guaranteed uptime metrics. We are not liable for any downtime experienced by 
            your applications relying on the Switchyy API.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3 mt-8">5. Account Responsibilities</h2>
          <p>
            You are responsible for safeguarding your project keys and API credentials. Switchyy will never 
            ask for your passwords. Any API usage linked to your credentials, whether authorized by you or not, 
            will be your responsibility and billed to your account.
          </p>
        </section>
      </div>
    </>
  );
}
