"use client";

import { use } from "react";
import { useFeatureFlag } from "@/design-system";
import EditCaseLegacy from "./EditCaseLegacy";
import EditCaseForm from "@/app/organization/components/cases/EditCaseForm";

/**
 * Case edit route. Feature-flagged (`cases`): renders the DS full-page edit
 * form when on, otherwise the legacy edit page unchanged.
 */
export default function EditCasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; siteId: string; caseId: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const on = useFeatureFlag("cases");
  const { id, siteId, caseId } = use(params);
  const sp = searchParams ? use(searchParams) : {};

  if (!on) return <EditCaseLegacy params={params} searchParams={searchParams} />;

  return (
    <EditCaseForm
      organizationId={id}
      siteId={siteId}
      caseId={caseId}
      cancelHref={`/organization/${id}/sites/${siteId}/cases/${caseId}`}
      returnTo={sp?.returnTo}
    />
  );
}
