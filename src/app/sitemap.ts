import type { MetadataRoute } from "next";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://carlosbaraza.github.io/aparcagratis";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE}/`,
      lastModified: "2026-06-08",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
