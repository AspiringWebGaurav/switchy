import { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/config/seo";

export const metadata: Metadata = {
  title: {
    default: "Documentation",
    template: `%s | Docs | ${SITE_NAME}`,
  },
  description: `Learn how to integrate ${SITE_NAME} into your app. Comprehensive documentation for feature flags, mode switching, and real-time updates.`,
  alternates: {
    canonical: `${SITE_URL}/docs`,
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Documentation",
        item: `${SITE_URL}/docs`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
