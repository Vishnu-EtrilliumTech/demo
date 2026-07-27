import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Workbench from "./Workbench";

export const metadata: Metadata = { title: "Lawsome UI — Workbench" };

/**
 * Dev-only component workbench (REVAMP_SPEC §7). Renders every design-system
 * component in its states and demonstrates the feature-flag toggle. Returns 404
 * in production so it is never reachable in a real deployment.
 */
export default function WorkbenchPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Workbench />;
}
