'use client'
import "./globals.css";
import { useFeatureFlag } from "@/design-system";
import HomePage from "./home/page";
import LandingNew from "./LandingNew";

/**
 * Root route. Gated on the `landing` flag: DS marketing Landing when on, legacy
 * marketplace HomePage when off (clean rollback, REVAMP_SPEC §3).
 */
export default function Home() {
  const on = useFeatureFlag("landing");
  return on ? <LandingNew /> : <HomePage />;
}
