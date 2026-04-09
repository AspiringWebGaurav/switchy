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
    <footer className="relative w-full z-10">
      
      {/* Main Footer */}
      <div className="relative z-10 w-full px-8 md:px-16 lg:px-24 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 group">
              <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8 transition-transform group-hover:scale-105">
                <defs>
                  <linearGradient id="footerLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="7" fill="url(#footerLogoGrad)" />
                <rect x="7" y="12" width="18" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
                <circle cx="21" cy="16" r="3" fill="#fff" />
                <path d="M14 7L12 13h2l-1.5 6 4-5.5h-2L16 7z" fill="#fff" opacity="0.9" />
              </svg>
              <span className="font-semibold text-lg text-zinc-800">{SITE_NAME}</span>
            </Link>
            <p className="mt-4 text-sm text-zinc-500 leading-relaxed max-w-xs">
              Real-time mode control for your apps. No redeployments needed.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-zinc-800 text-sm mb-4">Product</h3>
            <ul className="space-y-2.5">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Docs Links */}
          <div>
            <h3 className="font-semibold text-zinc-800 text-sm mb-4">Resources</h3>
            <ul className="space-y-2.5">
              {footerLinks.docs.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="font-semibold text-zinc-800 text-sm mb-4">Get Started</h3>
            <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
              Free to start. No credit card required.
            </p>
            <Link
              href="/dashboard"
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Go to Dashboard
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 w-full">
        <div className="w-full px-8 md:px-16 lg:px-24 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs">
            <Link href="/docs" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-600 transition-colors">
              Docs
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
