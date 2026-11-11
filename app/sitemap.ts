// À placer dans : app/sitemap.ts
// Next.js génère automatiquement /sitemap.xml à partir de ce fichier.
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://basket-tv.app";
  // Une entrée par date est inutile : l'agenda est une seule page dynamique.
  // On déclare la page principale ; Google la réindexera régulièrement
  // grâce à la fréquence de mise à jour quotidienne du contenu.
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
