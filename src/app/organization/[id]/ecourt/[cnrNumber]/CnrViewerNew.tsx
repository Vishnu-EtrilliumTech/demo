"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Home, Building2, FileText, Landmark, ChevronRight, Link2, Search } from "lucide-react";
import { LuiRoot, LoadingState, ErrorState, Dialog, EmptyState } from "@/design-system";
import { useToast } from "@/contexts/ToastContext";
import { CourtDataApiResponse, CourtDataPayload, UnlinkedCase } from "@/app/organization/types/ecourtTypes";
import type { Case } from "@/app/organization/types";
import QuickAddCaseDialog from "@/app/organization/components/cases/QuickAddCaseDialog";
import type { CaseFormSeed } from "@/app/organization/components/cases/useCaseForm";
import {
  fetchCnrCourtData,
  fetchCaseCourtData,
  updateCnrCourtData,
  downloadCnrCourtDocument,
  activateCnrCourtData,
  fetchPersistedEcourtCases,
  fetchUnlinkedCases,
  linkCnrCourtData,
  updatePersistedCaseRemarks,
} from "@/app/organization/services/ecourtapi";
import { fetchCase } from "@/app/organization/services/api";
import { useUserRole } from "@/hooks/useUserRole";
import EcourtDetailsView from "@/app/organization/components/EcourtDetailsView/EcourtDetailsView";
import type { CnrViewerProps } from "./CnrViewerLegacy";

/** Matches the OrgSidebar Tailwind `md:` breakpoint (768px). */
function useSidebarHidden(): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767.95px)");
    const update = () => setHidden(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return hidden;
}

/**
 * DS standalone CNR court-record viewer. Reuses the eCourts service layer and
 * preserves the CNR viewer contract (§J): fetch (with case-data fallback),
 * refresh (quota event), save/retain, role-aware breadcrumbs.
 */
