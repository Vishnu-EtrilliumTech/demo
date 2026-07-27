"use client";

import { use } from "react";
import { useFeatureFlag } from "@/design-system";
import CreateCaseLegacy from "./CreateCaseLegacy";
import CaseForm from "@/app/organization/components/cases/CaseForm";

/**
 * Site-level Add Case route. Feature-flagged (`cases`): renders the DS
 * full-page form when on, otherwise the legacy create page unchanged.
 */
export default function SiteAddCasePage({ params }: { params: Promise<{ id: string; siteId: string }> }) {
  const on = useFeatureFlag("cases");
  const { id, siteId } = use(params);

  if (!on) return <CreateCaseLegacy params={params} />;

  return (
    <CaseForm
      organizationId={id}
      mode="create"
      isOrgMode={false}
      siteId={siteId}
      cancelHref={`/organization/${id}/sites/${siteId}#cases`}
    />
  );
}
