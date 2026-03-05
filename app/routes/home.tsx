import type { Route } from "./+types/home";
import { Link } from "react-router";
import { PageLayout } from "~/components/layout";
import Hero from "~/components/Hero";
import Features from "~/components/Features";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "EdgeOne Pages React Router Starter" },
    {
      name: "description",
      content:
        "A comprehensive React Router v7 starter template for EdgeOne Pages. Explore SSR, Pre-render, Node Functions, and Edge Functions.",
    },
  ];
}

export default function Home() {
  return (
    <PageLayout>
      <Hero />
      <Features />
    </PageLayout>
  );
}