export default function CnrViewerNew({ orgId, cnrNumber, siteId, caseId }: CnrViewerProps) {
  const { showSuccess, showError } = useToast();
  const { isOrganizationAdmin, isOrganizationClerk } = useUserRole(orgId);
  const isOrgUser = isOrganizationAdmin || isOrganizationClerk;
  const isSidebarHidden = useSidebarHidden();

  const [data, setData] = useState<CourtDataPayload | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [caseTitle, setCaseTitle] = useState<string | null>(null);

  // Link-to-case dialog (hidden once already linked, or when viewed from within a case).
  const [isLinked, setIsLinked] = useState(!!(siteId && caseId));
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinked, setUnlinked] = useState<UnlinkedCase[]>([]);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkSearch, setLinkSearch] = useState("");

  // Create-case dialog, pre-filled from this eCourts record.
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!siteId || !caseId) return;
    fetchCase(orgId, siteId, caseId)
      .then((caseData) => setCaseTitle(caseData.title))
      .catch(() => setCaseTitle(null));
  }, [orgId, siteId, caseId]);

  useEffect(() => {
    if (siteId && caseId) return;
    fetchPersistedEcourtCases(orgId, { cnr: cnrNumber })
      .then((page) => {
        if (page.items.some((i) => i.cnrNumber === cnrNumber && i.linkedCaseDetails.length > 0)) {
          setIsLinked(true);
        }
      })
      .catch(() => {});
  }, [orgId, cnrNumber, siteId, caseId]);

  useEffect(() => {
    fetchCnrCourtData(orgId, cnrNumber)
      .then((res: CourtDataApiResponse) => {
        setData(res.data);
        setLastUpdated(res.meta?.lastUpdated ?? null);
        setIsSaved(res.meta?.isSaved === "true");
      })
      .catch(() =>
        fetchCaseCourtData(orgId, cnrNumber).then((res) => {
          if (!res) throw new Error("Case not found.");
          setData(res.data);
          setLastUpdated(res.meta?.lastUpdated ?? null);
          setIsSaved(false);
        }),
      )
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load court data"))
      .finally(() => setLoading(false));
  }, [orgId, cnrNumber]);

  const handleSave = async (remarks: string) => {
    setSaving(true);
    try {
      const res = await activateCnrCourtData(orgId, cnrNumber);
      showSuccess(res?.data?.message ?? "Court data activated successfully");
      setIsSaved(true);
      const trimmedRemarks = remarks.trim();
      if (trimmedRemarks) {
        try {
          await updatePersistedCaseRemarks(orgId, cnrNumber, trimmedRemarks);
        } catch (err) {
          showError(err instanceof Error ? err.message : "Case saved, but failed to save remarks");
        }
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to activate court data");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const res = await updateCnrCourtData(orgId, cnrNumber);
      setData(res.data);
      setLastUpdated(res.meta?.lastUpdated ?? null);
      window.dispatchEvent(new CustomEvent("ecourts-quota-refresh"));
    } finally {
      setUpdating(false);
    }
  };

  const openLink = async () => {
    setLinkOpen(true);
    setUnlinked([]);
    setLinkSearch("");
    setLinkLoading(true);
    try {
      setUnlinked((await fetchUnlinkedCases(orgId)).items);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load cases");
      setLinkOpen(false);
    } finally {
      setLinkLoading(false);
    }
  };

  const doLink = async (c: UnlinkedCase) => {
    setLinkOpen(false);
    try {
      await linkCnrCourtData(orgId, c.siteId, String(c.id), cnrNumber);
      showSuccess(`${cnrNumber} is successfully linked with ${c.title}`);
      setIsLinked(true);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to link case");
    }
  };

  // Pre-fill the create-case form from the court record. Frontend-only fields
  // (court/parties/case type) are carried through for preview; only the fields
  // the API persists are actually saved.
  const createSeed = useMemo<CaseFormSeed | undefined>(() => {
    if (!data) return undefined;
    const cd = data.courtCaseData;
    const p = cd.petitioners?.[0] ?? "";
    const r = cd.respondents?.[0] ?? "";
    const title = p && r ? `${p} v. ${r}` : p || r || "";
    return {
      id: "",
      title,
      caseNumber: cd.caseNumber ?? "",
      cnrNumber: cd.cnr || cnrNumber,
      court: cd.courtName ?? "",
      caseType: cd.caseTypeRaw ?? "",
      petitioner: p,
      respondent: r,
    };
  }, [data, cnrNumber]);

  // After a case is created from this CNR, link the two so the record reflects
  // the association (and the Create/Link buttons drop away).
  const handleCaseCreated = async (created?: Case) => {
    if (!created?.id || !created?.siteId) return;
    try {
      await linkCnrCourtData(orgId, String(created.siteId), String(created.id), cnrNumber);
      showSuccess(`${cnrNumber} is successfully linked with ${created.title}`);
      setIsLinked(true);
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Case created, but linking to this CNR failed. You can link it manually.",
      );
    }
  };

  const linkedFilter = unlinked.filter((c) => {
    if (!linkSearch.trim()) return true;
    const t = linkSearch.toLowerCase();
    return c.caseNumber.toLowerCase().includes(t) || c.title.toLowerCase().includes(t);
  });

  const breadcrumbs = (
    <nav className="crumbs" aria-label="breadcrumb" style={{ flexWrap: "wrap", marginBottom: 18 }}>
      {isSidebarHidden && (
        <>
          {isOrgUser ? (
            <Link
              href={`/organization/${orgId}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <Home aria-hidden style={{ width: 15, height: 15 }} /> Organizations
            </Link>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "default" }}>
              <Home aria-hidden style={{ width: 15, height: 15 }} /> Organizations
            </span>
          )}
          <ChevronRight aria-hidden />
        </>
      )}
      {siteId && caseId ? (
        <>
          <Link href={`/organization/${orgId}/cases`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Building2 aria-hidden style={{ width: 15, height: 15 }} /> Cases
          </Link>
          <ChevronRight aria-hidden />
          <Link
            href={`/organization/${orgId}/sites/${siteId}/cases/${caseId}?tab=references`}
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <FileText aria-hidden style={{ width: 15, height: 15 }} /> {caseTitle ?? "Case"}
          </Link>
          <ChevronRight aria-hidden />
        </>
      ) : (
        <>
          <Link href={`/organization/${orgId}/ecourts`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Landmark aria-hidden style={{ width: 15, height: 15 }} /> eCourts
          </Link>
          <ChevronRight aria-hidden />
        </>
      )}
      <span className="cur" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Landmark aria-hidden style={{ width: 15, height: 15 }} /> {cnrNumber}
      </span>
    </nav>
  );

  return (
    <LuiRoot>
      <div className="sheet">
        {breadcrumbs}
        {loading ? (
          <LoadingState message="Loading court data…" />
        ) : error ? (
          <ErrorState title="Failed to load court data" description={error} />
        ) : data ? (
          <EcourtDetailsView
            data={data}
            downloadFn={(orderUrl) => downloadCnrCourtDocument(orgId, cnrNumber, orderUrl)}
            lastUpdated={lastUpdated}
            onUpdate={handleUpdate}
            updating={updating}
            onSave={handleSave}
            saving={saving}
            isSaved={isSaved}
            onLink={isLinked ? undefined : openLink}
            onCreateCase={isLinked ? undefined : () => setCreateOpen(true)}
          />
        ) : null}
      </div>

      <QuickAddCaseDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        organizationId={orgId}
        isOrgMode={!siteId}
        siteId={siteId ?? null}
        seed={createSeed}
        onSuccess={handleCaseCreated}
      />

      <Dialog open={linkOpen} onClose={() => setLinkOpen(false)} title="Link to a case" icon={Link2} small>
        <div className="searchbox" style={{ marginBottom: 12, width: "100%" }}>
          <Search aria-hidden />
          <input autoFocus placeholder="Search cases…" value={linkSearch} onChange={(e) => setLinkSearch(e.target.value)} />
        </div>
        {linkLoading ? (
          <LoadingState message="Loading…" size="sm" />
        ) : linkedFilter.length === 0 ? (
          <EmptyState title={linkSearch ? "No cases match your search" : "No unlinked cases available"} />
        ) : (
          <div className="ec-picklist">
            {linkedFilter.map((c) => (
              <button key={c.id} type="button" onClick={() => doLink(c)}>
                <b>{c.caseNumber}</b>
                <span>{c.title}</span>
              </button>
            ))}
          </div>
        )}
      </Dialog>
    </LuiRoot>
  );
}
