"use client";

import { useFeatureFlag } from "@/design-system";
import CasesLegacy from "./CasesLegacy";
import CasesNew from "./CasesNew";

/**
 * Cases list route. Feature-flagged migration (`cases`): the design-system
 * Cases screen renders when the flag is on; otherwise the legacy screen is
 * served unchanged. Toggling the flag off restores legacy cleanly.
 */
export default function CasesPageGate({ params }: { params: Promise<{ id: string }> }) {
  const useNewCases = useFeatureFlag("cases");
  return useNewCases ? <CasesNew params={params} /> : <CasesLegacy params={params} />;
}
