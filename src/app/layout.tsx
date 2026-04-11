import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { verifySession } from "@/lib/services/auth.service";
import { Providers } from "@/components/shared/providers";
import { Navbar } from "@/components/shared/navbar";
import { Analytics } from "@/components/shared/analytics";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  KEYWORDS,
  JSON_LD_WEBSITE,
  JSON_LD_SOFTWARE,
} from "@/config/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Real-time Mode Control for Your Apps`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Real-time Mode Control for Your Apps`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Real-time Mode Control for Your Apps`,
    description: SITE_DESCRIPTION,
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: SITE_URL,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await verifySession();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href={SITE_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([JSON_LD_WEBSITE, JSON_LD_SOFTWARE]),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Analytics />
        <Providers user={user}>
          <Navbar />
          <div className="flex flex-1 flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
