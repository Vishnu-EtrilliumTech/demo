"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchCaseTasks,
  fetchCaseDocuments,
  fetchCaseHearings,
  fetchCaseComments,
  fetchReferenceCases,
} from "@/app/organization/services/caseapi";
import type { CaseHearing } from "@/app/organization/types/caseindex";

export interface CaseTabCounts {
  tasks?: number;
  documents?: number;
  hearings?: number;
  references?: number;
  comments?: number;
}

export interface CaseMeta {
  counts: CaseTabCounts;
  nextHearing: CaseHearing | null;
  loading: boolean;
  /** Re-fetches all of the above (call after add/update/delete of a hearing, task, etc). */
  refetch: () => void;
}

/**
 * Fetches the case-workspace header metadata: per-tab counts (for the tab
 * badges) and the next upcoming hearing (for the KPI hero card). Each source is
 * independent and degrades to undefined/null on failure — the header still
 * renders. Read-only; no mutations.
 */
export function useCaseMeta(organizationId: string, siteId: string, caseId: string): CaseMeta {
  const [counts, setCounts] = useState<CaseTabCounts>({});
  const [nextHearing, setNextHearing] = useState<CaseHearing | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const one = { pageSize: 1 };
    Promise.allSettled([
      fetchCaseTasks(organizationId, siteId, caseId, one),
      fetchCaseDocuments(organizationId, siteId, caseId, one),
      fetchCaseHearings(organizationId, siteId, caseId, { pageSize: 100 }),
      fetchReferenceCases(organizationId, siteId, caseId),
      fetchCaseComments(organizationId, siteId, caseId, one),
    ]).then(([tasks, docs, hearings, refs, comments]) => {
      if (!active) return;
      const next: CaseTabCounts = {};
      if (tasks.status === "fulfilled") next.tasks = tasks.value.totalCount;
      if (docs.status === "fulfilled") next.documents = docs.value.totalCount;
      if (comments.status === "fulfilled") next.comments = comments.value.totalCount;
      if (refs.status === "fulfilled") next.references = refs.value.length;
      if (hearings.status === "fulfilled") {
        next.hearings = hearings.value.totalCount;
        const now = Date.now();
        const upcoming = hearings.value.items
          .filter((h) => new Date(h.hearingDateTime).getTime() > now)
          .sort((a, b) => new Date(a.hearingDateTime).getTime() - new Date(b.hearingDateTime).getTime());
        setNextHearing(upcoming[0] ?? null);
      }
      setCounts(next);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [organizationId, siteId, caseId, version]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  return { counts, nextHearing, loading, refetch };
}
