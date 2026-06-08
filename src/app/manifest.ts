import type { MetadataRoute } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "aparcagratis · zonas SER de Madrid",
    short_name: "aparcagratis",
    description:
      "Mapa de las zonas SER de Madrid: comprueba dónde puedes aparcar según tu etiqueta DGT y horario, y cuánto cuesta.",
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: "standalone",
    background_color: "#f6f3ec",
    theme_color: "#f6f3ec",
    lang: "es",
    categories: ["travel", "navigation", "utilities"],
    icons: [
      {
        src: `${basePath}/icon.svg`,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
