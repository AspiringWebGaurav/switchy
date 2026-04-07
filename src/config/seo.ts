export const SITE_URL = "https://switchyy.vercel.app";
export const SITE_NAME = "Switchyy";
export const SITE_DESCRIPTION =
  "Real-time feature flags and mode control for your apps. Switch between live, maintenance, and custom modes instantly — no redeployments needed.";

export const KEYWORDS = [
  "feature flags",
  "feature flag service",
  "maintenance mode",
  "maintenance page",
  "real-time mode switching",
  "app mode control",
  "kill switch",
  "remote config",
  "feature toggles",
  "instant mode change",
];

export const JSON_LD_WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/docs?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const JSON_LD_SOFTWARE = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    ratingCount: "1",
  },
};
