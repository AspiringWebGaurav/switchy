import { Metadata } from "next";

export const metadata: Metadata = {
  title: "License & EULA",
  description: "Proprietary Software License for Switchyy",
};

export default function LicensePage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl mb-4">License & EULA</h1>
      <p className="text-sm text-zinc-500 mb-8 border-b border-zinc-100 pb-8">Last Updated: March {new Date().getFullYear()}</p>
      
      <div className="space-y-8 text-zinc-600 leading-relaxed text-base">
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3 mt-8">1. Grant of License</h2>
          <p>
            Switchyy is a proprietary, cloud-hosted SaaS product. Upon registration and continuous payment 
            of applicable subscription fees, Switchyy grants you a revocable, non-exclusive, non-transferable, 
            limited license to access and use the API and Dashboard for your internal business purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3 mt-8">2. Intellectual Property Rights</h2>
          <p>
            The Service, including its core technology, architecture, algorithms, user interface, and SDKs, 
            remains the exclusive property of Switchyy and its licensors. This EULA does not grant you 
            any ownership interest in or to the underlying software.
            <br/><br/>
            <strong>You own your data:</strong> Any project configurations, feature flags, and environment details 
            you create belong entirely to you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3 mt-8">3. Restrictions on Use</h2>
          <p className="mb-4">
            Under this proprietary license, you shall not (and shall not permit any third party to):
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-600">
            <li>Reverse engineer, decompile, or disassemble the Switchyy API or SDKs.</li>
            <li>Use the Service to build a competitive product or service.</li>
            <li>Resell, sublicense, or distribute your API access to third parties outside of your organizational usage.</li>
            <li>Perform any security stress-testing, vulnerability scanning, or penetration testing without our express prior written consent.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3 mt-8">4. Software as a Service (SaaS) Bounds</h2>
          <p>
            The Switchyy code is not open-source. You are subscribing to a managed service. There is no right 
            to receive the source code for the backend infrastructure. Any client-side SDKs provided by Switchyy 
            may be subject to separate open-source bindings (e.g., MIT), but the core Switchyy engine remains 
            strictly proprietary.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3 mt-8">5. Limitation of Liability</h2>
          <p>
            IN NO EVENT SHALL SWITCHYY BE LIABLE FOR ANY CONSEQUENTIAL, INCIDENTAL, INDIRECT, SPECIAL, PUNITIVE, 
            OR OTHER LOSS OR DAMAGE WHATSOEVER. THIS INCLUDES, WITHOUT LIMITATION, LOSS OF BUSINESS PROFITS, 
            APP DOWNTIME, OR BUSINESS INTERRUPTION ARISING OUT OF OR IN CONNECTION WITH THE USE OR INABILITY 
            TO USE THE SERVICE.
          </p>
        </section>
      </div>
    </>
  );
}
