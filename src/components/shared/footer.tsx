import Link from "next/link";
import { SITE_NAME } from "@/config/seo";

const footerLinks = {
  product: [
    { label: "Feature Flags", href: "/feature-flags" },
    { label: "Maintenance Mode", href: "/maintenance-mode" },
    { label: "Real-Time Switching", href: "/real-time-mode-switching" },
  ],
  docs: [
    { label: "Documentation", href: "/docs" },
    { label: "Feature Flags Guide", href: "/docs/feature-flags" },
    { label: "Mode Switching", href: "/docs/mode-switching" },
    { label: "Architecture", href: "/docs/architecture" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
                <defs>
                  <linearGradient id="footerLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="6" fill="url(#footerLogoGrad)" />
                <rect x="7" y="12" width="18" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
                <circle cx="21" cy="16" r="3" fill="#fff" />
                <path d="M14 7L12 13h2l-1.5 6 4-5.5h-2L16 7z" fill="#fff" opacity="0.9" />
              </svg>
              <span className="font-bold text-stone-900">{SITE_NAME}</span>
            </Link>
            <p className="mt-3 text-sm text-stone-500">
              Real-time mode control for your apps. No redeployments needed.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-stone-900 text-sm mb-3">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Docs Links */}
          <div>
            <h3 className="font-semibold text-stone-900 text-sm mb-3">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.docs.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="font-semibold text-stone-900 text-sm mb-3">Get Started</h3>
            <p className="text-sm text-stone-500 mb-3">
              Free to start. No credit card required.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Go to Dashboard →
            </Link>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-stone-400">
            <Link href="/docs" className="hover:text-stone-600">
              Docs
            </Link>
            <span>•</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-600"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
