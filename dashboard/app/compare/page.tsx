import type { Metadata } from "next";
import CompareClient from "./CompareClient";

export const metadata: Metadata = {
  title: "Compare",
  description: "Compare two GitHub repositories side by side across all 9 health dimensions.",
};

export default function ComparePage() {
  return <CompareClient />;
}
