import { createFileRoute } from "@tanstack/react-router";
import GrowwApp from "@/components/GrowwApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Groww — Your starting options" },
      { name: "description", content: "Understand investment categories, compare your starting options and choose what to explore with Groww." },
      { property: "og:title", content: "Groww — Your starting options" },
      { property: "og:description", content: "Explore and compare investment categories based on your goals, time horizon and investing preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GrowwApp,
});
