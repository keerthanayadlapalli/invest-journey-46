import { createFileRoute } from "@tanstack/react-router";
import GrowwApp from "@/components/GrowwApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Groww First Investment — Case Study Prototype" },
      { name: "description", content: "A demo journey helping first-time Gen Z investors understand where to start. No real money." },
      { property: "og:title", content: "Groww First Investment — Case Study Prototype" },
      { property: "og:description", content: "From “I don’t know where to start” to a completed demo investment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GrowwApp,
});
