import { createFileRoute } from "@tanstack/react-router";
import FemaApp from "@/components/FemaApp";
import { AuthGate } from "@/components/AuthGate";

function Home() {
  return <AuthGate>{() => <FemaApp />}</AuthGate>;
}

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Fema — Atelier Académique IA" },
      {
        name: "description",
        content:
          "Plateforme éducative (Collège, Lycée, Université) : correction d'épreuves par photo, fiches de révision et quiz adaptés à ton profil.",
      },
      { property: "og:title", content: "Fema — Atelier Académique IA" },
      {
        property: "og:description",
        content:
          "Correction d'épreuves par photo et PDF, fiches de révision et quiz adaptés au profil de chaque élève et étudiant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});
