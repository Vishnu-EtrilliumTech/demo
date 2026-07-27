"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Pill,
  DataTable,
  LoadingState,
  EmptyState,
  Dialog,
  Input,
  type Column,
  type PillTone,
} from "@/design-system";
import {
  fetchReferenceCases,
  addReferenceCase,
  deleteReferenceCase,
  type ReferenceCaseItem,
} from "@/app/organization/services/caseapi";
import { useToast } from "@/contexts/ToastContext";

interface ReferenceCaseTabProps {
  caseId: string;
  siteId: string;
  organizationId: string;
  canCreateOrEditResource?: boolean;
  canDeleteResource?: boolean;
}

const statusTone = (status: string): PillTone => {
  const s = status?.toUpperCase();
  if (s === "DISPOSED") return "ok";
  if (s === "PENDING") return "warn";
  if (s === "DISMISSED") return "danger";
  return "neutral";
};

const deriveCaseTitle = (item: ReferenceCaseItem): string => {
  const cd = item.caseDetails?.courtCaseData as
    | { petitioners?: string[]; respondents?: string[] }
    | null;
  if (!cd) return "—";
  const petitioner = cd.petitioners?.[0] ?? "";
  const respondent = cd.respondents?.[0] ?? "";
  if (!petitioner && !respondent) return "—";
  if (!respondent) return petitioner;
  if (!petitioner) return respondent;
  return `${petitioner} vs ${respondent}`;
};

export const ReferenceCaseTab: React.FC<ReferenceCaseTabProps> = ({
  caseId,
  siteId,
  organizationId,
  canCreateOrEditResource = true,
  canDeleteResource = true,
}) => {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [referenceCases, setReferenceCases] = useState<ReferenceCaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [cnrInput, setCnrInput] = useState("");
  const [adding, setAdding] = useState(false);

  const loadReferenceCases = useCallback(() => {
    fetchReferenceCases(organizationId, siteId, caseId)
      .then((data) => setReferenceCases(data))
      .catch((err: unknown) =>
        showError(
          err instanceof Error ? err.message : "Failed to load reference cases",
        ),
      )
      .finally(() => setLoading(false));
  }, [organizationId, siteId, caseId, showError]);

  useEffect(() => {
    loadReferenceCases();
  }, [loadReferenceCases]);

  const handleCloseDialog = () => {
    setAddOpen(false);
    setCnrInput("");
  };

  const handleAddReference = async () => {
    const trimmed = cnrInput.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      const message = await addReferenceCase(
        organizationId,
        siteId,
        caseId,
        trimmed,
      );
      handleCloseDialog();
      showSuccess(message ?? "Reference case added successfully");
      const data = await fetchReferenceCases(organizationId, siteId, caseId);
      setReferenceCases(data);
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "Failed to add reference case",
      );
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteReference = async (cnrNumber: string) => {
    try {
      const message = await deleteReferenceCase(
        organizationId,
        siteId,
        caseId,
        cnrNumber,
      );
      setReferenceCases((prev) =>
        prev.filter((r) => r.cnrNumber !== cnrNumber),
      );
      showSuccess(message);
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "Failed to delete reference case",
      );
    }
  };

  const courtCaseData = (item: ReferenceCaseItem) =>
    (item.caseDetails?.courtCaseData as
      | { courtName?: string; caseStatus?: string; caseType?: string }
      | null) ?? null;

  const columns: Column<ReferenceCaseItem>[] = [
    {
      key: "cnr",
      header: "CNR Number",
      render: (item) => (
        <button
          type="button"
          className="chip-mono"
          title={item.cnrNumber}
          onClick={() =>
            router.push(
              `/organization/${organizationId}/ecourt/${item.cnrNumber}?siteId=${siteId}&caseId=${caseId}`,
            )
          }
          style={{ cursor: "pointer", fontFamily: "inherit" }}
        >
          <LinkIcon aria-hidden />
          <b>{item.cnrNumber}</b>
        </button>
      ),
    },
    {
      key: "title",
      header: "Case Title",
      render: (item) => (
        <span
          title={deriveCaseTitle(item)}
          style={{
            display: "inline-block",
            maxWidth: 260,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            verticalAlign: "middle",
          }}
        >
          {deriveCaseTitle(item)}
        </span>
      ),
    },
    {
      key: "court",
      header: "Court",
      render: (item) => {
        const courtName = courtCaseData(item)?.courtName;
        return (
          <span
            title={courtName ?? ""}
            style={{
              display: "inline-block",
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              verticalAlign: "middle",
            }}
          >
            {courtName ?? "—"}
          </span>
        );
      },
    },
    {
      key: "type",
      header: "Case Type",
      render: (item) => courtCaseData(item)?.caseType ?? "—",
    },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        const status = courtCaseData(item)?.caseStatus;
        return status ? (
          <Pill tone={statusTone(status)} dot>
            {status}
          </Pill>
        ) : (
          <span style={{ color: "var(--text-3)" }}>—</span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (item) =>
        canDeleteResource ? (
          <Button
            variant="ghost"
            icon={Trash2}
            title="Delete reference"
            aria-label="delete reference"
            onClick={() => handleDeleteReference(item.cnrNumber)}
          />
        ) : null,
    },
  ];

  return (
    <div>
      <div className="toolbar">
        <span className="cnt">
          Reference Cases ({referenceCases.length})
        </span>
        <span className="grow" />
        {canCreateOrEditResource && (
          <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>
            Add CNR Reference
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingState message="Loading reference cases…" />
      ) : referenceCases.length === 0 ? (
        <EmptyState
          icon={LinkIcon}
          title="No reference cases yet"
          description={
            canCreateOrEditResource
              ? 'Use the "Add CNR Reference" button to link CNR numbers.'
              : "No reference cases are linked to this case yet."
          }
          action={
            canCreateOrEditResource ? (
              <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>
                Add CNR Reference
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={referenceCases}
          getRowKey={(item) => item.cnrNumber}
        />
      )}

      <Dialog
        open={addOpen}
        onClose={handleCloseDialog}
        title="Add Reference Case"
        icon={LinkIcon}
        small
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseDialog} disabled={adding}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={adding}
              disabled={adding || !cnrInput.trim()}
              onClick={handleAddReference}
            >
              Add
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          placeholder="e.g., DLST010003252013"
          value={cnrInput}
          onChange={(e) => setCnrInput(e.target.value)}
          disabled={adding}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddReference();
          }}
        />
      </Dialog>
    </div>
  );
};
