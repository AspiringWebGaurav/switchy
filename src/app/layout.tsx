import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { verifySession } from "@/lib/services/auth.service";
import { Providers } from "@/components/shared/providers";
import { Navbar } from "@/components/shared/navbar";
import { APP_NAME } from "@/config/constants";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#6366f1",
};

export const metadata: Metadata = {
  title: `${APP_NAME} — Real-time Mode Control for Your Apps`,
  description: `Control how your websites and apps behave in real-time with ${APP_NAME}. Switch between live, maintenance, and custom modes without redeploying.`,
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.svg",
  },
  manifest: "/site.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await verifySession();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers user={user}>
          <Navbar />
          <div className="flex flex-1 flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
