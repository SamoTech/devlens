import type { Metadata } from "next";
import PortfolioClient from "./PortfolioClient";

export const metadata: Metadata = {
  title: "Portfolio Dashboard",
  description: "Track and compare health scores across all your GitHub repos in one live dashboard.",
  openGraph: {
    title: "Portfolio Dashboard — DevLens",
    description: "Add any number of repos and track their health scores, trends, and dimensions side by side.",
  },
};

export default function PortfolioPage() {
  return <PortfolioClient />;
}
