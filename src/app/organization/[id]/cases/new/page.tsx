"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFeatureFlag } from "@/design-system";
import CaseForm from "@/app/organization/components/cases/CaseForm";

/**
 * Org-level full-page Add Case (the mockup's Add Case screen). New route, gated
 * by the `cases` flag — when off it redirects to the cases list (there is no
 * legacy screen at this path). Always shows the branch picker (org-level add).
 */
export default function OrgAddCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const on = useFeatureFlag("cases");

  useEffect(() => {
    if (!on) router.replace(`/organization/${id}/cases`);
  }, [on, id, router]);

  if (!on) return null;

  return (
    <CaseForm
      organizationId={id}
      mode="create"
      isOrgMode
      siteId={null}
      cancelHref={`/organization/${id}/cases`}
    />
  );
}
