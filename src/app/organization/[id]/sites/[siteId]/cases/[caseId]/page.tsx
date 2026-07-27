"use client";

import { useFeatureFlag } from "@/design-system";
import CaseWorkspaceLegacy from "./CaseWorkspaceLegacy";
import CaseWorkspaceNew from "./CaseWorkspaceNew";

/**
 * Case workspace route. Feature-flagged migration (`case-workspace`): the DS
 * workspace shell renders when the flag is on; otherwise the legacy screen is
 * served unchanged. Toggling the flag off restores legacy cleanly.
 */
export default function CaseWorkspacePage(props: {
  params: Promise<{ id: string; siteId: string; caseId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const useNewWorkspace = useFeatureFlag("case-workspace");
  return useNewWorkspace ? <CaseWorkspaceNew {...props} /> : <CaseWorkspaceLegacy {...props} />;
}
